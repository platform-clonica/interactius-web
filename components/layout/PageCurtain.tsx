'use client'

import { useEffect, useRef } from 'react'

import { useRouter, type RouteId } from '@/lib/i18n/routing'
import { usePageCurtainStore } from '@/lib/store/curtain'
import { getReducedMotion } from '@/components/motion/useReducedMotion'

/* ==========================================================================
   PageCurtain — cortina global de transición entre páginas
   --------------------------------------------------------------------------
   Renderizada una sola vez en el root layout (main). Escucha el store
   `usePageCurtainStore` y, cuando `isActive` pasa a true, ejecuta:

     · cover (clipPath inset(0 100% 0 0) → inset(0 0% 0 0))
       0.7s, power4.inOut — el panel warm-light cubre desde la izquierda
     · navigate(targetHref) al completar el cover (t=0.7s)
     · hold 0.15s — buffer para que Next.js renderice el destino
     · uncover (clipPath inset(0 0% 0 0) → inset(0 0% 0 100%))
       1.25s, power4.inOut — el panel se pliega a la derecha
     · endPageCurtain() — reset estado

   Total ~2.10s. Reduced-motion: navega instantáneamente sin cortina.

   Coherente con el patrón canónico de `feedback_curtain_transition.md`. La
   única diferencia con la cortina del menú es que ésta no tiene fade prefix
   (no hay contenido del menú que ocultar antes del cover).
   ========================================================================== */

export function PageCurtain() {
  const isActive = usePageCurtainStore((s) => s.isActive)
  const targetHref = usePageCurtainStore((s) => s.targetHref)
  const endPageCurtain = usePageCurtainStore((s) => s.endPageCurtain)

  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tlRef = useRef<any>(null)
  const inProgressRef = useRef(false)

  useEffect(() => {
    if (!isActive || !targetHref || inProgressRef.current) return
    inProgressRef.current = true

    const panel = panelRef.current
    const targetRoute = targetHref as Exclude<RouteId, '/miradas/[cat]/[slug]'>

    if (!panel) {
      router.push(targetRoute)
      endPageCurtain()
      inProgressRef.current = false
      return
    }

    const reduced = getReducedMotion()
    if (reduced) {
      router.push(targetRoute)
      endPageCurtain()
      inProgressRef.current = false
      return
    }

    void import('gsap').then(({ default: gsap }) => {
      tlRef.current?.kill()
      const ease = 'power4.inOut'

      // Estado inicial — panel completamente clipado a la izquierda (oculto)
      gsap.set(panel, { clipPath: 'inset(0 100% 0 0)' })

      const tl = gsap.timeline({
        onComplete: () => {
          endPageCurtain()
          inProgressRef.current = false
          // Reset el panel al estado oculto para próxima activación
          gsap.set(panel, { clipPath: 'inset(0 100% 0 0)' })
        },
      })
      tlRef.current = tl

      // Fase 1 — cover: panel cubre desde la izquierda hasta full
      tl.to(panel, { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease }, 0)

      // Fase 2 — navigate al completar el cover (t=0.7)
      tl.call(() => {
        router.push(targetRoute)
      }, [], 0.7)

      // Fase 3 — hold 0.15s (buffer para render de Next.js)
      // Fase 4 — uncover: panel se pliega a la derecha
      tl.to(panel, { clipPath: 'inset(0 0% 0 100%)', duration: 1.25, ease }, 0.85)
    })
  }, [isActive, targetHref, router, endPageCurtain])

  // Cleanup unmount-only: matar la timeline si el componente se desmonta
  // mientras hay una cortina en curso. NO matar al re-renderizar — eso
  // mataría una cortina viva si el user dispara otra acción mientras corre.
  useEffect(() => {
    return () => {
      tlRef.current?.kill()
    }
  }, [])

  return (
    <div
      ref={panelRef}
      aria-hidden="true"
      className="fixed inset-0 z-page-transition pointer-events-none bg-warm-light"
      style={{ clipPath: 'inset(0 100% 0 0)' }}
    />
  )
}
