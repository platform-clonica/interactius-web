'use client'

import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'
import { richComponents } from '@/lib/i18n/rich-text'

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

      // Fire shortly after the last line has revealed (~0.4s buffer)
      const transformDelay = 1.2 + (lines.length - 1) * 0.08 + 0.4
      let delayed: ReturnType<typeof gsap.delayedCall> | null = null

      const st = ScrollTrigger.create({
        trigger: sectionEl,
        start: 'top top',
        once: true,
        onEnter: () => {
          gsap.to(lines, { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.08 })

          delayed = gsap.delayedCall(transformDelay, () => {
            const wordEl = quoteEl.querySelector<HTMLElement>('[data-word]')
            if (!wordEl) return

            wordEl.style.removeProperty('-webkit-text-stroke')

            // Única animación canónica: text-stroke 0 → 0.6px (regular → semi).
            // Los slashes "/ palabra /" están renderizados desde el primer paint
            // (richComponents.boldWord) → wrap estable, sin reflow.
            const proxy = { v: 0 }
            gsap.to(proxy, {
              v: 0.6,
              duration: 1.4,
              ease: 'sine.inOut',
              onUpdate: () => {
                wordEl.style.setProperty('-webkit-text-stroke', `${proxy.v}px currentColor`)
              },
            })
          })
        },
      })

      cleanupRef.current = () => {
        st.kill()
        delayed?.kill()
        quoteEl.querySelector<HTMLElement>('[data-word]')?.style.removeProperty('-webkit-text-stroke')
        split.revert()
      }
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section ref={sectionRef} className="w-full bg-warm-light relative" aria-label="Declaración">
      {/* Sticky panel */}
      <div className="sticky top-0 section-inner flex items-center min-h-screen py-section">
        <div className="grid grid-cols-12 gap-grid-gutter w-full">
          <div className="col-span-12 lg:col-span-10 lg:col-start-2">
            <p
              ref={quoteRef}
              className="font-serif font-light text-section text-fg tracking-[-0.02em] leading-[1.2]"
            >
              {t.rich('intro.quote', richComponents.boldWord)}
            </p>
          </div>
        </div>
      </div>

      {/* 100vh spacer — pin corto, ritmo canónico para textos solitarios sticky */}
      <div style={{ height: '100vh' }} aria-hidden="true" />
    </section>
  )
}
