'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { richComponents } from '@/lib/i18n/rich-text'
import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

export function IdentidadHero() {
  const t = useTranslations('identidad')

  const sectionRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    const imageEl = imageRef.current
    const headlineEl = headlineRef.current
    const bodyEl = bodyRef.current
    if (!section || !imageEl || !headlineEl || !bodyEl) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
      ])

      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      const ease = 'cubic-bezier(.16,1,.3,1)'
      const cleanups: Array<() => void> = []

      if (reduced) {
        gsap.set(imageEl, { clipPath: 'inset(0 0% 0 0)' })
        return
      }

      // Initial states
      gsap.set(imageEl, { clipPath: 'inset(0 100% 0 0)' })

      // SplitType
      const headlineSplit = new SplitType(headlineEl, { types: 'lines' })
      const headlineLines = headlineSplit.lines ?? []
      wrapLinesInMask(headlineLines)
      gsap.set(headlineLines, { y: 80, opacity: 0 })

      const bodyParagraphs = Array.from(bodyEl.querySelectorAll<HTMLElement>('[data-body-p]'))
      const bodySplits = bodyParagraphs.map((p) => new SplitType(p, { types: 'lines' }))
      const bodyLines = bodySplits.flatMap((s) => s.lines ?? [])
      gsap.set(bodyLines, { y: 80, opacity: 0 })

      // Page-in timeline
      // t=0.2s: image clip + headline simultaneous
      // t=0.5s: body (0.2 + 0.3s delay after headline start)
      const tl = gsap.timeline({
        onComplete: () => {
          // Scroll exit: image clips from left as hero scrolls out
          const exitTween = gsap.to(imageEl, {
            clipPath: 'inset(0 0 0 100%)',
            ease: 'none',
          })
          const st = ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            animation: exitTween,
          })
          cleanups.push(() => { st.kill(); exitTween.kill() })
        },
      })

      // Image reveal
      tl.to(imageEl, { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease }, 0.2)

      // Headline line-mask reveal (simultaneous with image)
      tl.to(
        headlineLines,
        { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.08 },
        0.2,
      )

      // Body text (300ms after headline start = t=0.5s)
      tl.to(
        bodyLines,
        { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.06 },
        0.5,
      )

      cleanups.push(() => {
        tl.kill()
        headlineSplit.revert()
        bodySplits.forEach((s) => s.revert())
      })

      cleanupRef.current = () => cleanups.forEach((fn) => fn())
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen overflow-hidden bg-warm-light"
      aria-label="Hero"
    >
      {/* Right image — clip-path animated on page-in, then scroll-driven exit */}
      <div
        ref={imageRef}
        className="absolute top-0 bottom-0 right-0 hidden lg:block will-change-[clip-path]"
        style={{ left: '58.2%' }}
      >
        <Image
          src="/identidad/hero-right.jpg"
          alt={t('hero.imageAlt')}
          fill
          priority
          sizes="42vw"
          className="object-cover object-center"
        />
      </div>

      <div className="relative z-content section-inner">
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-12 pt-[calc(80px+18vh)] pb-20 lg:pb-32">
            <h1
              ref={headlineRef}
              className="font-serif font-light text-title text-fg leading-[1.1] tracking-[-0.02em]"
            >
              {t('hero.title')}
            </h1>

            <div ref={bodyRef} className="flex flex-col gap-6 font-mono text-body-sm text-fg">
              <p data-body-p="">{t.rich('hero.body1', richComponents.bold)}</p>
              <p data-body-p="">{t.rich('hero.body2', richComponents.bold)}</p>
              <p data-body-p="">{t.rich('hero.body3', richComponents.bold)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile image */}
      <div className="relative w-full aspect-[3/2] lg:hidden overflow-hidden">
        <Image
          src="/identidad/hero-right.jpg"
          alt={t('hero.imageAlt')}
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
    </section>
  )
}
