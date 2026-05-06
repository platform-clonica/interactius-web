'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

// Image order matches Figma: img[i] corresponds to valor text[i]
// Swap sequence from Figma: img1→img2 when text[1] enters, img2→img3 at text[2], img3→img4 at text[3]
const IMAGES = [
  '/identidad/valores-01.webp',
  '/identidad/valores-02.webp',
  '/identidad/valores-03.webp',
  '/identidad/valores-04.webp',
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
      const ease = 'power4.inOut'
      const cleanups: Array<() => void> = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const splits: any[] = []

      const imgs = imgRefs.current
      const txts = txtRefs.current

      if (reduced) {
        imgs.forEach((img) => img && gsap.set(img, { clipPath: 'inset(0 0% 0 0)' }))
        return
      }

      // All images start hidden; img[0] reveals when txt[0] enters viewport
      // (= exactly when IdentidadIntro exits), the rest swap on scroll.
      imgs.forEach((img, i) => {
        if (!img) return
        gsap.set(img, {
          clipPath: 'inset(0 100% 0 0)',
          zIndex: i + 1,
        })
      })

      // 1. First image slides in when txt[0] enters viewport bottom,
      //    which coincides with IdentidadIntro leaving the screen.
      //    Bidirectional so scrolling back hides it again.
      if (txts[0]) {
        const st0 = ScrollTrigger.create({
          trigger: txts[0],
          start: 'top bottom',
          onEnter: () => {
            gsap.to(imgs[0], { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease })
          },
          onLeaveBack: () => {
            gsap.to(imgs[0], { clipPath: 'inset(0 100% 0 0)', duration: 0.6, ease })
          },
        })
        cleanups.push(() => st0.kill())
      }

      // 2–4. Bidirectional swaps — onEnter (scroll down) and onLeaveBack (scroll up).
      // Forward: new image slides in from right over the current (no exit animation needed).
      // Backward: current image slides out to the right, revealing the one underneath.
      ;[1, 2, 3].forEach((imgIdx) => {
        const txt = txts[imgIdx]
        if (!txt) return

        const st = ScrollTrigger.create({
          trigger: txt,
          start: 'top 55%',
          onEnter: () => {
            gsap.to(imgs[imgIdx], { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease })
          },
          onLeaveBack: () => {
            gsap.to(imgs[imgIdx], { clipPath: 'inset(0 100% 0 0)', duration: 0.6, ease })
          },
        })
        cleanups.push(() => st.kill())
      })

      // 5. Text line-mask reveals — each block on scroll.
      //    txt[0] fires as soon as it enters the viewport (in sync with img[0]);
      //    txt[1-3] fire at the conventional 70% threshold.
      txts.forEach((txt, i) => {
        if (!txt) return

        const allEls = Array.from(txt.querySelectorAll<HTMLElement>('[data-valor-el]'))
        if (!allEls.length) return

        allEls.forEach((el) => {
          const split = new SplitType(el, { types: 'lines' })
          splits.push(split)
          const lines = split.lines ?? []
          // Line-mask only on h3 titulares; paragraphs keep fade+Y
          if (el.tagName === 'H3') wrapLinesInMask(lines)
          gsap.set(lines, { y: 60, opacity: 0 })
        })

        const allLines = allEls.flatMap((_, j) => splits[splits.length - allEls.length + j]?.lines ?? [])

        const st = ScrollTrigger.create({
          trigger: txt,
          start: i === 0 ? 'top bottom' : 'top 70%',
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
      <div className="md:hidden">
        {([0, 1, 2, 3] as const).map((i) => (
          <div key={i}>
            <div className="relative w-full aspect-[3/2] overflow-hidden">
              <Image
                src={IMAGES[i]}
                alt={t(`valores.${i}.title` as Parameters<typeof t>[0])}
                fill
                sizes="100vw"
                className="object-cover object-center"
              />
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
      <div className="hidden md:flex">

        {/* Sticky image panel */}
        <div
          className="sticky top-0 self-start h-screen overflow-hidden flex-shrink-0 relative bg-warm-light"
          style={{ width: '41.8%' }}
        >
          {IMAGES.map((src, i) => (
            <div
              key={i}
              ref={(el) => { imgRefs.current[i] = el }}
              className="absolute inset-0 will-change-[clip-path]"
              data-valores-img=""
            >
              <Image
                src={src}
                alt={t(`valores.${i}.title` as Parameters<typeof t>[0])}
                fill
                sizes="42vw"
                className="object-cover object-center"
                priority={i === 0}
              />
            </div>
          ))}
        </div>

        {/* Scrolling text panels — spacer + 4 × min-h-screen */}
        <div className="flex-1">
          {/* 100vh spacer so txt[0] only enters the viewport once IdentidadIntro
              has fully exited — the overlap between sections is always one viewport height */}
          <div style={{ height: '100vh' }} aria-hidden="true" />
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
