'use client'

import { useRef, useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'
import { TEAM, type TeamMember } from '@/lib/data/team'

/* ==========================================================================
   Fisher-Yates shuffle — orden aleatorio cliente al refrescar.
   ========================================================================== */
function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/* ==========================================================================
   Scattered layout — 12 slots in 3 vertical bands, alternating so
   adjacent slots never share a band. All photos same size, no overlap.
   y: % of viewport height · x: px offset within the REEL_WIDTH cycle
   ========================================================================== */

// 3 vertical bands, distribuidas en orden 1→2→3 con leve variación de y por
// banda para mantener el feel scattered. 28 slots = 28 miembros; cada uno
// renderiza con la foto correspondiente del array `team` (barajado en mount).
const SLOTS: { y: number; x: number }[] = [
  { y: 12, x: 0 },     { y: 45, x: 280 },   { y: 64, x: 560 },
  { y: 8,  x: 840 },   { y: 48, x: 1120 },  { y: 68, x: 1400 },
  { y: 16, x: 1680 },  { y: 42, x: 1960 },  { y: 62, x: 2240 },
  { y: 10, x: 2520 },  { y: 50, x: 2800 },  { y: 66, x: 3080 },
  { y: 14, x: 3360 },  { y: 46, x: 3640 },  { y: 63, x: 3920 },
  { y: 9,  x: 4200 },  { y: 49, x: 4480 },  { y: 67, x: 4760 },
  { y: 15, x: 5040 },  { y: 43, x: 5320 },  { y: 65, x: 5600 },
  { y: 11, x: 5880 },  { y: 47, x: 6160 },  { y: 64, x: 6440 },
  { y: 13, x: 6720 },  { y: 44, x: 7000 },  { y: 66, x: 7280 },
  { y: 17, x: 7560 },
]

const REEL_WIDTH = 7840 // 280px × 28 slots
const DRIFT_SPEED = 130 // px per second — same velocity for entry and drift
const PHOTO_W = 200     // px — reference for wrap calculation

/* ==========================================================================
   Component
   ========================================================================== */

export function IdentidadGente() {
  const t = useTranslations('identidad')

  // Server-render usa el orden canónico (TEAM); en el primer commit cliente
  // se baraja para que cada refresh muestre un set distinto en los 12 slots.
  // Esto evita hydration mismatch (ambos renders coinciden con el orden
  // canónico) y la barajada queda imperceptible.
  const [team, setTeam] = useState<readonly TeamMember[]>(TEAM)
  useEffect(() => {
    setTeam(shuffle(TEAM))
  }, [])

  const sectionRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const photosLayerRef = useRef<HTMLDivElement>(null)
  const photoItemsRef = useRef<(HTMLDivElement | null)[]>([])
  const dragHintRef = useRef<HTMLDivElement>(null)

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

    // Detección síncrona: ¿en qué fase está la sección AL MOMENTO DEL MOUNT?
    // Si la página se carga (o se navega via PageCurtain) con el scroll ya
    // dentro o pasado Gente, los imports async de GSAP llegarían tarde y los
    // ScrollTriggers `once+onEnter` no dispararían (ya estamos pasados el
    // start) → texto oculto sin animar, drift inactivo, fotos off-screen.
    // Saltamos las animaciones de entrada y dejamos el estado final.
    const rect = section.getBoundingClientRect()
    const vh = window.innerHeight
    const pastTopBottom = rect.top < vh         // texto debería estar revelado
    const pastTop30 = rect.top < vh * 0.3       // drift debería estar activo

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
      ])

      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      const cleanups: Array<() => void> = []

      // Pin eliminado intencionalmente: causaba bugs intermitentes al
      // navegar via PageCurtain (el pinSpacing se calculaba con layout
      // incompleto y el sticky no enganchaba → texto se escapaba al hacer
      // scroll y las fotos aparecían solapadas con la siguiente sección).
      // Ahora la sección es un bloque normal de scroll: 100vh de altura
      // (h-screen del pinEl), las fotos hacen drift mientras está en
      // viewport, y la sección sale naturalmente al seguir scrolleando.

      // 2. Title + description line-mask reveal — fires when 2/3 of the
      //    Metodología mask has covered the viewport (Gente top at ~33%vh)
      const titleSplit = new SplitType(titleEl, { types: 'lines' })
      const descSplit = new SplitType(descEl, { types: 'lines' })
      const titleLines = titleSplit.lines ?? []
      const descLines = descSplit.lines ?? []
      wrapLinesInMask(titleLines)
      wrapLinesInMask(descLines)

      if (reduced || pastTopBottom) {
        // Ya entró en viewport antes de que GSAP cargara — dejamos el texto
        // en su estado final visible, sin animación, sin flash invisible.
        gsap.set([...titleLines, ...descLines], { y: 0, opacity: 1 })
        cleanups.push(() => { titleSplit.revert(); descSplit.revert() })
      } else {
        gsap.set(titleLines, { y: 80, opacity: 0 })
        gsap.set(descLines, { y: 80, opacity: 0 })
        const revealST = ScrollTrigger.create({
          trigger: section,
          start: 'top bottom',
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

      // Bg fade eliminado intencionalmente: la sección tiene bg-dark fijo
      // desde el primer paint y los textos warm-light por className. Eliminar
      // este timeline corrige los bugs de "texto desaparece + pin no engancha"
      // que aparecían al navegar a /identidad via PageCurtain.

      // 3b. Photo drift — activates at the same point as the text reveal and
      //     bg fade. Drift consumes the entryOffset at the same speed it'll
      //     later consume baseX — photos come in one by one from the right
      //     with constant velocity throughout the animation.
      //
      //     Si la sección ya está pasado `top 30%` cuando montamos (deep-link,
      //     hot reload, navegación con scroll restaurado), forzamos el estado
      //     final desde el primer tick: drift activo, entryOffset consumido,
      //     fotos en sus posiciones cíclicas naturales.
      if (pastTop30) {
        driftRef.current.driftActive = true
        driftRef.current.entryOffset = 0
      }
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
        const lagSt = lagTw.scrollTrigger
        if (lagSt) cleanups.push(() => lagSt.kill())
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

          // Durante entry: shift lineal (drag + drift sólo desplazan, sin
          // ciclo). El wrap modular sólo tiene sentido cuando los slots
          // están en sus posiciones cíclicas naturales — al sumar el
          // entryOffset post-wrap, slots con slot.x cercano a REEL_WIDTH
          // (slot 26) tienen una región de wrap muy estrecha y un drag de
          // pocos píxeles los empujaba fuera de esa región, provocando
          // que apareciesen/desapareciesen de golpe.
          //
          // Una vez `entryOffset === 0`, los slots están en cycle range
          // y se vuelve a aplicar la math de ciclo + wrap canónica.
          if (state.entryOffset > 0) {
            const linearShift = state.baseX + state.dragDelta + state.entryOffset
            SLOTS.forEach((slot, i) => {
              const el = photoItemsRef.current[i]
              if (!el) return
              el.style.transform = `translate3d(${slot.x + linearShift}px, 0, 0)`
            })
          } else {
            const combined = state.baseX + state.dragDelta
            const modBase =
              ((combined % REEL_WIDTH) + REEL_WIDTH) % REEL_WIDTH - REEL_WIDTH
            SLOTS.forEach((slot, i) => {
              const el = photoItemsRef.current[i]
              if (!el) return
              let x = slot.x + modBase
              if (x < -PHOTO_W) x += REEL_WIDTH
              el.style.transform = `translate3d(${x}px, 0, 0)`
            })
          }

          rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
        cleanups.push(() => cancelAnimationFrame(rafId))
      }

      // 6. "Arrastrar" hint — tracking continuo de posición sobre la layer.
      //    La VISIBILIDAD se gestiona en handlePhotoEnter/Leave (sólo aparece
      //    sobre fotos, no sobre el espacio vacío de la layer).
      const layer = photosLayerRef.current
      const hintEl = dragHintRef.current
      if (layer && hintEl && !reduced) {
        const onLayerMove = (e: MouseEvent) => {
          gsap.set(hintEl, { x: e.clientX + 12, y: e.clientY + 12 })
        }
        layer.addEventListener('mousemove', onLayerMove)
        cleanups.push(() => layer.removeEventListener('mousemove', onLayerMove))
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

  /* ========================================================================
     Hover en foto — reveal lateral canónico (cubic-bezier(.16,1,.3,1))
     entrando desde la izquierda; al salir, fold inverso al borde derecho
     (mismo patrón que la PageCurtain / IdentidadHero exit).
     ======================================================================== */
  const LATERAL_EASE = 'cubic-bezier(.16,1,.3,1)'
  const handlePhotoEnter = async (e: ReactPointerEvent<HTMLDivElement>) => {
    const labels = e.currentTarget.querySelector<HTMLElement>('[data-photo-labels]')
    const hint = dragHintRef.current
    const { default: gsap } = await import('gsap')
    if (labels) {
      gsap.killTweensOf(labels)
      gsap.fromTo(
        labels,
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: LATERAL_EASE },
      )
    }
    if (hint) {
      gsap.killTweensOf(hint)
      gsap.to(hint, { opacity: 1, duration: 0.2, ease: 'power2.out' })
    }
  }
  const handlePhotoLeave = async (e: ReactPointerEvent<HTMLDivElement>) => {
    const labels = e.currentTarget.querySelector<HTMLElement>('[data-photo-labels]')
    const hint = dragHintRef.current
    const { default: gsap } = await import('gsap')
    if (labels) {
      gsap.killTweensOf(labels)
      gsap.to(labels, {
        clipPath: 'inset(0 0 0 100%)',
        duration: 0.6,
        ease: LATERAL_EASE,
        onComplete: () => {
          gsap.set(labels, { clipPath: 'inset(0 100% 0 0)' })
        },
      })
    }
    if (hint) {
      gsap.killTweensOf(hint)
      gsap.to(hint, { opacity: 0, duration: 0.15, ease: 'power2.out' })
    }
  }

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-dark"
      aria-labelledby="gente-title"
    >
      {/* CSS sticky canónico: el contenido se queda fijo 100vh mientras el
          spacer de 100vh debajo aporta la duración del pin. Sin GSAP pin,
          sin pinSpacing, sin race conditions. */}
      <div
        ref={pinRef}
        className="sticky top-0 w-full h-screen overflow-hidden"
      >
        {/* Titular "Nuestra gente" — text-title like Actitud Liminal, top-left.
            Color tweened by GSAP from fg → warm-light in sync with body bg. */}
        <div
          className="absolute top-[100px] inset-x-0 section-inner pointer-events-none
                     lg:top-[clamp(210px,17.7vh,234px)]"
        >
          <div className="grid grid-cols-12 gap-grid-gutter">
            <h2
              ref={titleRef}
              id="gente-title"
              className="col-start-2 col-span-11 lg:col-start-2 lg:col-span-6 font-serif font-normal text-warm-light text-section leading-[1.2] tracking-[-0.02em]"
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
              className="col-start-2 col-span-10 font-serif font-light text-warm-light text-title text-center leading-[1.1] tracking-[-0.02em]"
            >
              {t('gente.description')}
            </p>
          </div>
        </div>

        {/* Scattered photos layer — drift + drag. All photos same size, non-overlapping. */}
        <div
          ref={photosLayerRef}
          className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing select-none touch-pan-y"
          style={{ willChange: 'transform' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-hidden="true"
        >
          {SLOTS.map((slot, i) => {
            const member = team[i % team.length]
            return (
              <div
                key={i}
                ref={(el) => { photoItemsRef.current[i] = el }}
                onPointerEnter={handlePhotoEnter}
                onPointerLeave={handlePhotoLeave}
                className="group absolute w-[clamp(160px,13vw,210px)] aspect-square will-change-transform"
                style={{
                  top: `${slot.y}%`,
                  left: 0,
                  // Pre-aplicado: nacen off-screen-right (slot.x + entry offset)
                  // para evitar el flash de 1 frame con todas apiladas en left:0
                  // antes de que el RAF aplique el primer transform.
                  transform: `translate3d(${slot.x + ENTRY_OFFSET_START}px, 0, 0)`,
                }}
              >
                <div className="relative h-full w-full overflow-hidden">
                  <Image
                    src={member.src}
                    alt=""
                    fill
                    sizes="16vw"
                    loading="eager"
                    draggable={false}
                    className="object-cover grayscale transition-[filter] duration-[400ms] ease-expo group-hover:grayscale-0 pointer-events-none"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = '/identidad/team.jpg'
                    }}
                  />
                  {/* Labels — bottom-left dentro de la imagen. Reveal lateral
                      cubic-bezier(.16,1,.3,1) en hover, inverso al salir
                      (clip-path canónico). */}
                  <div
                    data-photo-labels
                    className="absolute bottom-0 left-0 flex flex-col pointer-events-none"
                    style={{ clipPath: 'inset(0 100% 0 0)' }}
                  >
                    <div className="bg-warm-light px-[6px] py-[2px] self-start">
                      <p className="font-mono text-micro text-fg leading-[1.4] whitespace-nowrap">
                        {member.role}
                      </p>
                    </div>
                    <div className="bg-warm-light px-[6px] py-[2px] self-start">
                      <p className="font-serif font-light text-[clamp(16px,1.5vw,22px)] text-fg leading-none whitespace-nowrap">
                        {member.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Spacer 100vh — aporta el "pin time" del CSS sticky de arriba.
          Mientras el viewport scrollea estos 100vh, el pinEl permanece fijo
          en top:0 (comportamiento nativo de position:sticky). */}
      <div style={{ height: '100vh' }} aria-hidden="true" />

      {/* "Arrastrar" hint — fixed sibling, sigue al cursor con mix-blend
          difference. Mismo pipeline que el hint del Hero (HeroScroll). */}
      <div
        ref={dragHintRef}
        aria-hidden="true"
        className="fixed pointer-events-none top-0 left-0 font-mono text-body-sm"
        style={{
          opacity: 0,
          zIndex: 410,
          mixBlendMode: 'difference',
          color: 'var(--c-warm-light)',
          willChange: 'transform, opacity',
        }}
      >
        {t('gente.dragHint')}
      </div>
    </section>
  )
}
