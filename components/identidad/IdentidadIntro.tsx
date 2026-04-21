'use client'

import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { richComponents } from '@/lib/i18n/rich-text'
import { getReducedMotion } from '@/components/motion/useReducedMotion'

export function IdentidadIntro() {
  const t = useTranslations('identidad')

  const quoteRef = useRef<HTMLParagraphElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const quoteEl = quoteRef.current
    if (!quoteEl) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
      ])

      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      if (reduced) return

      const split = new SplitType(quoteEl, { types: 'lines' })
      const lines = split.lines ?? []
      gsap.set(lines, { y: 60, opacity: 0 })

      // IO threshold 0.12 ≈ trigger when top of element is 88% down the viewport
      const st = ScrollTrigger.create({
        trigger: quoteEl,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.to(lines, { y: 0, opacity: 1, duration: 1, ease: 'power4.out', stagger: 0.06 })
        },
      })

      cleanupRef.current = () => {
        st.kill()
        split.revert()
      }
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section className="w-full bg-warm-light" aria-label="Declaración">
      <div className="section-inner flex items-center min-h-screen py-section">
        <div className="grid grid-cols-12 gap-grid-gutter w-full">
          <div className="col-span-12 lg:col-span-10 lg:col-start-1">
            <p
              ref={quoteRef}
              className="font-serif font-light text-section text-fg tracking-[-0.02em] leading-[1.2]"
            >
              {t.rich('intro.quote', richComponents.serifEmphasis)}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
