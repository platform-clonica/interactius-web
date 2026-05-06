'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import Image from 'next/image'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

/* ==========================================================================
   CapacityHeroAnim — layout + GSAP entry sequence + scroll-out
   --------------------------------------------------------------------------
   Entrada (cuando carga el hero):
     t=0      Imagen derecha + (opc.) imagen abajo: clip-path inset(0 100% 0 0)
              → inset(0 0% 0 0). 900ms, power4.inOut (canónico lateral)
     t=0      Título: SplitType line-mask {y:80, opacity:0}→default
              1.2s, power4.out, stagger 0.1s/línea
     t=300ms  Lead: opacity 0→1 + y 20→0, 0.8s

   Salida con scroll (scrubbed, top top → bottom top):
     · Imagen derecha: clip-path inset(0 0 0 0%) → inset(0 0 0 100%)
       (wipe lateral inverso hacia la derecha)
     · Imagen abajo: mismo wipe + parallax yPercent: -80 (sube más rápido
       que el scroll → "pasa por encima del texto")
   ========================================================================== */

interface CapacityHeroAnimProps {
  title: string
  lead: ReactNode
  imageSrc: string
  imageAlt: string
  /** Imagen secundaria que aparece "cortada" abajo a la izquierda (solo desktop). */
  imageBottomSrc?: string
  imageBottomAlt?: string
  /** Extra padding-top en px (solo lg+). Útil para alinear con el final del logo vertical. */
  topOffsetPx?: number
}

export function CapacityHeroAnim({
  title,
  lead,
  imageSrc,
  imageAlt,
  imageBottomSrc,
  imageBottomAlt = '',
  topOffsetPx = 75,
}: CapacityHeroAnimProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const leadRef  = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const imageBottomRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const sectionEl = sectionRef.current
    const titleEl = titleRef.current
    const leadEl  = leadRef.current
    const imageEl = imageRef.current
    const imageBottomEl = imageBottomRef.current
    if (!titleEl || !leadEl) return

    void (async () => {
      const [{ default: gsap }, { default: SplitType }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('split-type'),
        import('gsap/ScrollTrigger'),
      ])

      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()

      if (reduced) {
        gsap.set([titleEl, leadEl], { clearProps: 'all' })
        if (imageEl) gsap.set(imageEl, { clearProps: 'all' })
        if (imageBottomEl) gsap.set(imageBottomEl, { clearProps: 'all' })
        return
      }

      // ── Splits de texto ───────────────────────────────────────────────────
      const titleSplit = new SplitType(titleEl, { types: 'lines' })
      wrapLinesInMask(titleSplit.lines ?? [])

      // ── Estado inicial ─────────────────────────────────────────────────────
      gsap.set(titleSplit.lines ?? [], { y: 80, opacity: 0 })
      gsap.set(leadEl, { opacity: 0, y: 20 })
      if (imageEl) gsap.set(imageEl, { clipPath: 'inset(0 100% 0 0)' })
      if (imageBottomEl) gsap.set(imageBottomEl, { clipPath: 'inset(0 100% 0 0)' })

      // ── Entrada ────────────────────────────────────────────────────────────

      // Imagen derecha — clip-path revela desde la izquierda
      if (imageEl) {
        gsap.to(imageEl, {
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.9,
          ease: 'power4.inOut',
        })
      }
      // Imagen abajo — mismo reveal, ligero delay para escalonar
      if (imageBottomEl) {
        gsap.to(imageBottomEl, {
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.9,
          ease: 'power4.inOut',
          delay: 0.15,
        })
      }

      // Título — SplitType line-mask
      gsap.to(titleSplit.lines ?? [], {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: 'power4.out',
        stagger: 0.1,
      })

      // Lead — tras el inicio del título
      gsap.to(leadEl, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.3,
      })

      // ── Salida con scroll (scrubbed) ──────────────────────────────────────
      let scrollOutST: ScrollTrigger | null = null
      if (sectionEl && (imageEl || imageBottomEl)) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        })
        if (imageEl) {
          tl.to(imageEl, { clipPath: 'inset(0 0 0 100%)', ease: 'none' }, 0)
        }
        if (imageBottomEl) {
          tl.to(
            imageBottomEl,
            { clipPath: 'inset(0 0 0 100%)', yPercent: -80, ease: 'none' },
            0,
          )
        }
        scrollOutST = tl.scrollTrigger ?? null
      }

      cleanupRef.current = () => {
        titleSplit.revert()
        scrollOutST?.kill()
      }
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section
      ref={sectionRef}
      aria-labelledby="capacity-hero-title"
      className="relative min-h-screen w-full overflow-hidden"
    >
      {/* Imagen derecha — solo desktop, cols 7-12 (no full-bleed, respeta grid-margin a la derecha), altura 88vh */}
      <div className="hidden lg:block absolute inset-x-0 top-0 pointer-events-none">
        <div className="section-inner">
          <div className="grid grid-cols-12 gap-grid-gutter">
            <div
              ref={imageRef}
              className="col-start-8 col-span-5 relative h-[88vh]"
              style={{ clipPath: 'inset(0 100% 0 0)' }}
            >
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Imagen inferior izquierda — opcional, asoma cortada por el bottom (top alineado con el bottom de la right) */}
      {imageBottomSrc && (
        <div className="hidden lg:block absolute inset-x-0 top-[88vh] pointer-events-none">
          <div className="section-inner">
            <div className="grid grid-cols-12 gap-grid-gutter">
              <div
                ref={imageBottomRef}
                className="col-start-2 col-span-4 relative h-[55vh]"
                style={{ clipPath: 'inset(0 100% 0 0)' }}
              >
                <Image
                  src={imageBottomSrc}
                  alt={imageBottomAlt}
                  fill
                  sizes="33vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido izquierda */}
      <div className="relative z-content section-inner">
        <div
          className="grid grid-cols-12 gap-grid-gutter pt-32 pb-section lg:pt-[var(--cap-hero-pt-lg)]"
          style={{ ['--cap-hero-pt-lg' as string]: `${160 + topOffsetPx}px` }}
        >
          <h1
            ref={titleRef}
            id="capacity-hero-title"
            className="col-start-2 col-span-11 lg:col-start-2 lg:col-span-6 font-serif font-light text-fg text-display"
          >
            {title}
          </h1>
          <div
            ref={leadRef}
            className="col-span-12 lg:col-start-3 lg:col-span-4 mt-8 flex flex-col gap-6 font-mono text-body-sm text-fg"
          >
            {typeof lead === 'string' ? <p>{lead}</p> : lead}
          </div>
        </div>
      </div>
    </section>
  )
}
