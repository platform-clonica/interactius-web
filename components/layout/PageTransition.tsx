'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { usePathname } from '@/lib/i18n/routing'
import { useReducedMotion } from '@/components/motion/useReducedMotion'
import { useMenuStore } from '@/lib/store/menu'

/**
 * PageTransition — overlay warm-light que barre la pantalla en cambios de ruta.
 *
 * Técnica (A14):
 * - Un <motion.div fixed> con bg-warm-light y clip-path animado.
 * - Cuando cambia el pathname, AnimatePresence desmonta el anterior (exit)
 *   y monta el nuevo (initial → animate).
 * - El overlay no envuelve el contenido: solo se superpone. Los children
 *   siguen fluyendo sin re-key para preservar estado de scroll e inputs.
 *
 * Fases por cambio de ruta:
 * 1. Ruta A visible. El usuario clica Link.
 * 2. Overlay entra desde la izquierda, cubre la pantalla (exit del overlay
 *    keyed a ruta A).
 * 3. Next monta ruta B debajo del overlay.
 * 4. Overlay sale hacia la derecha, revelando ruta B (animate del overlay
 *    keyed a ruta B).
 *
 * Reduced-motion: bypass completo, navegación instantánea.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduced = useReducedMotion()
  const closeMenu = useMenuStore((s) => s.close)
  const firstMount = useRef(true)

  // Cierra el menú en cada cambio de pathname. Complementa el close() que
  // hacen los Links en onClick — cubre back/forward, navegación programática
  // y cualquier caso donde el Link no triggeree el handler.
  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false
      return
    }
    closeMenu()
    // Scroll-to-top defensivo — App Router lo hace por defecto pero algunos
    // navegadores mantienen la posición en transiciones custom.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, closeMenu])

  // Reduced-motion: renderiza children directo sin overlay.
  if (reduced) {
    return <>{children}</>
  }

  return (
    <>
      {children}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          aria-hidden="true"
          className="fixed inset-0 z-page-transition bg-warm-light"
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{
            clipPath: 'inset(0 100% 0 0)',
            transition: { duration: 0 },
          }}
          exit={{
            clipPath: 'inset(0 0% 0 0)',
            transition: {
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
            },
          }}
          style={{
            // Durante la fase final del reveal no queremos interceptar clicks.
            pointerEvents: 'none',
          }}
        />
      </AnimatePresence>
    </>
  )
}
