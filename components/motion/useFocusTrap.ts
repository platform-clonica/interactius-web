'use client'

import { useEffect, type RefObject } from 'react'

/**
 * useFocusTrap — mantiene el foco dentro de un contenedor mientras está activo.
 *
 * - Ciclo Tab / Shift+Tab limitado a elementos focusables del contenedor.
 * - Al activarse, mueve el foco al primer elemento focusable (o a initialFocus si se pasa).
 * - Al desactivarse, restaura el foco al elemento que lo tenía antes.
 * - Escape dispara onEscape() (opcional).
 *
 * Aplica solo cuando `active === true`. Cuando es false, no hace nada.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
): void {
  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    // Mueve foco al primer elemento focusable tras un micro-delay para que la
    // transición CSS (height 0→100vh) tenga tiempo de completar y no rompa UX.
    const focusTimer = window.setTimeout(() => {
      const focusables = getFocusable(container)
      focusables[0]?.focus()
    }, 50)

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onEscape?.()
        return
      }

      if (e.key !== 'Tab') return

      const focusables = getFocusable(container)
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeydown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeydown)
      // Restaura el foco al elemento que lo tenía antes de abrirse el trap.
      previouslyFocused?.focus?.()
    }
  }, [active, containerRef, onEscape])
}

/* ==========================================================================
   Helpers
   ========================================================================== */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusable(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  )
  return elements.filter((el) => {
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') {
      return false
    }
    return !el.hasAttribute('inert')
  })
}
