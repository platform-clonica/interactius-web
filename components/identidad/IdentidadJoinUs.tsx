'use client'

import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

export function IdentidadJoinUs() {
  const t = useTranslations('identidad')

  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    const pinEl = pinRef.current
    const contentEl = contentRef.current
    if (!section || !pinEl || !contentEl) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
      ])

      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      const cleanups: Array<() => void> = []

      // Pin the centered CTA for 100vh of scroll — text alone on screen.
      const pinST = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=100%',
        pin: pinEl,
        pinSpacing: true,
        anticipatePin: 1,
      })
      cleanups.push(() => pinST.kill())

      // Line-mask reveal of CTA + email
      const paragraphs = Array.from(contentEl.querySelectorAll<HTMLElement>('[data-join-el]'))
      const splits = paragraphs.map((p) => new SplitType(p, { types: 'lines' }))
      const allLines = splits.flatMap((s) => s.lines ?? [])
      wrapLinesInMask(allLines)

      if (reduced) {
        gsap.set(allLines, { y: 0, opacity: 1 })
      } else {
        gsap.set(allLines, { y: 80, opacity: 0 })
        const revealST = ScrollTrigger.create({
          trigger: section,
          start: 'top 70%',
          once: true,
          onEnter: () => {
            gsap.to(allLines, {
              y: 0,
              opacity: 1,
              duration: 1.2,
              ease: 'power4.out',
              stagger: 0.1,
            })
          },
        })
        cleanups.push(() => {
          revealST.kill()
          splits.forEach((s) => s.revert())
        })
      }

      cleanupRef.current = () => cleanups.forEach((fn) => fn())
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-dark"
      aria-label="Únete al equipo"
    >
      <div
        ref={pinRef}
        className="w-full h-screen flex items-center justify-center"
      >
        <div ref={contentRef} className="text-center flex flex-col gap-0 px-6">
          <p
            data-join-el=""
            className="font-serif font-normal text-section text-warm-light tracking-[-0.02em] leading-[1.2]"
          >
            {t('joinUs.cta')}
          </p>
          <a
            data-join-el=""
            href={`mailto:${t('joinUs.email')}`}
            className="font-serif font-normal text-section text-warm-light tracking-[-0.02em] leading-[1.2] underline hover:opacity-70 transition-opacity duration-fast ease-expo"
          >
            {t('joinUs.email')}
          </a>
        </div>
      </div>
    </section>
  )
}
