'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import Image from 'next/image'
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
  const imageWrapperRef = useRef<HTMLDivElement>(null)
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

      // --- Image clip — dos scrubs independientes con onUpdate directo:
      //   · Entry : 'top 85%' → 'top top'         inset(0 100% 0 0) → 0 0% 0 0
      //   · Exit  : 'bottom bottom' → 'bottom top' 0 0% 0 0          → 0 0 0 100%
      //
      // Por qué no `gsap.to + animation:` como IdentidadHero: en aquél el
      // exit tween se crea dentro del onComplete del timeline de entrada
      // (ya con el clip-path en `inset 0`), así GSAP captura el "from"
      // correcto. Aquí ambos scrubs viven en paralelo y se crean a la vez
      // cuando el clip-path está aún en `inset(0 100% 0 0)` → el exit
      // capturaría "from" incorrecto y la imagen "saltaría". Con onUpdate
      // escribo la inline-style yo mismo y el bug desaparece.
      const imageWrapperEl = imageWrapperRef.current
      if (imageWrapperEl) {
        imageWrapperEl.style.clipPath = 'inset(0 100% 0 0)'

        const stEntry = ScrollTrigger.create({
          trigger: sectionEl,
          start: 'top 85%',
          end: 'top top',
          scrub: true,
          onUpdate: (self) => {
            const right = (1 - self.progress) * 100
            imageWrapperEl.style.clipPath = `inset(0 ${right}% 0 0)`
          },
        })

        const stExit = ScrollTrigger.create({
          trigger: sectionEl,
          start: 'bottom bottom',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            const left = self.progress * 100
            imageWrapperEl.style.clipPath = `inset(0 0% 0 ${left}%)`
          },
        })

        cleanups.push(() => {
          stEntry.kill()
          stExit.kill()
        })
      }

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
    <section
      ref={sectionRef}
      className="relative w-full bg-warm-light"
      aria-labelledby="liminal-title"
    >
      {/* Sticky panel — pinned 100vh, dentro vive la imagen absolute (desktop)
          y el texto centrado vertical. Mismo patrón que IdentidadHero pero
          en sticky en lugar de min-h-screen en flow, porque aquí queremos
          que el spacer de abajo arrastre el clip-exit (scrub bottom-bottom →
          bottom-top de la section). */}
      <div className="sticky top-0 min-h-screen flex items-center py-section">
        {/* Imagen desktop — absolute, ocupa todo el alto del sticky (100vh)
            y llega al borde derecho del viewport. Left:58.2% replica la
            proporción del hero de Identidad (~42% ancho viewport). will-change
            para evitar repaint thrashing durante el scrub del clip-path. */}
        <div
          ref={imageWrapperRef}
          className="absolute top-0 bottom-0 right-0 hidden lg:block will-change-[clip-path]"
          style={{ left: '58.2%' }}
        >
          <Image
            src="/home/liminal-image.webp"
            alt=""
            aria-hidden="true"
            fill
            sizes="42vw"
            className="object-cover object-center"
          />
        </div>

        {/* Texto — relative z-content sobre la imagen absolute. Mismo grid
            que antes; columna izquierda (col-start-2 col-span-5) con
            titular + body. */}
        <div className="relative z-content section-inner w-full">
          <div className="grid grid-cols-12 gap-grid-gutter w-full">
            <div className="col-span-12 lg:col-start-2 lg:col-span-5">
              <h2
                ref={titleRef}
                id="liminal-title"
                className="font-serif font-light text-title text-fg tracking-[-0.02em] leading-[1.1]"
              >
                {t('liminal.title')}
              </h2>
              <div
                ref={bodyRef}
                className="mt-10 flex flex-col gap-6 font-mono text-body-sm text-fg leading-[1.6]"
              >
                <p data-body-p="">
                  {t.rich('liminal.body1', liminalComponents)}{' '}
                  {t.rich('liminal.body2', liminalComponents)}
                </p>
                <p data-body-p="">
                  {t.rich('liminal.body3', liminalComponents)}{' '}
                  {t.rich('liminal.body4', liminalComponents)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Imagen mobile — en flow, debajo del sticky (al desengancharse) */}
      <div className="lg:hidden relative w-full aspect-[16/9] overflow-hidden">
        <Image
          src="/home/liminal-image.webp"
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Spacer — duplica el tiempo de pin sticky (200vh extra → sticky se
          queda pinned ~200vh) para dar pausa al texto/imagen. Memoria
          `feedback_sticky_text_pause`: 100vh sería texto solo, 200-300vh con
          scrub de imagen encima (es nuestro caso). Los últimos 100vh
          arrastran el clip-exit (`bottom bottom` → `bottom top`). */}
      <div style={{ height: '200vh' }} aria-hidden="true" />
    </section>
  )
}
