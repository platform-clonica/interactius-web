'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

/* ==========================================================================
   HomeIntroText — sección fullscreen warm-light con un único texto solitario.
   --------------------------------------------------------------------------
   Mismo patrón EXACTO que `IdentidadIntro` (sticky + spacer 200vh + line-mask
   reveal + efecto bold/slashes en la palabra marcada con <strong>). Mantiene
   el mismo tiempo de scroll para coherencia entre las dos secciones intro.
   ========================================================================== */

const introComponents = {
  strong: (chunks: ReactNode) => <span data-word="">{chunks}</span>,
}

export function HomeIntroText() {
  const t = useTranslations('home')

  const sectionRef = useRef<HTMLElement>(null)
  const quoteRef = useRef<HTMLParagraphElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const sectionEl = sectionRef.current
    const quoteEl = quoteRef.current
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
      const lines = split.lines ?? []
      wrapLinesInMask(lines)
      gsap.set(lines, { y: 60, opacity: 0 })

      const transformDelay = 1.2 + (lines.length - 1) * 0.08 + 0.4
      let delayed: ReturnType<typeof gsap.delayedCall> | null = null

      const st = ScrollTrigger.create({
        trigger: sectionEl,
        start: 'top top',
        once: true,
        onEnter: () => {
          gsap.to(lines, {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: 'power4.out',
            stagger: 0.08,
          })

          delayed = gsap.delayedCall(transformDelay, () => {
            const wordEl = quoteEl.querySelector<HTMLElement>('[data-word]')
            if (!wordEl?.parentNode) return

            // Defensive: limpia residuos si el efecto se ejecuta dos veces
            // (StrictMode dev, remount tras navegación) — evita duplicados.
            quoteEl.querySelectorAll('[data-slash-dynamic]').forEach((el) => el.remove())
            wordEl.style.removeProperty('-webkit-text-stroke')

            const slashL = document.createElement('span')
            slashL.textContent = '/ '
            slashL.dataset.slashDynamic = ''
            slashL.style.display = 'none'

            const slashR = document.createElement('span')
            slashR.textContent = ' /'
            slashR.dataset.slashDynamic = ''
            slashR.style.display = 'none'

            wordEl.parentNode.insertBefore(slashL, wordEl)
            wordEl.parentNode.insertBefore(slashR, wordEl.nextSibling)

            const proxy = { v: 0 }
            const tl = gsap.timeline()

            tl.to(proxy, {
              v: 0.6,
              duration: 1.4,
              ease: 'sine.inOut',
              onUpdate: () => {
                wordEl.style.setProperty('-webkit-text-stroke', `${proxy.v}px currentColor`)
              },
            })

            // Animar font-size 0 → natural (display:inline) — baseline alineado
            // con texto vecino y desplazamiento gradual.
            slashL.style.display = ''
            slashR.style.display = ''
            const fontSize = window.getComputedStyle(slashL).fontSize
            gsap.set(slashL, { fontSize: 0, opacity: 0 })
            gsap.set(slashR, { fontSize: 0, opacity: 0 })
            tl.to(slashL, { fontSize, opacity: 1, duration: 1.4, ease: 'sine.inOut' }, 0)
            tl.to(slashR, { fontSize, opacity: 1, duration: 1.4, ease: 'sine.inOut' }, 0)
          })
        },
      })

      cleanupRef.current = () => {
        st.kill()
        delayed?.kill()
        quoteEl.querySelectorAll('[data-slash-dynamic]').forEach((el) => el.remove())
        split.revert()
      }
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="w-full bg-warm-light relative"
      aria-label="Introducción"
    >
      {/* Sticky panel — texto centrado en pantalla completa warm-light */}
      <div className="sticky top-0 section-inner flex items-center min-h-screen py-section">
        <div className="grid grid-cols-12 gap-grid-gutter w-full">
          <div className="col-span-12 lg:col-span-10 lg:col-start-2">
            <p
              ref={quoteRef}
              className="font-serif font-light text-section text-fg tracking-[-0.02em] leading-[1.2]"
            >
              {t.rich('intro.solo', introComponents)}
            </p>
          </div>
        </div>
      </div>

      {/* 200vh spacer — mismo tiempo de scroll que IdentidadIntro para
          que la palabra "cambio" tenga margen para el efecto bold/slashes. */}
      <div style={{ height: '200vh' }} aria-hidden="true" />
    </section>
  )
}
