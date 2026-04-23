'use client'

import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { richComponents } from '@/lib/i18n/rich-text'
import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

export function IdentidadIntro() {
  const t = useTranslations('identidad')

  const sectionRef = useRef<HTMLElement>(null)
  const quoteRef   = useRef<HTMLParagraphElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const sectionEl = sectionRef.current
    const quoteEl   = quoteRef.current
    if (!sectionEl || !quoteEl) return

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
      const lines  = split.lines ?? []
      wrapLinesInMask(lines)
      gsap.set(lines, { y: 60, opacity: 0 })

      const st = ScrollTrigger.create({
        trigger: sectionEl,
        start: 'top top',
        once: true,
        onEnter: () => {
          gsap.to(lines, { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.08 })
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
    <section ref={sectionRef} className="w-full bg-warm-light relative" aria-label="Declaración">
      {/* Sticky panel — se queda en pantalla mientras se scrollea el spacer inferior */}
      <div className="sticky top-0 section-inner flex items-center min-h-screen py-section">
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

      {/* Spacer — da tiempo de lectura antes de pasar a la siguiente sección */}
      <div style={{ height: '80vh' }} aria-hidden="true" />
    </section>
  )
}
