/**
 * Menu store — estado global del MenuOverlay.
 *
 * Consumers:
 * - Sidebar → trigger (hamburguesa)
 * - MenuOverlay → isOpen determina clases de altura/visibilidad
 * - PageTransition → close() al iniciar navegación
 * - Header (eventualmente) → si el menú se abriera desde él también
 *
 * Decisión de scope: el scroll lock vive aquí para que cualquier componente
 * que toggle-a el menú tenga el mismo comportamiento sin duplicar lógica.
 */

import { create } from 'zustand'

interface MenuState {
  isOpen: boolean
  /** True mientras corre la cortina de transición. PageTransition lo consulta
   *  para NO disparar close() mid-cortina cuando cambia el pathname. */
  curtainActive: boolean
  /** Contador que incrementa cada vez que un componente externo al MenuOverlay
   *  (ej. MenuTrigger) pide cierre con cortina. MenuOverlay escucha. */
  curtainCloseSignal: number
  open: () => void
  close: () => void
  toggle: () => void
  beginCurtain: () => void
  endCurtain: () => void
  requestCurtainClose: () => void
}

export const useMenuStore = create<MenuState>((set, get) => ({
  isOpen: false,
  curtainActive: false,
  curtainCloseSignal: 0,
  open: () => {
    if (get().isOpen) return
    lockBodyScroll(true)
    set({ isOpen: true })
  },
  close: () => {
    if (!get().isOpen) return
    lockBodyScroll(false)
    set({ isOpen: false })
  },
  toggle: () => {
    const next = !get().isOpen
    lockBodyScroll(next)
    set({ isOpen: next })
  },
  beginCurtain: () => set({ curtainActive: true }),
  endCurtain: () => {
    lockBodyScroll(false)
    set({ isOpen: false, curtainActive: false })
  },
  requestCurtainClose: () =>
    set((s) => ({ curtainCloseSignal: s.curtainCloseSignal + 1 })),
}))

/* ==========================================================================
   Scroll lock — bloquea el scroll del documento cuando el overlay está abierto.
   Importante: evitamos `body{position:fixed}` porque rompe la composición
   visual en páginas con capas `position: fixed` (p.ej. Home hero).
   ========================================================================== */

/**
 * Compat API: antes reseteaba el scroll guardado para el unlock basado en
 * `body{position:fixed}`. Con el lock actual (overflow hidden) no hace falta,
 * pero mantenemos la función para no romper callers existentes.
 */
export function resetSavedScroll(): void {
  // no-op intencional
}

function lockBodyScroll(lock: boolean): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const body = document.body

  if (lock) {
    root.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    root.style.overscrollBehavior = 'none'
    body.style.overscrollBehavior = 'none'
  } else {
    root.style.overflow = ''
    body.style.overflow = ''
    root.style.overscrollBehavior = ''
    body.style.overscrollBehavior = ''
  }
}
