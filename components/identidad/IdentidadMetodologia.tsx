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

      // 1. Parallax background — 0.5× scroll speed via scrub
      // bg is oversized (inset-y-[-15%]) so edges don't show during translation
      if (!reduced && bgRef.current) {
        const tw = gsap.fromTo(
          bgRef.current,
          { yPercent: 0 },
          {
            yPercent: -15,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        )
        if (tw.scrollTrigger) cleanups.push(() => tw.scrollTrigger!.kill())
        cleanups.push(() => tw.kill())
      }

      // 2. "Metodología" title — line-mask reveal
      // Parent has overflow:hidden; title animates from below clip boundary
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
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              once: true,
            },
          })
          const twSt = tw.scrollTrigger
          if (twSt) cleanups.push(() => twSt.kill())
          cleanups.push(() => tw.kill())
        }
      }

      // 3. Cards — sequential clip-path lateral reveal + internal text line-masks
      //    Card 1 clip → Card 1 texts → Card 2 clip → Card 2 texts → Card 3 clip → Card 3 texts
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
            scrollTrigger: {
              trigger: section,
              start: 'top 55%',
              once: true,
            },
          })

          cards.forEach((card) => {
            if (!card) return
            // [0]=number span, [1]=label, [2]=description
            const inners = Array.from(card.querySelectorAll<HTMLElement>('[data-ti]'))
            const numTitle = inners.slice(0, 2)
            const desc = inners.slice(2)

            // Clip-path: inset(0 100% 0 0) → inset(0 0% 0 0), 400ms
            tl.to(card, { clipPath: 'inset(0 0% 0 0)', duration: 0.4, ease })

            // Number + title reveal — delay 0 after clip completes
            if (numTitle.length) {
              tl.to(numTitle, { y: '0%', duration: 0.8, ease: 'power4.out' }, '>')
            }

            // Description reveal — delay +80ms after num+title starts
            if (desc.length) {
              tl.to(desc, { y: '0%', duration: 0.8, ease: 'power4.out' }, '<+0.08')
            }
            // ">" after desc naturally queues the next card clip after all texts complete
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
      className="relative w-full min-h-screen overflow-hidden"
      aria-labelledby="metodologia-title"
    >
      {/* Background — oversized vertically to cover parallax travel */}
      <div
        ref={bgRef}
        className="absolute inset-x-0 will-change-transform"
        style={{ top: '-15%', bottom: '-15%' }}
        aria-hidden="true"
      >
        <Image
          src="/identidad/metodologia-bg.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-dark/20" />
      </div>

      {/* "Metodología" super-title — line-mask reveal, overflows left edge */}
      <div
        className="absolute -translate-y-1/2 left-0 right-0 overflow-hidden pointer-events-none"
        style={{ top: 'clamp(120px, 17vw, 247px)' }}
        aria-hidden="true"
      >
        <h2
          id="metodologia-title"
          className="font-serif font-normal text-warm-light leading-[0.7] tracking-[-0.04em] whitespace-nowrap select-none"
          style={{
            fontSize: 'clamp(80px, 11.5vw, 220px)',
            marginLeft: 'calc(var(--grid-margin) - clamp(10px, 3vw, 57px))',
          }}
        >
          <span ref={titleRef}>{t('metodologia.title')}</span>
        </h2>
      </div>

      {/* Cards */}
      <div
        className="relative z-content section-inner pb-section"
        style={{ paddingTop: 'clamp(200px, 28vw, 404px)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-grid-gutter">
          {([0, 1, 2] as const).map((i) => (
            <div
              key={i}
              ref={(el) => { cardsRef.current[i] = el }}
              className="bg-pure-white flex flex-col items-center justify-center gap-5 p-10 text-center will-change-[clip-path]"
              style={{ minHeight: 'clamp(320px,51.1vh,552px)' }}
            >
              {/* Number — overflow:hidden mask for line reveal */}
              <span className="overflow-hidden block leading-none">
                <span data-ti="" className="block font-mono text-card-sm text-fg leading-[1.5]">
                  {i + 1}
                </span>
              </span>

              {/* Label — overflow:hidden mask for line reveal */}
              <span className="overflow-hidden block w-full">
                <span data-ti="" className="block font-serif font-normal text-section text-fg leading-[1.2] tracking-[-0.02em] text-center">
                  {t(`metodologia.pasos.${i}.label` as Parameters<typeof t>[0])}
                </span>
              </span>

              {/* Description — overflow:hidden mask for line reveal */}
              <span className="overflow-hidden block max-w-[22ch]">
                <span data-ti="" className="block font-mono text-body-sm text-fg/40 leading-[1.5] text-center">
                  {t(`metodologia.pasos.${i}.description` as Parameters<typeof t>[0])}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
