'use client'

import Image from 'next/image'
import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

/* ==========================================================================
   HomeIntroReveal — strip de imagen full-width + sticky pin + crop overlay
   --------------------------------------------------------------------------
   Secuencia en scroll:
     1. La imagen entra con reveal lateral canónico (clip-path right→left)
        ocupando full-width al llegar al top del viewport.
     2. Cuadro blanco centrado verticalmente sobre la imagen, con el título
        line-mask "Diseñamos para la transición.".
     3. Mientras el strip queda sticky, aparece debajo a la izquierda el body
        en mono con line-mask reveal.
     4. Un crop de la misma imagen sube desde abajo (scrub) y termina
        ocupando exactamente el espacio del cuadro blanco — lo "rellena".
     5. Hold prolongado tras el aterrizaje del crop antes de soltar el sticky.
   ========================================================================== */

// Altura objetivo 615px en desktop, escalada a viewport para responsive.
const IMAGE_HEIGHT = 'clamp(380px, 56vh, 615px)'
const SQUARE_SIZE = 'clamp(280px, 28vw, 460px)'

export function HomeIntroReveal() {
  const t = useTranslations('home')

  const sectionRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const whiteBoxRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLParagraphElement>(null)
  const bodyRef = useRef<HTMLParagraphElement>(null)
  const smallImgRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    const imageEl = imageRef.current
    const whiteBoxEl = whiteBoxRef.current
    const titleEl = titleRef.current
    const bodyEl = bodyRef.current
    const smallImgEl = smallImgRef.current
    if (!section || !imageEl || !whiteBoxEl || !titleEl || !bodyEl || !smallImgEl) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
      ])
      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()

      if (reduced) {
        gsap.set(imageEl, { clipPath: 'inset(0 0% 0 0)' })
        gsap.set(whiteBoxEl, { opacity: 1 })
        gsap.set(smallImgEl, { y: 0 })
        return
      }

      const cleanups: Array<() => void> = []

      // 1. Reveal lateral de la imagen (canónico)
      gsap.set(imageEl, { clipPath: 'inset(0 100% 0 0)' })
      const revealST = ScrollTrigger.create({
        trigger: section,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(imageEl, {
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.9,
            ease: 'cubic-bezier(.16,1,.3,1)',
          })
        },
      })
      cleanups.push(() => revealST.kill())

      // 2. Cuadro blanco + título — fade-in tras el reveal
      gsap.set(whiteBoxEl, { opacity: 0 })
      const titleSplit = new SplitType(titleEl, { types: 'lines' })
      const titleLines = titleSplit.lines ?? []
      wrapLinesInMask(titleLines)
      gsap.set(titleLines, { y: 40, opacity: 0 })
      const whiteBoxST = ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        once: true,
        onEnter: () => {
          gsap.to(whiteBoxEl, {
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
            delay: 0.5,
          })
          gsap.to(titleLines, {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: 'power4.out',
            stagger: 0.08,
            delay: 0.8,
          })
        },
      })
      cleanups.push(() => {
        whiteBoxST.kill()
        titleSplit.revert()
      })

      // 3. Body en mono — line-mask reveal cuando entra el sticky
      const bodySplit = new SplitType(bodyEl, { types: 'lines' })
      const bodyLines = bodySplit.lines ?? []
      wrapLinesInMask(bodyLines)
      gsap.set(bodyLines, { y: 40, opacity: 0 })
      const bodyST = ScrollTrigger.create({
        trigger: section,
        start: '10% top',
        once: true,
        onEnter: () => {
          gsap.to(bodyLines, {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power4.out',
            stagger: 0.06,
          })
        },
      })
      cleanups.push(() => {
        bodyST.kill()
        bodySplit.revert()
      })

      // 4. Crop sube desde abajo (scrub) y aterriza sobre el cuadro blanco.
      // Inicial: y = altura del viewport (off-screen abajo).
      // Termina antes del 50% para dar tiempo de hold (50%-75% = ~100vh dwell).
      gsap.set(smallImgEl, { y: () => window.innerHeight })
      const smallST = ScrollTrigger.create({
        trigger: section,
        start: '20% top',
        end: '50% top',
        scrub: 1,
        animation: gsap.to(smallImgEl, { y: 0, ease: 'none' }),
      })
      cleanups.push(() => smallST.kill())

      cleanupRef.current = () => cleanups.forEach((fn) => fn())
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-warm-light"
      style={{ minHeight: '400vh' }}
      aria-label="Diseñamos para la transición"
    >
      {/* Sticky pin — sticks for ~300vh (75% del scroll de la sección) */}
      <div className="sticky top-0 w-full h-screen">
        {/* Imagen full-width con reveal lateral — sin blur */}
        <div
          ref={imageRef}
          className="absolute inset-x-0 top-0 overflow-hidden"
          style={{
            height: IMAGE_HEIGHT,
            clipPath: 'inset(0 100% 0 0)',
          }}
        >
          <Image
            src="/home/intro-img.webp"
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover blur-[6px] scale-105"
          />
        </div>

        {/* Slot centrado verticalmente dentro del strip de imagen — contiene
            el cuadro blanco y el crop superpuestos en la misma posición.
            Posicionado en el grid 12-cols (col-start-8 col-span-4) para que
            su borde derecho cuadre con la columna 11 (una columna a la
            izquierda del antiguo borde a grid-margin). */}
        <div
          className="absolute inset-x-0 section-inner"
          style={{ top: 0, height: IMAGE_HEIGHT }}
        >
          <div className="grid grid-cols-12 gap-grid-gutter h-full">
            <div className="col-start-8 col-span-4 h-full flex items-center justify-end">
              <div
                className="relative"
                style={{ width: SQUARE_SIZE, height: SQUARE_SIZE }}
              >
                {/* Cuadro blanco con título */}
                <div
                  ref={whiteBoxRef}
                  className="absolute inset-0 bg-pure-white flex items-center justify-center"
                  style={{ padding: 'clamp(24px, 3vw, 48px)' }}
                >
                  <p
                    ref={titleRef}
                    className="font-serif font-light text-section text-fg text-center leading-tight tracking-tight"
                  >
                    {t('intro.revealTitle')}
                  </p>
                </div>

                {/* Crop de la misma imagen — sin blur; scrub-up overlay */}
                <div ref={smallImgRef} className="absolute inset-0">
                  <Image
                    src="/home/intro-img.webp"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 28vw, 90vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body en mono — centrado verticalmente en la franja warm-light que
            queda entre el strip de imagen y el bottom del viewport (sticky). */}
        <div
          className="absolute left-0 right-0 flex items-center"
          style={{
            top: IMAGE_HEIGHT,
            bottom: 0,
          }}
        >
          <div className="section-inner w-full">
            <div className="grid grid-cols-12 gap-grid-gutter">
              <p
                ref={bodyRef}
                className="col-span-12 lg:col-start-2 lg:col-span-4 font-mono text-body-sm text-fg"
              >
                {t('intro.revealBody')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
