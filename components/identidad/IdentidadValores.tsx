'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

// Image order matches Figma: img[i] corresponds to valor text[i]
// Swap sequence from Figma: img1→img2 when text[1] enters, img2→img3 at text[2], img3→img4 at text[3]
const IMAGES = [
  '/identidad/valores-01.jpg',
  '/identidad/valores-02.jpg',
  '/identidad/valores-03.jpg',
  '/identidad/valores-04.jpg',
]

export function IdentidadValores() {
  const t = useTranslations('identidad')

  const sectionRef = useRef<HTMLElement>(null)
  const imgRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null])
  const txtRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const splits: any[] = []

      const imgs = imgRefs.current
      const txts = txtRefs.current

      if (reduced) {
        imgs.forEach((img) => img && gsap.set(img, { clipPath: 'inset(0 0% 0 0)' }))
        return
      }

      // All images start hidden
      imgs.forEach((img) => img && gsap.set(img, { clipPath: 'inset(0 100% 0 0)' }))

      // 1. First image reveals when section enters viewport
      const st0 = ScrollTrigger.create({
        trigger: section,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(imgs[0], { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease })
        },
      })
      cleanups.push(() => st0.kill())

      // 2–4. Image swaps: each triggered by the corresponding text block entering the viewport
      const swaps: Array<{ txtIdx: number; exitIdx: number; enterIdx: number }> = [
        { txtIdx: 1, exitIdx: 0, enterIdx: 1 },
        { txtIdx: 2, exitIdx: 1, enterIdx: 2 },
        { txtIdx: 3, exitIdx: 2, enterIdx: 3 },
      ]

      swaps.forEach(({ txtIdx, exitIdx, enterIdx }) => {
        const txt = txts[txtIdx]
        if (!txt) return

        const st = ScrollTrigger.create({
          trigger: txt,
          start: 'top 55%',
          once: true,
          onEnter: () => {
            // Exit current: left mask, 300ms
            gsap.to(imgs[exitIdx], { clipPath: 'inset(0 0 0 100%)', duration: 0.3, ease })
            // Enter new: right unmask, 400ms
            gsap.to(imgs[enterIdx], { clipPath: 'inset(0 0% 0 0)', duration: 0.4, ease })
          },
        })
        cleanups.push(() => st.kill())
      })

      // 5. Text line-mask reveals — each block on scroll
      txts.forEach((txt) => {
        if (!txt) return

        const allEls = Array.from(txt.querySelectorAll<HTMLElement>('[data-valor-el]'))
        if (!allEls.length) return

        allEls.forEach((el) => {
          const split = new SplitType(el, { types: 'lines' })
          splits.push(split)
          gsap.set(split.lines ?? [], { y: 60, opacity: 0 })
        })

        const allLines = allEls.flatMap((_, i) => splits[splits.length - allEls.length + i]?.lines ?? [])

        const st = ScrollTrigger.create({
          trigger: txt,
          start: 'top 70%',
          once: true,
          onEnter: () => {
            gsap.to(allLines, { y: 0, opacity: 1, duration: 1, ease: 'power4.out', stagger: 0.06 })
          },
        })
        cleanups.push(() => st.kill())
      })

      cleanupRef.current = () => {
        cleanups.forEach((fn) => fn())
        splits.forEach((s) => s.revert())
      }
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section ref={sectionRef} className="relative w-full bg-warm-light" aria-label="Valores">

      {/* Mobile: stacked image + text panels */}
      <div className="lg:hidden">
        {([0, 1, 2, 3] as const).map((i) => (
          <div key={i}>
            <div className="relative w-full aspect-[3/2] overflow-hidden">
              <Image src={IMAGES[i]} alt="" fill sizes="100vw" className="object-cover object-center" />
            </div>
            <div className="section-inner py-section">
              <div className="flex flex-col gap-6">
                <h3 className="font-serif font-light text-title-sm text-fg leading-[1.2]">
                  {t(`valores.${i}.title` as Parameters<typeof t>[0])}
                </h3>
                <div className="flex flex-col gap-6 font-mono text-body-sm text-fg">
                  <p>{t(`valores.${i}.body` as Parameters<typeof t>[0])}</p>
                  <p className="font-semibold">{t(`valores.${i}.closing` as Parameters<typeof t>[0])}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: sticky image left + scrolling text right */}
      <div className="hidden lg:flex">

        {/* Sticky image panel */}
        <div
          className="sticky top-0 self-start h-screen overflow-hidden flex-shrink-0 relative"
          style={{ width: '41.8%' }}
        >
          {IMAGES.map((src, i) => (
            <div
              key={i}
              ref={(el) => { imgRefs.current[i] = el }}
              className="absolute inset-0 will-change-[clip-path]"
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="42vw"
                className="object-cover object-center"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* Scrolling text panels — 4 × min-h-screen */}
        <div className="flex-1">
          {([0, 1, 2, 3] as const).map((i) => (
            <div
              key={i}
              ref={(el) => { txtRefs.current[i] = el }}
              className="min-h-screen flex items-center"
              style={{ paddingLeft: 'var(--grid-margin)', paddingRight: 'var(--grid-margin)' }}
            >
              <div className="flex flex-col gap-6 max-w-[42ch]">
                <h3
                  data-valor-el=""
                  className="font-serif font-light text-title-sm text-fg leading-[1.2]"
                >
                  {t(`valores.${i}.title` as Parameters<typeof t>[0])}
                </h3>
                <div className="flex flex-col gap-6 font-mono text-body-sm text-fg">
                  <p data-valor-el="">
                    {t(`valores.${i}.body` as Parameters<typeof t>[0])}
                  </p>
                  <p data-valor-el="" className="font-semibold">
                    {t(`valores.${i}.closing` as Parameters<typeof t>[0])}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
