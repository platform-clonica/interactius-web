/**
 * heroLock — diagnóstico del bug intermitente del hero (strip fullscreen +
 * scroll lock). Captura el estado relevante en console.warn con un prefijo
 * grepeable. Si el usuario reporta el bug con DevTools abierto, los logs
 * indican qué camino del bug ocurrió.
 *
 * No tiene dependencias: importable desde server y client builds, los
 * acceso a `window/document` están guarded.
 */

import { useMenuStore } from '@/lib/store/menu'

const PREFIX = '[HERO-LOCK]'

interface LockSnapshot {
  reason: string
  htmlOverflow: string
  bodyOverflow: string
  scrollY: number
  menuOpen: boolean
  documentHidden: boolean
  navigationType: string
  extra?: Record<string, unknown>
}

function getNavigationType(): string {
  if (typeof performance === 'undefined') return 'unknown'
  const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  return entries[0]?.type ?? 'unknown'
}

export function snapshot(reason: string, extra?: Record<string, unknown>): LockSnapshot | null {
  if (typeof document === 'undefined') return null
  return {
    reason,
    htmlOverflow: document.documentElement.style.overflow || '',
    bodyOverflow: document.body.style.overflow || '',
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    menuOpen: useMenuStore.getState().isOpen,
    documentHidden: document.hidden,
    navigationType: getNavigationType(),
    extra,
  }
}

export function warn(reason: string, extra?: Record<string, unknown>): void {
  const snap = snapshot(reason, extra)
  if (!snap) return
  // console.warn (no console.error) — visible en DevTools sin disparar Sentry
  // ni romper E2E. El prefijo permite filtrar con "[HERO-LOCK]" en la consola.
  // eslint-disable-next-line no-console
  console.warn(PREFIX, snap)
  // Opcional: forward a GA4 si el usuario consintió analytics. Falla en silencio.
  try {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void }
    if (typeof w.gtag === 'function') {
      w.gtag('event', 'hero_lock_detected', {
        reason,
        scrollY: snap.scrollY,
        navigationType: snap.navigationType,
        ...extra,
      })
    }
  } catch {
    /* swallow */
  }
}
