'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

// Renders <strong> as a plain span with a data attr — no hidden elements,
// no layout side-effects. Slashes are injected dynamically at scroll time.
const introComponents = {
  strong: (chunks: ReactNode) => <span data-word="">{chunks}</span>,
}

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

      // Fire shortly after the line-mask reveal settles
      const transformDelay = 1.2 + (lines.length - 1) * 0.08 + 0.2
      let delayed: ReturnType<typeof gsap.delayedCall> | null = null

      const st = ScrollTrigger.create({
        trigger: sectionEl,
        start: 'top top',
        once: true,
        onEnter: () => {
          gsap.to(lines, { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.08 })

          delayed = gsap.delayedCall(transformDelay, () => {
            const wordEl = quoteEl.querySelector<HTMLElement>('[data-word]')
            if (!wordEl?.parentNode) return

            // Create and insert slashes dynamically — zero DOM cost before animation
            const slashL = document.createElement('span')
            slashL.textContent = '/ '
            slashL.dataset.slashDynamic = ''
            slashL.style.display = 'inline-block'

            const slashR = document.createElement('span')
            slashR.textContent = ' /'
            slashR.dataset.slashDynamic = ''
            slashR.style.display = 'inline-block'

            wordEl.parentNode.insertBefore(slashL, wordEl)
            wordEl.parentNode.insertBefore(slashR, wordEl.nextSibling)

            // Set slashes invisible before they enter the DOM visually
            gsap.set(slashL, { opacity: 0, x: -3 })
            gsap.set(slashR, { opacity: 0, x:  3 })

            // Full fade-out completely hides the weight snap (300 → 400).
            // Word + slashes all fade back in together as one unified moment.
            gsap.timeline()
              .to(wordEl, { opacity: 0, duration: 0.35, ease: 'power2.in' })
              .call(() => { wordEl.classList.add('font-normal') })
              .to(wordEl,  { opacity: 1, duration: 0.55, ease: 'power2.out' }, '+=0.04')
              .to(slashL,  { opacity: 1, x: 0, duration: 0.55, ease: 'power2.out' }, '<')
              .to(slashR,  { opacity: 1, x: 0, duration: 0.55, ease: 'power2.out' }, '<0.08')
          })
        },
      })

      cleanupRef.current = () => {
        st.kill()
        delayed?.kill()
        // Remove dynamically inserted slashes before SplitType reverts
        quoteEl.querySelectorAll('[data-slash-dynamic]').forEach(el => el.remove())
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
          <div className="col-span-12 lg:col-span-10 lg:col-start-1">
            <p
              ref={quoteRef}
              className="font-serif font-light text-section text-fg tracking-[-0.02em] leading-[1.2]"
            >
              {t.rich('intro.quote', introComponents)}
            </p>
          </div>
        </div>
      </div>

      {/* 100vh spacer — one full 16:9 section of reading pause */}
      <div style={{ height: '100vh' }} aria-hidden="true" />
    </section>
  )
}
