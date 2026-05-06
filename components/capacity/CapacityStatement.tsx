'use client'

import { useRef, useEffect, type ReactNode } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

/* ==========================================================================
   CapacityStatement — sticky statement con efecto bold canónico + marquee
   --------------------------------------------------------------------------
   Misma mecánica que IdentidadIntro:
     · Sticky panel min-h-screen + spacer 100vh para que el texto se quede
       quieto mientras el usuario scrollea.
     · Líneas reveladas con line-mask (y:60→0, opacity:0→1, stagger 0.08s).
     · Tras el reveal, la palabra marcada con <strong> recibe el efecto
       canónico: -webkit-text-stroke 0→0.6px + slashes "/ palabra /" que
       aparecen simultáneamente.

   Bottom de la sección: marquee infinito derecha→izquierda con los nombres
   de clientes a tamaño "super" (≈ título Metodología) y opacidad 10%.
   ========================================================================== */

interface CapacityStatementProps {
  /** Statement renderizado con t.rich() y richComponents.boldWord (incluye <strong>). */
  statement: ReactNode
  /** Línea opcional de clientes — se renderiza como marquee abajo. */
  clients?: string
  /** Aria label de la section. */
  ariaLabel?: string
}

export function CapacityStatement({
  statement,
  clients,
  ariaLabel = 'Declaración',
}: CapacityStatementProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const quoteRef = useRef<HTMLParagraphElement>(null)
  const marqueeRef = useRef<HTMLDivElement>(null)
  const marqueeWrapperRef = useRef<HTMLDivElement>(null)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let marqueeTw: any = null

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

            // Slashes pre-renderizados via richComponents.boldWord.
            // Única animación: text-stroke 0→0.6px del word.
            const proxy = { v: 0 }
            gsap.to(proxy, {
              v: 0.6,
              duration: 0.5,
              ease: 'sine.inOut',
              onUpdate: () => {
                wordEl.style.setProperty('-webkit-text-stroke', `${proxy.v}px currentColor`)
              },
            })
          })
        },
      })

      // Marquee infinita derecha → izquierda. Dos copias idénticas; al llegar
      // a -50% la 2ª copia ocupa la posición de la 1ª, sin salto perceptible.
      const marqueeEl = marqueeRef.current
      if (marqueeEl) {
        marqueeTw = gsap.to(marqueeEl, {
          xPercent: -50,
          duration: 20,
          ease: 'none',
          repeat: -1,
        })
      }

      // Parallax de salida del marquee — sube más rápido que el statement
      // mientras se hace scroll por la sección sticky. Al final del rango,
      // el marquee ya ha salido por arriba y deja la pantalla limpia para
      // que llegue la siguiente sección.
      let marqueeParallaxST: ScrollTrigger | null = null
      const marqueeWrapperEl = marqueeWrapperRef.current
      if (marqueeWrapperEl) {
        const tw = gsap.to(marqueeWrapperEl, {
          yPercent: -100,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top top',
            end: '+=80%',
            scrub: true,
          },
        })
        marqueeParallaxST = tw.scrollTrigger ?? null
      }

      cleanupRef.current = () => {
        st.kill()
        delayed?.kill()
        marqueeTw?.kill()
        marqueeParallaxST?.kill()
        quoteEl.querySelector<HTMLElement>('[data-word]')?.style.removeProperty('-webkit-text-stroke')
        split.revert()
      }
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section ref={sectionRef} className="w-full bg-warm-light relative" aria-label={ariaLabel}>
      <div className="sticky top-0 min-h-screen flex items-center overflow-hidden">
        <div className="section-inner py-section w-full">
          <div className="grid grid-cols-12 gap-grid-gutter w-full">
            <div className="col-start-2 col-span-11 lg:col-span-10 lg:col-start-2">
              <p
                ref={quoteRef}
                className="font-serif font-light text-section text-fg tracking-[-0.02em] leading-[1.2]"
              >
                {statement}
              </p>
            </div>
          </div>
        </div>

        {/* Marquee de clientes — bottom edge, full-width, large serif al 10%.
            Wrapper externo (parallax) recibe yPercent scrubbed → sale por
            arriba antes que el statement. Inner mantiene su rotación
            infinita xPercent. */}
        {clients && (
          <div className="absolute inset-x-0 bottom-0 overflow-hidden pointer-events-none">
            <div ref={marqueeWrapperRef} className="will-change-transform">
              <div
                ref={marqueeRef}
                className="flex whitespace-nowrap font-serif font-normal text-fg/10 leading-[0.9] tracking-[-0.04em] will-change-transform"
                style={{ fontSize: 'clamp(80px, 15vw, 240px)' }}
                aria-label={clients}
              >
                <span className="pr-[clamp(40px,5vw,100px)]" aria-hidden="true">{clients}</span>
                <span className="pr-[clamp(40px,5vw,100px)]" aria-hidden="true">{clients}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ height: '100vh' }} aria-hidden="true" />
    </section>
  )
}
