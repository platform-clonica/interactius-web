'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

/* ==========================================================================
   CapacityHeroAnim — layout + GSAP entry sequence (sección 1/4)
   --------------------------------------------------------------------------
   Recibe el contenido ya traducido del Server Component (CapacityHero) y
   orquesta la animación de entrada:

   t=0      Imagen derecha: clip-path inset(0 100% 0 0) → inset(0 0% 0 0)
            700ms, cubic-bezier(.16,1,.3,1) ≈ power3.out
   t=0      Título: SplitType line-mask {y:80, opacity:0}→default
            1.2s, power4.out, stagger 0.1s/línea
   t=300ms  Lead: opacity 0→1 + y 20→0, 0.8s
   ========================================================================== */

interface CapacityHeroAnimProps {
  title: string
  lead: string
  imageSrc: string
  imageAlt: string
}

export function CapacityHeroAnim({
  title,
  lead,
  imageSrc,
  imageAlt,
}: CapacityHeroAnimProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const leadRef  = useRef<HTMLParagraphElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const titleEl = titleRef.current
    const leadEl  = leadRef.current
    const imageEl = imageRef.current
    if (!titleEl || !leadEl) return

    void (async () => {
      const [{ default: gsap }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('split-type'),
      ])

      const reduced = getReducedMotion()

      if (reduced) {
        gsap.set([titleEl, leadEl], { clearProps: 'all' })
        if (imageEl) gsap.set(imageEl, { clearProps: 'all' })
        return
      }

      // ── Splits de texto ───────────────────────────────────────────────────
      const titleSplit = new SplitType(titleEl, { types: 'lines' })
      wrapLinesInMask(titleSplit.lines ?? [])

      // ── Estado inicial ─────────────────────────────────────────────────────
      gsap.set(titleSplit.lines ?? [], { y: 80, opacity: 0 })
      gsap.set(leadEl, { opacity: 0, y: 20 })
      if (imageEl) {
        gsap.set(imageEl, { clipPath: 'inset(0 100% 0 0)' })
      }

      // ── Animaciones ────────────────────────────────────────────────────────

      // Imagen derecha — clip-path revela desde la izquierda
      if (imageEl) {
        gsap.to(imageEl, {
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.9,
          ease: 'power3.out',
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

      cleanupRef.current = () => {
        titleSplit.revert()
      }
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section
      aria-labelledby="capacity-hero-title"
      className="relative min-h-screen w-full overflow-hidden"
    >
      {/* Imagen derecha — solo desktop, animada con clip-path */}
      <div
        ref={imageRef}
        className="hidden lg:block absolute top-0 right-0 h-full w-[42%]"
        style={{ clipPath: 'inset(0 100% 0 0)' }}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="42vw"
          className="object-cover"
          priority
        />
      </div>

      {/* Contenido izquierda */}
      <div className="relative z-content section-inner">
        <div className="pt-32 pb-section lg:pt-40 lg:max-w-[55%]">
          <h1
            ref={titleRef}
            id="capacity-hero-title"
            className="font-serif font-light text-fg text-display"
          >
            {title}
          </h1>
          <p
            ref={leadRef}
            className="mt-8 max-w-[44ch] font-mono text-body text-fg/70"
          >
            {lead}
          </p>
        </div>
      </div>
    </section>
  )
}
