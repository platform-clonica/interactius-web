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

// Hold extendido para (1) dar tiempo a la nueva ruta a hidratar Y PINTAR
// antes del uncover y (2) dejar respirar el glyph "ius" loading que se
// repite letra a letra durante el hold.
//
// Cronología tras el cover (0.7s):
//   t=0.7s       → cover full, navigate(), arranca loop del glyph
//   ≥ MIN       → mínimo respirado por el glyph + tiempo a la nueva ruta
//   pathChanged → Next ha hecho commit; esperamos 2 RAF antes de uncover
//                 para que el primer paint del nuevo árbol esté hecho
//   ≤ MAX       → tope duro para no dejar al usuario colgado
//
// MAX 2500ms permite a las páginas de servicios (con imágenes pesadas y
// ScrollTriggers complejos) terminar su primer ciclo de cálculo antes de
// destapar; sin esto, se veían saltos de scroll/clip al uncover.
const MIN_HOLD_MS = 1300
const MAX_HOLD_MS = 2500

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

      // Glyph "loading": cada letra (i, u, s) hace REVEAL LATERAL (clip-path
      // izquierda→derecha) con stagger, y el ciclo se repite en bucle mientras
      // la cortina cubre la pantalla. Mismo lenguaje canónico que el resto de
      // reveals laterales del proyecto (cubic-bezier(.16,1,.3,1), 0.6s).
      const letters = panel.querySelectorAll<SVGGElement>('[data-curtain-letter]')
      const lateralEase = 'cubic-bezier(.16,1,.3,1)'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let loopTl: any = null
      const startGlyphLoop = () => {
        if (!letters.length) return
        gsap.set(letters, { clipPath: 'inset(0 100% 0 0)' })
        loopTl = gsap.timeline({ repeat: -1, repeatDelay: 0.25 })
        // Reveal: cada letra desclipa de izq→derecha, stagger 0.16s
        loopTl.to(letters, {
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.55,
          stagger: 0.16,
          ease: lateralEase,
        })
        // Hold breve y reset (re-clipar desde la derecha para que el próximo
        // ciclo vuelva a entrar limpio desde la izquierda)
        loopTl.to(letters, {
          clipPath: 'inset(0 0 0 100%)',
          duration: 0.4,
          stagger: 0.08,
          ease: lateralEase,
        }, '+=0.5')
        loopTl.set(letters, { clipPath: 'inset(0 100% 0 0)' })
      }
      const stopGlyphLoop = () => {
        loopTl?.kill()
        loopTl = null
        if (letters.length) gsap.set(letters, { clipPath: 'inset(0 0% 0 0)' })
      }

      const startUncover = () => {
        // CANÓNICO: último scrollTo justo antes del uncover. Garantiza que
        // si Next.js restauró la posición durante el mount (scrollRestoration)
        // o si el RAF tick perdió un frame, el viewport está a top=0 cuando
        // el panel empieza a destaparse. El usuario nunca debe ver un salto
        // de scroll detrás del panel.
        if (mode === 'push') {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        }
        stopGlyphLoop()
        const uncover = gsap.to(panel, {
          clipPath: 'inset(0 0% 0 100%)',
          duration: 1.25,
          ease,
          onComplete: () => {
            endPageCurtain()
            inProgressRef.current = false
            gsap.set(panel, { clipPath: 'inset(0 100% 0 0)' })
            // Refrescar ScrollTrigger global para que la nueva ruta
            // recalcule posiciones tras el uncover. Evita que reveals con
            // start: 'top top' (e.g. CapacityHeroSequence inverse-scrub)
            // se queden con posiciones stale tras la transición.
            void import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
              ScrollTrigger.refresh()
            })
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
          startGlyphLoop()
          const startedAt = performance.now()
          let extraFramesAfterPathChange = 0
          const FRAMES_AFTER_PATH_CHANGE = 2

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
            // Tras detectar pathChanged, esperamos N frames extra para que
            // el primer paint del nuevo árbol esté hecho antes de destapar.
            // Sin esto, el uncover puede revelar un frame en blanco mientras
            // React/Next aún está reconciliando.
            if (pathChanged) extraFramesAfterPathChange += 1
            const paintReady = pathChanged && extraFramesAfterPathChange >= FRAMES_AFTER_PATH_CHANGE
            const reached = (paintReady && elapsed >= MIN_HOLD_MS) || elapsed >= MAX_HOLD_MS
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
