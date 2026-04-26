'use client'

import { useRef, useEffect, type PointerEvent as ReactPointerEvent } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

/* ==========================================================================
   Team photos — placeholder names/roles (fix later, pending real data)
   ========================================================================== */

const TEAM = [
  { src: '/identidad/fotos-team/Tom.webp', name: 'Tomas Modroño', role: 'Partner' },
  { src: '/identidad/fotos-team/Adrian.webp', name: 'Adrián Yanes', role: 'Design' },
  { src: '/identidad/fotos-team/Ale.webp', name: 'Alejandro Madeira', role: 'Strategy' },
  { src: '/identidad/fotos-team/Alex.webp', name: 'Alex Cuadrado', role: 'Research' },
  { src: '/identidad/fotos-team/Berta.webp', name: 'Berta', role: 'Operations' },
  { src: '/identidad/fotos-team/Carlos.webp', name: 'Carlos', role: 'Partner' },
  { src: '/identidad/fotos-team/Diana.webp', name: 'Diana', role: 'Strategy' },
  { src: '/identidad/fotos-team/Diego.webp', name: 'Diego', role: 'Engineering' },
  { src: '/identidad/fotos-team/Edmond.webp', name: 'Edmond', role: 'Design' },
  { src: '/identidad/fotos-team/ElenaS.webp', name: 'Elena S.', role: 'Design' },
  { src: '/identidad/fotos-team/EleneC.webp', name: 'Elena C.', role: 'Design' },
  { src: '/identidad/fotos-team/Eli.webp', name: 'Eli López', role: 'Strategy' },
  { src: '/identidad/fotos-team/Francesc.webp', name: 'Francesc', role: 'Engineering' },
  { src: '/identidad/fotos-team/Isaac.webp', name: 'Isaac', role: 'Design' },
  { src: '/identidad/fotos-team/Joha.webp', name: 'Joha', role: 'Strategy' },
  { src: '/identidad/fotos-team/Josep.webp', name: 'Josep', role: 'Partner' },
  { src: '/identidad/fotos-team/Lucho.webp', name: 'Lucho', role: 'Engineering' },
  { src: '/identidad/fotos-team/Marcela.webp', name: 'Marcela', role: 'Strategy' },
  { src: '/identidad/fotos-team/Maria.webp', name: 'María', role: 'Design' },
  { src: '/identidad/fotos-team/Martina.webp', name: 'Martina Gentile', role: 'Head of Marketing' },
  { src: '/identidad/fotos-team/PamC.webp', name: 'Pam C.', role: 'Design' },
  { src: '/identidad/fotos-team/Pamela B.webp', name: 'Pamela B.', role: 'Strategy' },
  { src: '/identidad/fotos-team/Pol.webp', name: 'Pol', role: 'Engineering' },
  { src: '/identidad/fotos-team/Riccardo.webp', name: 'Riccardo', role: 'Design' },
  { src: '/identidad/fotos-team/Sara.webp', name: 'Sara', role: 'Strategy' },
] as const

/* ==========================================================================
   Scattered layout — 12 slots in 3 vertical bands, alternating so
   adjacent slots never share a band. All photos same size, no overlap.
   y: % of viewport height · x: px offset within the REEL_WIDTH cycle
   ========================================================================== */

// 3 vertical bands, capped so photo + labels fit inside the viewport on ≥800vh.
// Band 3 photos flip labels to above (bottom-full) so they never clip off-screen.
const SLOTS: { y: number; x: number }[] = [
  { y: 12, x: 0 },      // band 1 (labels below)
  { y: 45, x: 280 },    // band 2 (labels below)
  { y: 64, x: 560 },    // band 3 (labels above)
  { y: 8, x: 840 },     // band 1
  { y: 48, x: 1120 },   // band 2
  { y: 68, x: 1400 },   // band 3
  { y: 16, x: 1680 },   // band 1
  { y: 42, x: 1960 },   // band 2
  { y: 62, x: 2240 },   // band 3
  { y: 10, x: 2520 },   // band 1
  { y: 50, x: 2800 },   // band 2
  { y: 66, x: 3080 },   // band 3
]

const REEL_WIDTH = 3360
const DRIFT_SPEED = 40 // px per second — same velocity for entry and drift
const PHOTO_W = 200    // px — reference for wrap calculation

/* ==========================================================================
   Component
   ========================================================================== */

