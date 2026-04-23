'use client'

import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

export function IdentidadJoinUs() {
  const t = useTranslations('identidad')

  const contentRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const contentEl = contentRef.current
    if (!contentEl) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
      ])

      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      if (reduced) return

      const paragraphs = Array.from(contentEl.querySelectorAll<HTMLElement>('[data-join-el]'))
      const splits = paragraphs.map((p) => new SplitType(p, { types: 'lines' }))
      const allLines = splits.flatMap((s) => s.lines ?? [])
      wrapLinesInMask(allLines)
      gsap.set(allLines, { y: 80, opacity: 0 })

      const st = ScrollTrigger.create({
        trigger: contentEl,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.to(allLines, { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.1 })
        },
      })

      cleanupRef.current = () => {
        st.kill()
        splits.forEach((s) => s.revert())
      }
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section className="w-full bg-dark" aria-label="Únete al equipo">
      <div className="section-inner py-section flex items-center justify-center min-h-[280px] md:min-h-[400px] lg:min-h-[540px]">
        <div ref={contentRef} className="text-center flex flex-col gap-0">
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
