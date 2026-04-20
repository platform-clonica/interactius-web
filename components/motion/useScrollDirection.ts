'use client'

import { useEffect, useState } from 'react'

type Direction = 'up' | 'down' | null

interface Options {
  /**
   * Mínimo scrollY antes de empezar a devolver 'down'. Por debajo de este
   * valor el hook siempre devuelve 'up' (o null si nunca se ha movido).
   * Default: 0.
   */
  threshold?: number
  /**
   * Mínimo delta entre frames para considerar que hubo movimiento. Evita
   * oscilaciones de 1-2px causadas por inercia/gomas del trackpad.
   * Default: 4.
   */
  minDelta?: number
}

/**
 * Devuelve la dirección actual del scroll vertical — 'up', 'down' o null.
 * - null: antes de cualquier scroll (primer render).
 * - 'up': scroll hacia arriba, O scrollY ≤ threshold.
 * - 'down': scroll hacia abajo con scrollY > threshold.
 *
 * Optimizaciones:
 * - Listener pasivo dentro de requestAnimationFrame.
 * - setState solo cuando la dirección cambia (short-circuit).
 * - Cleanup completo en unmount (RAF + listener).
 */
export function useScrollDirection({
  threshold = 0,
  minDelta = 4,
}: Options = {}): Direction {
  const [direction, setDirection] = useState<Direction>(null)

  useEffect(() => {
    let lastY = window.scrollY
    let rafId = 0
    let ticking = false

    const update = () => {
      ticking = false
      const y = window.scrollY
      const delta = y - lastY

      // Ignora movimientos minúsculos
      if (Math.abs(delta) < minDelta) return

      // Por debajo del threshold, siempre 'up' (header visible).
      if (y <= threshold) {
        setDirection((prev) => (prev === 'up' ? prev : 'up'))
        lastY = y
        return
      }

      const next: Direction = delta > 0 ? 'down' : 'up'
      setDirection((prev) => (prev === next ? prev : next))
      lastY = y
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      rafId = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [threshold, minDelta])

  return direction
}
