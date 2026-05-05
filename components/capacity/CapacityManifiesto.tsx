'use client'

import Image from 'next/image'
import { useRef, useEffect, type ReactNode } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

/* ==========================================================================
   CapacityManifiesto — sección exclusiva de Transformación cultural.
   --------------------------------------------------------------------------
   Layout:
     · Top: título serif (line-mask) + body1 mono debajo (gap-6).
       body1 lleva un <strong> con peso semibold — sin slashes ni stroke.
     · Imagen full-bleed-derecha desde col 2 con clip-path lateral reveal.
     · Recuadro blanco posicionado en cols 7-11 del grid externo, centrado
       verticalmente sobre la imagen (clip-path lateral en cascada + body2
       con line-mask reveal).
   ========================================================================== */

interface CapacityManifiestoProps {
  title: string
  /** body1 renderizado con t.rich({ strong }) — semibold sólo, sin efecto canónico. */
  body1: ReactNode
  body2: string
  imageSrc: string
  ariaLabel?: string
}

export function CapacityManifiesto({
  title,
  body1,
  body2,
  imageSrc,
  ariaLabel = 'Manifiesto',
}: CapacityManifiestoProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const body1Ref = useRef<HTMLParagraphElement>(null)
  const body2Ref = useRef<HTMLParagraphElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const whiteBoxRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const sectionEl = sectionRef.current
    const titleEl = titleRef.current
    const body1El = body1Ref.current
    const body2El = body2Ref.current
    const imageEl = imageRef.current
    const whiteBoxEl = whiteBoxRef.current
    if (!sectionEl || !titleEl || !body1El || !body2El || !imageEl || !whiteBoxEl) return

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
        gsap.set(whiteBoxEl, { clipPath: 'inset(0 0% 0 0)' })
        return
      }

      const cleanups: Array<() => void> = []

      // 1. Title — line-mask reveal
      const titleSplit = new SplitType(titleEl, { types: 'lines' })
      const titleLines = titleSplit.lines ?? []
      wrapLinesInMask(titleLines)
      gsap.set(titleLines, { y: 60, opacity: 0 })

      const titleST = ScrollTrigger.create({
        trigger: sectionEl,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(titleLines, {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: 'power4.out',
            stagger: 0.08,
          })
        },
      })
      cleanups.push(() => {
        titleST.kill()
        titleSplit.revert()
      })

      // 2. body1 — line-mask
      const body1Split = new SplitType(body1El, { types: 'lines' })
      const body1Lines = body1Split.lines ?? []
      wrapLinesInMask(body1Lines)
      gsap.set(body1Lines, { y: 40, opacity: 0 })

      const body1ST = ScrollTrigger.create({
        trigger: sectionEl,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(body1Lines, {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power4.out',
            stagger: 0.06,
            delay: 0.4,
          })
        },
      })
      cleanups.push(() => {
        body1ST.kill()
        body1Split.revert()
      })

      // 3. Imagen — clip-path lateral reveal canónico
      gsap.set(imageEl, { clipPath: 'inset(0 100% 0 0)' })
      const imageST = ScrollTrigger.create({
        trigger: imageEl,
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
      cleanups.push(() => imageST.kill())

      // 4. Cuadro blanco — clip-path lateral en cascada + body2 line-mask
      gsap.set(whiteBoxEl, { clipPath: 'inset(0 100% 0 0)' })
      const body2Split = new SplitType(body2El, { types: 'lines' })
      const body2Lines = body2Split.lines ?? []
      wrapLinesInMask(body2Lines)
      gsap.set(body2Lines, { y: 30, opacity: 0 })

      const whiteBoxST = ScrollTrigger.create({
        trigger: imageEl,
        start: 'top 70%',
        once: true,
        onEnter: () => {
          gsap.to(whiteBoxEl, {
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.9,
            ease: 'cubic-bezier(.16,1,.3,1)',
            delay: 0.35,
          })
          gsap.to(body2Lines, {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power4.out',
            stagger: 0.06,
            delay: 0.95,
          })
        },
      })
      cleanups.push(() => {
        whiteBoxST.kill()
        body2Split.revert()
      })

      cleanupRef.current = () => cleanups.forEach((fn) => fn())
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="w-full bg-warm-light pt-section pb-[clamp(120px,15vw,200px)]"
      aria-labelledby="manifiesto-title"
      aria-label={ariaLabel}
    >
      {/* Top text block — título en col 2, body1 desplazado a col 3 */}
      <div className="section-inner">
        <div className="grid grid-cols-12 gap-grid-gutter">
          <h2
            ref={titleRef}
            id="manifiesto-title"
            className="col-span-12 lg:col-start-2 lg:col-span-5 font-serif font-normal text-section text-fg"
          >
            {title}
          </h2>
          <p
            ref={body1Ref}
            className="col-span-12 mt-6 lg:mt-6 lg:col-start-3 lg:col-span-4 font-mono text-body-sm text-fg max-w-[42ch]"
          >
            {body1}
          </p>
        </div>
      </div>

      {/* Imagen + cuadro blanco — siblings en el mismo grid; el cuadro
          ocupa cols 7-11 superpuesto sobre la imagen vía gridRow:1. */}
      <div className="section-inner mt-[clamp(64px,10vw,160px)]">
        <div className="grid grid-cols-12 gap-grid-gutter items-center">
          <div
            ref={imageRef}
            className="col-span-12 lg:col-start-2 lg:col-span-11 relative overflow-hidden"
            style={{
              gridRow: 1,
              marginRight:
                'calc(-1 * max(var(--grid-margin), (100vw - var(--grid-max-w)) / 2))',
              aspectRatio: '16 / 7',
              clipPath: 'inset(0 100% 0 0)',
            }}
          >
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="(min-width: 1024px) 92vw, 100vw"
              className="object-cover"
            />
          </div>

          <div
            ref={whiteBoxRef}
            className="col-span-12 lg:col-start-7 lg:col-span-5 bg-pure-white relative z-10"
            style={{
              gridRow: 1,
              padding: 'clamp(20px, 2vw, 32px)',
              clipPath: 'inset(0 100% 0 0)',
            }}
          >
            <p ref={body2Ref} className="font-mono text-body-sm text-fg">
              {body2}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
