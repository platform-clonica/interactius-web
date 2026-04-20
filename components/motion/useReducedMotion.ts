'use client'

/**
 * useReducedMotion — hook SSR-safe para `prefers-reduced-motion: reduce`.
 *
 * Contrato:
 * - Durante SSR devuelve `false` (el peor caso para accesibilidad, pero el
 *   único consistente sin window). La CSS global @media (prefers-reduced-motion)
 *   en globals.css neutraliza animaciones declarativas incluso cuando el hook
 *   devuelve false.
 * - En el primer render de cliente devuelve `false` también (mismo snapshot
 *   que SSR → zero hydration mismatch).
 * - Tras commit, si el usuario tiene la preferencia activa, re-renderiza con
 *   `true`. Esto es intencional: el componente ajusta su comportamiento sin
 *   causar mismatch.
 *
 * Uso recomendado:
 *   const reduced = useReducedMotion()
 *   useEffect(() => {
 *     if (reduced) return
 *     // instanciar GSAP timeline, canvas, etc.
 *   }, [reduced])
 */

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/* ==========================================================================
   MediaQueryList singleton — se crea la primera vez que se usa y se
   comparte entre todos los consumers. Listeners deduplicados vía Set.
   ========================================================================== */

let mql: MediaQueryList | null = null
const listeners = new Set<() => void>()

function getMql(): MediaQueryList | null {
  if (typeof window === 'undefined') return null
  if (mql) return mql
  mql = window.matchMedia(QUERY)
  mql.addEventListener('change', notifyAll)
  return mql
}

function notifyAll() {
  for (const fn of listeners) fn()
}

/* ==========================================================================
   Store API (compatible con useSyncExternalStore)
   ========================================================================== */

function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  // Asegura que el MQL existe y está listo para notificar
  getMql()
  return () => {
    listeners.delete(callback)
  }
}

/** Snapshot del cliente. Llamado solo tras hydration. */
function getClientSnapshot(): boolean {
  const instance = getMql()
  return instance ? instance.matches : false
}

/** Snapshot del servidor. Siempre false. */
function getServerSnapshot(): boolean {
  return false
}

/* ==========================================================================
   API pública
   ========================================================================== */

/**
 * Hook reactivo — se re-renderiza si la preferencia cambia durante la sesión.
 * Caso real: usuario toggle-a "Reduce motion" en ajustes del sistema con la
 * pestaña abierta. El componente reacciona sin recarga.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}

/**
 * Lectura síncrona fuera de render. Útil dentro de useEffect o handlers
 * imperativos donde no queremos causar re-render del componente al
 * comprobar la preferencia.
 */
export function getReducedMotion(): boolean {
  return getClientSnapshot()
}

/**
 * Subscripción manual para código imperativo (p.ej. GSAP ScrollTrigger que
 * debe destruirse si el usuario activa reduced-motion mid-session).
 * Devuelve la función de unsubscribe.
 */
export function subscribeReducedMotion(
  callback: (reduced: boolean) => void,
): () => void {
  const handler = () => callback(getClientSnapshot())
  return subscribe(handler)
}
