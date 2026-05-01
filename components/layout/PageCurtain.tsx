'use client'

import { useEffect, useRef } from 'react'

import { useRouter, type RouteId } from '@/lib/i18n/navigation'
import { usePageCurtainStore } from '@/lib/store/curtain'
import { useMenuStore } from '@/lib/store/menu'
import { getReducedMotion } from '@/components/motion/useReducedMotion'

import { CurtainGlyph } from './CurtainGlyph'

/* ==========================================================================
   PageCurtain — cortina global de transición entre páginas
   --------------------------------------------------------------------------
   Renderizada una sola vez en el root layout (main). Escucha el store
   `usePageCurtainStore` y, cuando `isActive` pasa a true, ejecuta:

     · cover (clipPath inset(0 100% 0 0) → inset(0 0% 0 0))
       0.7s, power4.inOut — el panel warm-light cubre desde la izquierda
     · navigate(targetHref) al completar el cover (t=0.7s)
     · hold dinámico — espera a que el pathname haya cambiado
       (commit del nuevo árbol de Next), con MIN_HOLD_MS=150 y
       MAX_HOLD_MS=700 como tope. Sin esto, las primeras navegaciones a
       rutas no cacheadas reveal-ban con la página vieja todavía visible.
     · uncover (clipPath inset(0 0% 0 0) → inset(0 0% 0 100%))
       1.25s, power4.inOut — el panel se pliega a la derecha
     · endPageCurtain() — reset estado

   Reduced-motion: navega instantáneamente sin cortina.

   Coherente con el patrón canónico de `feedback_curtain_transition.md`. La
   única diferencia con la cortina del menú es que ésta no tiene fade prefix
   (no hay contenido del menú que ocultar antes del cover).
   ========================================================================== */

// Hold extendido para (1) dar tiempo a la nueva ruta a hidratar antes
// del uncover y (2) dejar respirar el glyph "ius" que aparece en el
// centro como imago intencionado.
// Cronología: cover (0.7s) → onComplete dispara reveal del glyph (~0.5s).
// Hold mínimo 1300ms = ~800ms de glyph visible estático tras el reveal,
// suficiente para que el imago se perciba con intención. MAX 1700ms.
const MIN_HOLD_MS = 1300
const MAX_HOLD_MS = 1700

export function PageCurtain() {
  const isActive = usePageCurtainStore((s) => s.isActive)
  const targetHref = usePageCurtainStore((s) => s.targetHref)
  const mode = usePageCurtainStore((s) => s.mode)
  const endPageCurtain = usePageCurtainStore((s) => s.endPageCurtain)

  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tlRef = useRef<any>(null)
  const rafIdRef = useRef<number | null>(null)
  const inProgressRef = useRef(false)

  useEffect(() => {
    if (!isActive || inProgressRef.current) return
    if (mode === 'push' && !targetHref) return
    inProgressRef.current = true

    const panel = panelRef.current
    const navigate = () => {
      // Si el menú estaba abierto al disparar la cortina (caso menu→contact),
      // lo cerramos JUSTO en el momento de la navegación, cuando el panel
      // cubre la pantalla completa. Cerrar antes haría visible la transición
      // del backdrop/body-scroll a través de la zona aún sin cubrir.
      useMenuStore.getState().close()

      if (mode === 'back') {
        router.back()
      } else if (targetHref) {
        router.push(targetHref as Exclude<RouteId, '/miradas/[cat]/[slug]'>)
        // Forzamos top en push (navegación nueva). No tocamos en mode 'back'
        // porque ahí queremos que el navegador restaure la posición previa
        // (scrollRestoration de Next). Se llama mientras la cortina cubre el
        // viewport completo → invisible para el usuario. `instant` evita
        // animar un scroll que el usuario no debe ver.
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }
    }

    if (!panel) {
      navigate()
      endPageCurtain()
      inProgressRef.current = false
      return
    }

    const reduced = getReducedMotion()
    if (reduced) {
      navigate()
      endPageCurtain()
      inProgressRef.current = false
      return
    }

    void import('gsap').then(({ default: gsap }) => {
      tlRef.current?.kill()
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
      const ease = 'power4.inOut'

      gsap.set(panel, { clipPath: 'inset(0 100% 0 0)' })

      const initialPath = window.location.pathname

      const startUncover = () => {
        // CANÓNICO: último scrollTo justo antes del uncover. Garantiza que
        // si Next.js restauró la posición durante el mount (scrollRestoration)
        // o si el RAF tick perdió un frame, el viewport está a top=0 cuando
        // el panel empieza a destaparse. El usuario nunca debe ver un salto
        // de scroll detrás del panel.
        if (mode === 'push') {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        }
        const uncover = gsap.to(panel, {
          clipPath: 'inset(0 0% 0 100%)',
          duration: 1.25,
          ease,
          onComplete: () => {
            endPageCurtain()
            inProgressRef.current = false
            gsap.set(panel, { clipPath: 'inset(0 100% 0 0)' })
          },
        })
        tlRef.current = uncover
      }

      const cover = gsap.to(panel, {
        clipPath: 'inset(0 0% 0 0)',
        duration: 0.7,
        ease,
        onComplete: () => {
          navigate()
          const startedAt = performance.now()

          const tick = () => {
            const elapsed = performance.now() - startedAt
            const pathChanged = window.location.pathname !== initialPath
            // CANÓNICO: forzamos scrollTo top en CADA frame durante el hold.
            // Next.js scrollRestoration puede ejecutarse en cualquier momento
            // del mount → si solo lo hacíamos una vez al detectar pathChanged,
            // perdíamos la carrera y el scroll terminaba en posición vieja.
            // Cheap operation, el browser hace no-op si ya estamos en 0.
            // Solo en push; back conserva posición previa deliberadamente.
            if (mode === 'push') {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
            }
            const reached = (pathChanged && elapsed >= MIN_HOLD_MS) || elapsed >= MAX_HOLD_MS
            if (reached) {
              rafIdRef.current = null
              startUncover()
              return
            }
            rafIdRef.current = requestAnimationFrame(tick)
          }
          rafIdRef.current = requestAnimationFrame(tick)
        },
      })
      tlRef.current = cover
    })
  }, [isActive, targetHref, mode, router, endPageCurtain])

  // Cleanup unmount-only: matar la timeline si el componente se desmonta
  // mientras hay una cortina en curso. NO matar al re-renderizar — eso
  // mataría una cortina viva si el user dispara otra acción mientras corre.
  useEffect(() => {
    return () => {
      tlRef.current?.kill()
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
    }
  }, [])

  return (
    <div
      ref={panelRef}
      aria-hidden="true"
      className="fixed inset-0 z-page-transition pointer-events-none bg-warm-light"
      style={{ clipPath: 'inset(0 100% 0 0)' }}
    >
      {/* Imago intencionado: las tres últimas letras del wordmark se
          revelan letra a letra durante el hold de la cortina. Centradas
          absolutamente en el panel. Heredan el clip-path del padre →
          aparecen junto con el panel y se recortan en el uncover sin
          tween extra. */}
      <div className="absolute inset-0 grid place-items-center">
        <CurtainGlyph />
      </div>
    </div>
  )
}
