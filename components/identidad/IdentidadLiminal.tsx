'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

export function IdentidadLiminal() {
  const t = useTranslations('identidad')

  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const bodyRef = useRef<HTMLParagraphElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const quoteRef = useRef<HTMLParagraphElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const titleEl = titleRef.current
    const bodyEl = bodyRef.current
    const imageEl = imageRef.current
    const panelEl = panelRef.current
    const quoteEl = quoteRef.current
    if (!titleEl || !bodyEl || !imageEl || !panelEl || !quoteEl) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
      ])

      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      const ease = 'cubic-bezier(.16,1,.3,1)'
      const cleanups: Array<() => void> = []

      if (reduced) {
        gsap.set([imageEl, panelEl], { clipPath: 'inset(0 0% 0 0)' })
        return
      }

      // --- Title + body line-mask reveal (IO 0.12) ---
      const titleSplit = new SplitType(titleEl, { types: 'lines' })
      const titleLines = titleSplit.lines ?? []
      gsap.set(titleLines, { y: 80, opacity: 0 })

      const bodySplit = new SplitType(bodyEl, { types: 'lines' })
      const bodyLines = bodySplit.lines ?? []
      gsap.set(bodyLines, { y: 80, opacity: 0 })

      const st1 = ScrollTrigger.create({
        trigger: titleEl,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          // Title reveal
          gsap.to(titleLines, { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.1 })
          // Body reveal +100ms after title starts
          gsap.to(bodyLines, {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: 'power4.out',
            stagger: 0.1,
            delay: 0.1,
          })
        },
      })
      cleanups.push(() => { st1.kill(); titleSplit.revert(); bodySplit.revert() })

      // --- Image section sequence (IO 0.12) ---
      // Initial states
      gsap.set(imageEl, { clipPath: 'inset(0 100% 0 0)' })
      gsap.set(panelEl, { clipPath: 'inset(0 100% 0 0)' })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let quoteSplit: any = null
      const st2 = ScrollTrigger.create({
        trigger: imageEl,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          // Image clip reveal: 0.9s
          gsap.to(imageEl, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease })

          // Warm-light panel clip reveal: +300ms, 0.8s
          gsap.to(panelEl, {
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.8,
            ease,
            delay: 0.3,
            onComplete: () => {
              // Quote line-mask reveal after panel completes
              quoteSplit = new SplitType(quoteEl, { types: 'lines' })
              const quoteLines = quoteSplit.lines ?? []
              gsap.from(quoteLines, {
                y: 80,
                opacity: 0,
                duration: 1.2,
                ease: 'power4.out',
                stagger: 0.1,
              })
            },
          })
        },
      })
      cleanups.push(() => { st2.kill(); quoteSplit?.revert() })

      cleanupRef.current = () => cleanups.forEach((fn) => fn())
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section ref={sectionRef} className="w-full bg-warm-light" aria-labelledby="liminal-title">
      <div className="section-inner pt-section pb-0">
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-span-12 lg:col-span-3">
            <h2
              ref={titleRef}
              id="liminal-title"
              className="font-serif font-normal text-section text-fg tracking-[-0.02em] leading-[1.2]"
            >
              {t('liminal.title')}
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-8 lg:col-start-5 mt-8 lg:mt-0">
            <p
              ref={bodyRef}
              className="font-mono text-body-sm text-fg leading-[1.5]"
            >
              {t('liminal.body')}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom image area */}
      <div className="relative mt-section h-[533px] w-full overflow-hidden">

        {/* Blurred background image — clip-path reveal */}
        <div
          ref={imageRef}
          className="absolute inset-x-0 top-0 bottom-0 will-change-[clip-path]"
          aria-hidden="true"
        >
          <div className="absolute inset-[-8%]">
            <Image
              src="/identidad/liminal-bg.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center blur-[15px]"
            />
          </div>
        </div>

        {/* Warm-light panel (right side) — clip-path reveal, +300ms */}
        <div
          ref={panelRef}
          className="absolute bottom-0 top-0 bg-warm-light will-change-[clip-path]"
          style={{ left: 'calc(50% + 18.4%)', right: 0 }}
          aria-hidden="true"
        />

        {/* Quote — line-mask reveal after panel completes */}
        <div
          className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-center"
          style={{ left: 'calc(50% + 18.4%)', right: 0 }}
        >
          <p
            ref={quoteRef}
            className="font-serif font-light text-section text-fg leading-[1.2] tracking-[-0.02em] px-8 max-w-[24ch]"
          >
            {t('liminal.quote')}
          </p>
        </div>
      </div>
    </section>
  )
}
