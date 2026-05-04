'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

const liminalComponents = {
  strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
}

export function IdentidadLiminal() {
  const t = useTranslations('identidad')

  const sectionRef = useRef<HTMLElement>(null)
  const titleRef   = useRef<HTMLHeadingElement>(null)
  const bodyRef    = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const sectionEl = sectionRef.current
    const titleEl   = titleRef.current
    const bodyEl    = bodyRef.current
    if (!sectionEl || !titleEl || !bodyEl) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
      ])

      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      const cleanups: Array<() => void> = []

      if (reduced) return

      // --- Title: line-mask reveal ---
      const titleSplit = new SplitType(titleEl, { types: 'lines' })
      const titleLines = titleSplit.lines ?? []
      wrapLinesInMask(titleLines)
      gsap.set(titleLines, { y: 80, opacity: 0 })

      // --- Body: per-paragraph line reveal ---
      const bodyPs = Array.from(bodyEl.querySelectorAll<HTMLElement>('[data-body-p]'))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bodySplits: any[] = bodyPs.map((p) => new SplitType(p, { types: 'lines' }))
      const allBodyLines = bodySplits.flatMap((s) => s.lines ?? [])
      gsap.set(allBodyLines, { y: 80, opacity: 0 })

      // Fires when section sticks to top of viewport (text reveals centered)
      const st1 = ScrollTrigger.create({
        trigger: sectionEl,
        start: 'top top',
        once: true,
        onEnter: () => {
          gsap.to(titleLines, { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.1 })
          gsap.to(allBodyLines, {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: 'power4.out',
            stagger: 0.08,
            delay: 0.2,
          })
        },
      })
      cleanups.push(() => {
        st1.kill()
        titleSplit.revert()
        bodySplits.forEach((s) => s.revert())
      })

      // --- Mask out all Valores images as Liminal scrolls in ---
      // Lateral right-to-left clip on the full stack so no lower image peeks through
      const valoresImgs = Array.from(
        document.querySelectorAll<HTMLElement>('[data-valores-img]'),
      )
      if (valoresImgs.length) {
        const st2 = ScrollTrigger.create({
          trigger: sectionEl,
          start: 'top bottom',
          end: 'top top',
          scrub: 0.3,
          onUpdate: (self) => {
            const clip = `inset(0 ${self.progress * 100}% 0 0)`
            valoresImgs.forEach((el) => { el.style.clipPath = clip })
          },
        })
        cleanups.push(() => {
          st2.kill()
          valoresImgs.forEach((el) => { el.style.clipPath = '' })
        })
      }

      cleanupRef.current = () => cleanups.forEach((fn) => fn())
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section ref={sectionRef} className="relative w-full bg-warm-light" aria-labelledby="liminal-title">
      {/* Sticky text panel — holds pinned while the 200vh spacer scrolls */}
      <div className="sticky top-0 min-h-screen section-inner flex items-center py-section">
        <div className="grid grid-cols-12 gap-grid-gutter w-full">
          {/* Mismo estilo que los titulares de las páginas legales y los heros
              de Capacidades: text-[clamp(40px,7.5vw,120px)], leading 1.0,
              tracking -0.03. Un escalón por debajo del text-super. */}
          <div className="col-span-12 lg:col-start-2 lg:col-span-4">
            <h2
              ref={titleRef}
              id="liminal-title"
              className="font-serif font-normal text-fg select-none text-[clamp(40px,7.5vw,120px)] leading-[1.0] tracking-[-0.03em]"
            >
              {t('liminal.title')}
            </h2>
          </div>
          {/* mt aprox = 2 × line-height del título (= 2 × clamp(40px,7.5vw,120px)
              = clamp(80px,15vw,240px)). Así el TOP del párrafo coincide con
              el BOTTOM del título. La sección usa items-center → al ser el
              bloque más alto, el título sube proporcionalmente. */}
          <div className="col-span-12 mt-10 lg:col-start-6 lg:col-span-6 lg:mt-[clamp(120px,17vw,280px)]">
            <div
              ref={bodyRef}
              className="flex flex-col gap-6 font-mono text-body-sm text-fg leading-[1.5]"
            >
              <p data-body-p="">{t.rich('liminal.body1', liminalComponents)}</p>
              <p data-body-p="">{t.rich('liminal.body2', liminalComponents)}</p>
              <p data-body-p="">{t.rich('liminal.body3', liminalComponents)}</p>
              <p data-body-p="">{t.rich('liminal.body4', liminalComponents)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer — keeps the sticky text pinned for a reading beat */}
      <div style={{ height: '200vh' }} aria-hidden="true" />
    </section>
  )
}
