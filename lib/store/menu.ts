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
   Scroll lock — bloquea el scroll del body cuando el overlay está abierto.
   Guarda el scroll-y previo para restaurarlo al cerrar.
   ========================================================================== */

let savedScrollY = 0

function lockBodyScroll(lock: boolean): void {
  if (typeof document === 'undefined') return
  const body = document.body

  if (lock) {
    savedScrollY = window.scrollY
    body.style.position = 'fixed'
    body.style.top = `-${savedScrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
  } else {
    body.style.position = ''
    body.style.top = ''
    body.style.left = ''
    body.style.right = ''
    body.style.width = ''
    window.scrollTo(0, savedScrollY)
  }
}
