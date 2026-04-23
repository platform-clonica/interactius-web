'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

// ─── Scroll budget constants (px) ────────────────────────────────────────────
const HERO_SCROLL = 1260  // total scroll distance while hero is active
const PHASE1_END  = 380   // editorial clip → fullscreen
const PHASE2_END  = 880   // fullscreen dwell (video fades in at start of phase)
const PHASE3_END  = 1260  // fullscreen → collapses from bottom

// Read computed pixel value of --grid-margin from the browser
function getGridMarginPx(): number {
  if (typeof document === 'undefined') return 0
  const tmp = document.createElement('div')
  tmp.style.cssText =
    'position:fixed;top:0;left:0;width:var(--grid-margin);height:0;visibility:hidden;pointer-events:none'
  document.body.appendChild(tmp)
  const w = tmp.getBoundingClientRect().width
  document.body.removeChild(tmp)
  return w
}

interface HeroScrollProps {
  /** h1 tagline rendered server-side (translated) — passed as children */
  children?: React.ReactNode
  posterSrc?: string
  posterAlt?: string
  videoSrc?: string
}

export function HeroScroll({
  children,
  posterSrc = '/home/hero-poster.webp',
  posterAlt = '',
  videoSrc,
}: HeroScrollProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const spacerRef  = useRef<HTMLDivElement>(null)
  const videoRef   = useRef<HTMLVideoElement>(null)
  const taglineRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    const spacer  = spacerRef.current
    const tagline = taglineRef.current
    if (!section || !spacer || !tagline) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
      ])

      gsap.registerPlugin(ScrollTrigger)

      const reduced  = getReducedMotion()
      const cleanups: Array<() => void> = []
      const videoEl  = videoRef.current

      // ── Load animation: h1 line-mask reveal ────────────────────────────────
      const h1 = tagline.querySelector<HTMLHeadingElement>('h1')
      if (h1) {
        if (reduced) {
          gsap.set(h1, { y: 0, opacity: 1 })
        } else {
          const split = new SplitType(h1, { types: 'lines' })
          const lines = split.lines ?? []
          wrapLinesInMask(lines)
          gsap.set(lines, { y: 80, opacity: 0 })
          gsap.to(lines, {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: 'power4.out',
            stagger: 0.1,
            delay: 0.2,
          })
          cleanups.push(() => split.revert())
        }
      }

      // ── Scroll animation: clip-path phases ─────────────────────────────────
      if (reduced) {
        // Reduced motion: hero fullscreen immediately, video plays at once
        gsap.set(section, { clipPath: 'inset(0 0 0 0)', zIndex: 400 })
        if (videoEl) {
          videoEl.style.opacity = '1'
          videoEl.play().catch(() => {})
        }
      } else {
        // Cache grid margin + top inset; refresh on resize (clamp values change with vw)
        let gm = getGridMarginPx()
        // Smaller top inset on mobile so the editorial clip is less aggressive
        const getTopInset = () => (window.innerWidth < 768 ? 30 : 48)
        let topInset = getTopInset()
        const onResize = () => { gm = getGridMarginPx(); topInset = getTopInset() }
        window.addEventListener('resize', onResize, { passive: true })
        cleanups.push(() => window.removeEventListener('resize', onResize))

        // Initial state: editorial clip (top + left offsets)
        gsap.set(section, { clipPath: `inset(${topInset}vh 0 0 ${gm}px)`, zIndex: 400 })
        if (videoEl) videoEl.style.opacity = '0'

        let hasStartedVideo = false

        const st = ScrollTrigger.create({
          trigger: spacer,
          start: 'top top',
          end: `+=${HERO_SCROLL}`,
          onUpdate: (self) => {
            const scrollY = self.progress * HERO_SCROLL

            if (scrollY <= PHASE1_END) {
              // Phase 1 — editorial window opens to fullscreen
              const p = scrollY / PHASE1_END
              gsap.set(section, {
                clipPath: `inset(${topInset * (1 - p)}vh 0 0 ${gm * (1 - p)}px)`,
                zIndex: 400,
              })
              if (videoEl) videoEl.style.opacity = '0'

            } else if (scrollY <= PHASE2_END) {
              // Phase 2 — fullscreen; video fades in over first 100px
              gsap.set(section, { clipPath: 'inset(0 0 0 0)', zIndex: 400 })
              const vp = Math.min((scrollY - PHASE1_END) / 100, 1)
              if (videoEl) {
                videoEl.style.opacity = String(vp)
                if (!hasStartedVideo && vp > 0) {
                  hasStartedVideo = true
                  videoEl.play().catch(() => {})
                }
              }

            } else if (scrollY <= PHASE3_END) {
              // Phase 3 — hero collapses upward from bottom
              const p = (scrollY - PHASE2_END) / (PHASE3_END - PHASE2_END)
              gsap.set(section, {
                clipPath: `inset(0 0 ${p * 100}vh 0)`,
                zIndex: 400,
              })
              if (videoEl) videoEl.style.opacity = '1'

            } else {
              // After budget — hero goes behind all content
              gsap.set(section, { zIndex: -1 })
            }
          },
        })
        cleanups.push(() => st.kill())
      }

      cleanupRef.current = () => cleanups.forEach(fn => fn())
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <>
      {/* ── Fixed hero — out of document flow ─────────────────────────────── */}
      <section
        ref={sectionRef}
        aria-label="Hero"
        className="fixed inset-0 overflow-hidden bg-warm-light"
        style={{ zIndex: 400 }}
      >
        {/* Poster + optional video (offset from left by grid-margin) */}
        <div
          className="pointer-events-none absolute bottom-0 -z-[1] overflow-hidden"
          style={{
            left: 'var(--grid-margin)',
            right: 0,
            height: 'clamp(200px, 45vh, 550px)',
          }}
          aria-hidden="true"
        >
          <Image
            src={posterSrc}
            alt={posterAlt}
            fill
            priority
            fetchPriority="high"
            sizes="(min-width: 901px) calc(86vw - 60px), 100vw"
            className="object-cover object-center"
          />
          {videoSrc && (
            <video
              ref={videoRef}
              src={videoSrc}
              muted
              loop
              playsInline
              preload="none"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ opacity: 0 }}
            />
          )}
        </div>

        {/* Tagline — h1 rendered server-side (translated), passed as children */}
        <div
          ref={taglineRef}
          className="pointer-events-none absolute inset-0 z-content flex items-start pt-[22vh] lg:pt-[28vh]"
        >
          <div className="section-inner pointer-events-auto">
            {children}
          </div>
        </div>
      </section>

      {/* ── Spacer — 1260px scroll budget for hero animation ──────────────── */}
      <div ref={spacerRef} style={{ height: `${HERO_SCROLL}px` }} aria-hidden="true" />
    </>
  )
}
