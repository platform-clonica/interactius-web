'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

export function IdentidadMetodologia() {
  const t = useTranslations('identidad')

  const sectionRef = useRef<HTMLElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLSpanElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([null, null, null])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])

      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      const ease = 'cubic-bezier(.16,1,.3,1)'
      const cleanups: Array<() => void> = []

      // 1. Background lateral reveal — canonical right→left clip-path
      if (!reduced && bgRef.current) {
        gsap.set(bgRef.current, { clipPath: 'inset(0 100% 0 0)' })
        const reveal = gsap.to(bgRef.current, {
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.9,
          ease,
          scrollTrigger: { trigger: section, start: 'top 85%', once: true },
        })
        if (reveal.scrollTrigger) cleanups.push(() => reveal.scrollTrigger!.kill())
        cleanups.push(() => reveal.kill())
      } else if (reduced && bgRef.current) {
        gsap.set(bgRef.current, { clipPath: 'inset(0 0% 0 0)' })
      }

      // 2. Title line-mask reveal — y 110% → 0% under overflow-hidden parent
      const titleEl = titleRef.current
      if (titleEl) {
        if (reduced) {
          gsap.set(titleEl, { y: 0 })
        } else {
          gsap.set(titleEl, { y: '110%' })
          const tw = gsap.to(titleEl, {
            y: '0%',
            duration: 0.8,
            ease: 'power4.out',
            scrollTrigger: { trigger: section, start: 'top 70%', once: true },
          })
          const twSt = tw.scrollTrigger
          if (twSt) cleanups.push(() => twSt.kill())
          cleanups.push(() => tw.kill())
        }
      }

      // 3. Cards — sequential clip-path lateral reveal + internal text line-masks
      const cards = cardsRef.current
      if (cards.every(Boolean)) {
        if (reduced) {
          cards.forEach((card) => {
            if (!card) return
            gsap.set(card, { clipPath: 'inset(0 0% 0 0)' })
            card.querySelectorAll<HTMLElement>('[data-ti]').forEach((el) => gsap.set(el, { y: 0 }))
          })
        } else {
          cards.forEach((card) => {
            if (!card) return
            gsap.set(card, { clipPath: 'inset(0 100% 0 0)' })
            card.querySelectorAll<HTMLElement>('[data-ti]').forEach((el) => gsap.set(el, { y: '110%' }))
          })

          const tl = gsap.timeline({
            scrollTrigger: { trigger: section, start: 'top 55%', once: true },
          })

          // All clips in parallel with small stagger — much faster than sequential
          tl.to(cards, { clipPath: 'inset(0 0% 0 0)', duration: 0.35, ease, stagger: 0.08 })

          // Each card's text reveals shortly after its own clip starts
          cards.forEach((card, i) => {
            if (!card) return
            const inners = Array.from(card.querySelectorAll<HTMLElement>('[data-ti]'))
            const numTitle = inners.slice(0, 2)
            const desc = inners.slice(2)
            const offset = 0.15 + i * 0.08
            if (numTitle.length) {
              tl.to(numTitle, { y: '0%', duration: 0.55, ease: 'power4.out' }, offset)
            }
            if (desc.length) {
              tl.to(desc, { y: '0%', duration: 0.55, ease: 'power4.out' }, offset + 0.06)
            }
          })

          const tlSt = tl.scrollTrigger
          if (tlSt) cleanups.push(() => tlSt.kill())
          cleanups.push(() => tl.kill())
        }
      }

      cleanupRef.current = () => cleanups.forEach((fn) => fn())
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      aria-labelledby="metodologia-title"
    >
      {/* Title — above image, dark on warm-light, bleeds past left edge */}
      <div className="relative overflow-hidden pt-section pb-6 lg:pb-10">
        <h2
          id="metodologia-title"
          className="font-serif font-normal text-fg leading-[0.9] tracking-[-0.04em] whitespace-nowrap select-none"
          style={{
            fontSize: 'clamp(80px, 15vw, 240px)',
            marginLeft: 'calc(-1 * clamp(6px, 0.8vw, 18px))',
          }}
        >
          <span ref={titleRef} className="inline-block">
            {t('metodologia.title')}
          </span>
        </h2>
      </div>

      {/* Image + cards */}
      <div
        className="relative overflow-hidden"
        style={{ height: 'clamp(520px, 72vh, 820px)' }}
      >
        {/* Background image */}
        <div ref={bgRef} className="absolute inset-0">
          <Image
            src="/identidad/metodologia-bg.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-dark/20" />
        </div>

        {/* Cards, centered vertically inside image area */}
        <div className="relative z-content section-inner h-full flex items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-grid-gutter w-full">
            {([0, 1, 2] as const).map((i) => (
              <div
                key={i}
                ref={(el) => {
                  cardsRef.current[i] = el
                }}
                className="bg-pure-white flex flex-col items-center justify-center gap-5 p-10 text-center will-change-[clip-path]"
                style={{ minHeight: 'clamp(320px, 42vh, 480px)' }}
              >
                <span className="overflow-hidden block leading-none">
                  <span
                    data-ti=""
                    className="block font-mono text-card-sm text-fg leading-[1.5]"
                  >
                    {i + 1}
                  </span>
                </span>
                <span className="overflow-hidden block w-full">
                  <span
                    data-ti=""
                    className="block font-serif font-normal text-section text-fg leading-[1.2] tracking-[-0.02em] text-center"
                  >
                    {t(`metodologia.pasos.${i}.label` as Parameters<typeof t>[0])}
                  </span>
                </span>
                <span className="overflow-hidden block max-w-[22ch]">
                  <span
                    data-ti=""
                    className="block font-mono text-body-sm text-fg/40 leading-[1.5] text-center"
                  >
                    {t(`metodologia.pasos.${i}.description` as Parameters<typeof t>[0])}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Breathing space — warm-light expanse (bg heredado de la section).
          Reemplaza la antigua cortina fija scrubbed: el usuario scrollea por
          esta zona limpia antes de llegar a Gente, evitando que las cards
          queden visibles junto al titular siguiente. Sin JS, responsive-safe. */}
      <div
        aria-hidden="true"
        className="h-[clamp(60vh,90vh,110vh)]"
      />
    </section>
  )
}