export function IdentidadGente() {
  const t = useTranslations('identidad')

  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const photosLayerRef = useRef<HTMLDivElement>(null)
  const photoItemsRef = useRef<(HTMLDivElement | null)[]>([])

  // Drift state held in ref to avoid re-renders on every frame.
  // entryOffset starts at 1600 → all photos are off-screen right. The entry
  // tween animates it down to 0 (bringing the visible subset in from the
  // right) and only then does driftActive flip to true.
  const ENTRY_OFFSET_START = 1600

  const driftRef = useRef({
    baseX: 0,
    dragDelta: 0,
    dragStartX: 0,
    dragStartDelta: 0,
    isDragging: false,
    driftActive: false,
    entryOffset: ENTRY_OFFSET_START,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    const pinEl = pinRef.current
    const titleEl = titleRef.current
    const descEl = descRef.current
    if (!section || !pinEl || !titleEl || !descEl) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
      ])

      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      const cleanups: Array<() => void> = []

      // 1. Pin the sticky container for 200vh of scroll (gives more room for
      //    reading + watching photos drift in one by one)
      const pinST = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=200%',
        pin: pinEl,
        pinSpacing: true,
        anticipatePin: 1,
      })
      cleanups.push(() => pinST.kill())

      // 2. Title + description line-mask reveal — fires when 2/3 of the
      //    Metodología mask has covered the viewport (Gente top at ~33%vh)
      const titleSplit = new SplitType(titleEl, { types: 'lines' })
      const descSplit = new SplitType(descEl, { types: 'lines' })
      const titleLines = titleSplit.lines ?? []
      const descLines = descSplit.lines ?? []
      wrapLinesInMask(titleLines)
      wrapLinesInMask(descLines)

      if (reduced) {
        gsap.set([...titleLines, ...descLines], { y: 0, opacity: 1 })
      } else {
        gsap.set(titleLines, { y: 80, opacity: 0 })
        gsap.set(descLines, { y: 80, opacity: 0 })
        const revealST = ScrollTrigger.create({
          trigger: section,
          start: 'top 30%',
          once: true,
          onEnter: () => {
            gsap.to(titleLines, {
              y: 0,
              opacity: 1,
              duration: 1.2,
              ease: 'power4.out',
              stagger: 0.08,
            })
            gsap.to(descLines, {
              y: 0,
              opacity: 1,
              duration: 1.2,
              ease: 'power4.out',
              stagger: 0.08,
              delay: 0.15,
            })
          },
        })
        cleanups.push(() => { revealST.kill(); titleSplit.revert(); descSplit.revert() })
      }

      // 3. Background fade warm-light → dark of the WHOLE PAGE (body bg),
      //    with text colors fg → warm-light in the same timeline so the
      //    contrast flip is simultaneous. Text is fg (dark) while bg is
      //    warm-light, then warm-light (#f5f2ed exact) when bg goes dark.
      gsap.set(document.body, { backgroundColor: '#f5f2ed' })
      gsap.set([titleEl, descEl], { color: '#1c1a17' })

      const bgTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 30%',
          toggleActions: 'play none none reverse',
        },
      })
      bgTl
        .to(document.body, {
          backgroundColor: '#1c1a17',
          duration: 0.5,
          ease: 'power2.inOut',
        }, 0)
        .to([titleEl, descEl], {
          color: '#f5f2ed',
          duration: 0.5,
          ease: 'power2.inOut',
        }, 0)

      if (bgTl.scrollTrigger) cleanups.push(() => bgTl.scrollTrigger!.kill())
      cleanups.push(() => bgTl.kill())
      // Restore inline styles on unmount — body bg and text colors.
      cleanups.push(() => {
        document.body.style.backgroundColor = ''
        titleEl.style.color = ''
        descEl.style.color = ''
      })

      // 3b. Photo drift — activates at the same point as the text reveal and
      //     bg fade. Drift consumes the entryOffset at the same speed it'll
      //     later consume baseX — photos come in one by one from the right
      //     with constant velocity throughout the animation.
      const entryST = ScrollTrigger.create({
        trigger: section,
        start: 'top 30%',
        onEnter: () => {
          driftRef.current.driftActive = true
        },
        onLeaveBack: () => {
          driftRef.current.driftActive = false
          driftRef.current.entryOffset = ENTRY_OFFSET_START
          driftRef.current.baseX = 0
          driftRef.current.dragDelta = 0
        },
      })
      cleanups.push(() => entryST.kill())

      // 4. Parallax lag on exit — photos translate slower than text
      if (!reduced && photosLayerRef.current) {
        const lagTw = gsap.fromTo(
          photosLayerRef.current,
          { yPercent: 0 },
          {
            yPercent: 25,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'bottom bottom',
              end: 'bottom top',
              scrub: 1,
            },
          },
        )
        if (lagTw.scrollTrigger) cleanups.push(() => lagTw.scrollTrigger!.kill())
        cleanups.push(() => lagTw.kill())
      }

      // 5. RAF loop — continuous right-to-left drift + drag offset
      if (reduced) {
        SLOTS.forEach((slot, i) => {
          const el = photoItemsRef.current[i]
          if (!el) return
          el.style.transform = `translate3d(${slot.x}px, 0, 0)`
        })
      } else {
        let rafId = 0
        let lastT = performance.now()

        const tick = (now: number) => {
          const dt = now - lastT
          lastT = now

          const state = driftRef.current

          if (state.driftActive && !state.isDragging) {
            const delta = (DRIFT_SPEED * dt) / 1000
            // Single continuous motion: drift consumes entryOffset first
            // (photos sliding in from right), then baseX (normal cycling).
            if (state.entryOffset > 0) {
              state.entryOffset = Math.max(0, state.entryOffset - delta)
            } else {
              state.baseX -= delta
            }
          }

          // Normalise baseX + dragDelta into [-REEL_WIDTH, 0] so
          // photos tile seamlessly and floating-point can't overflow.
          const combined = state.baseX + state.dragDelta
          const modBase =
            ((combined % REEL_WIDTH) + REEL_WIDTH) % REEL_WIDTH - REEL_WIDTH

          SLOTS.forEach((slot, i) => {
            const el = photoItemsRef.current[i]
            if (!el) return
            let x = slot.x + modBase
            if (x < -PHOTO_W) x += REEL_WIDTH
            x += state.entryOffset
            el.style.transform = `translate3d(${x}px, 0, 0)`
          })

          rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
        cleanups.push(() => cancelAnimationFrame(rafId))
      }

      cleanupRef.current = () => cleanups.forEach((fn) => fn())
    })()

    return () => cleanupRef.current?.()
  }, [])

  /* ========================================================================
     Pointer handlers — click+drag horizontal on the photos layer.
     Drift pauses during drag; delta merges into baseX on release so the
     drift resumes smoothly from the exact point the user let go.
     ======================================================================== */

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = driftRef.current
    state.isDragging = true
    state.dragStartX = e.clientX
    state.dragStartDelta = state.dragDelta
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = driftRef.current
    if (!state.isDragging) return
    state.dragDelta = state.dragStartDelta + (e.clientX - state.dragStartX)
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = driftRef.current
    if (!state.isDragging) return
    state.isDragging = false
    state.baseX += state.dragDelta
    state.dragDelta = 0
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      aria-labelledby="gente-title"
    >
      {/* Pinned sticky container — bg animates warm-light → dark */}
      <div
        ref={pinRef}
        className="relative w-full h-screen overflow-hidden"
      >
        {/* Titular "Nuestra gente" — text-title like Actitud Liminal, top-left.
            Color tweened by GSAP from fg → warm-light in sync with body bg. */}
        <div
          className="absolute top-[clamp(90px,14vh,160px)] inset-x-0 section-inner pointer-events-none"
        >
          <div className="grid grid-cols-12 gap-grid-gutter">
            <h2
              ref={titleRef}
              id="gente-title"
              className="col-span-10 lg:col-span-6 lg:col-start-2 font-serif font-normal text-section leading-[1.2] tracking-[-0.02em]"
            >
              {t('gente.title')}
            </h2>
          </div>
        </div>

        {/* Descripción — párrafo de fondo, 10 columnas centrales, centrado vertical */}
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 section-inner pointer-events-none"
        >
          <div className="grid grid-cols-12 gap-grid-gutter">
            <p
              ref={descRef}
              className="col-start-2 col-span-10 font-serif font-light text-title text-center leading-[1.1] tracking-[-0.02em]"
            >
              {t('gente.description')}
            </p>
          </div>
        </div>

        {/* Scattered photos layer — drift + drag. All photos same size, non-overlapping. */}
        <div
          ref={photosLayerRef}
          className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing select-none touch-pan-y"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-hidden="true"
        >
          {SLOTS.map((slot, i) => {
            const member = TEAM[i % TEAM.length]
            // Bottom band (y > 55): flip labels to above photo so they don't clip
            const labelsAbove = slot.y > 55
            return (
              <div
                key={i}
                ref={(el) => { photoItemsRef.current[i] = el }}
                className="group absolute w-[clamp(160px,14vw,210px)] h-[clamp(200px,17vw,260px)] will-change-transform"
                style={{ top: `${slot.y}%`, left: 0 }}
              >
                <div className="relative h-full w-full overflow-hidden">
                  <Image
                    src={member.src}
                    alt=""
                    fill
                    sizes="16vw"
                    draggable={false}
                    className="object-cover grayscale transition-[filter] duration-[400ms] ease-expo group-hover:grayscale-0 pointer-events-none"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = '/identidad/team.jpg'
                    }}
                  />
                </div>
                {/* Hover labels — role top, name bottom. Flip above for bottom band. */}
                <div
                  className={`absolute left-0 flex flex-col gap-[2px] opacity-0 transition-opacity duration-[280ms] ease-expo group-hover:opacity-100 pointer-events-none ${
                    labelsAbove ? 'bottom-full mb-[2px]' : 'top-full mt-[2px]'
                  }`}
                >
                  <div className="bg-warm-light px-[6px] py-[2px] self-start">
                    <p className="font-mono text-card-sm text-fg leading-[1.4] whitespace-nowrap">
                      {member.role}
                    </p>
                  </div>
                  <div className="bg-warm-light px-[6px] py-[2px] self-start">
                    <p className="font-serif font-light text-[clamp(18px,2vw,28px)] text-fg leading-none whitespace-nowrap">
                      {member.name}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
