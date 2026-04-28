'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'
import { useMenuStore } from '@/lib/store/menu'

// ─── Scroll budget (px) ───────────────────────────────────────────────────────
const HERO_SCROLL = 1260
const PHASE1_END  = 380   // strip → fullscreen (scroll-driven)
const PHASE2_END  = 880   // fullscreen dwell + video fade-in
const PHASE3_END  = 1260  // fullscreen → collapses from bottom

// Measure a CSS var (or expression) as px via an invisible probe
function measureCssPx(expr: string): number {
  if (typeof document === 'undefined') return 0
  const tmp = document.createElement('div')
  tmp.style.cssText = `position:fixed;top:0;left:0;width:${expr};height:0;visibility:hidden;pointer-events:none`
  document.body.appendChild(tmp)
  const w = tmp.getBoundingClientRect().width
  document.body.removeChild(tmp)
  return w
}

function getGridMarginPx(): number {
  return measureCssPx('var(--grid-margin)')
}

// col-2 start = grid-margin + 1 column-width + 1 gap (col-start-2 en grid-12)
function getCol2StartPx(): number {
  const gm = getGridMarginPx()
  const gap = measureCssPx('var(--grid-gutter)')
  const contentWidth = window.innerWidth - 2 * gm
  const colWidth = (contentWidth - 11 * gap) / 12
  return gm + colWidth + gap
}

// Strip height: clamp(250px, 56.25vh, 688px) — 1.25x sobre la versión anterior
function getStripHeightPx(): number {
  const vh = window.innerHeight * 0.5625
  return Math.max(250, Math.min(vh, 688))
}

interface HeroScrollProps {
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
  const isMenuOpen = useMenuStore((s) => s.isOpen)
  const sectionRef = useRef<HTMLElement>(null)
  const spacerRef  = useRef<HTMLDivElement>(null)
  const videoRef   = useRef<HTMLVideoElement>(null)
  const taglineRef = useRef<HTMLDivElement>(null)
  const stripRef   = useRef<HTMLDivElement>(null)
  const arrowRef   = useRef<HTMLDivElement>(null)
  const playHintRef = useRef<HTMLDivElement>(null)
  const playVariantRef  = useRef<HTMLDivElement>(null)
  const closeVariantRef = useRef<HTMLDivElement>(null)

  // Menu-aware z-index del strip: cuando el menu abre (z=150), el strip baja
  // a z=100 para quedar por debajo y no competir visualmente. Chrome, menu y
  // header siempre encima del strip mientras menu esté abierto.
  useEffect(() => {
    const s = stripRef.current
    const a = arrowRef.current
    const z = isMenuOpen ? '100' : '400'
    if (s) s.style.zIndex = z
    if (a) a.style.zIndex = z
  }, [isMenuOpen])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    const spacer  = spacerRef.current
    const tagline = taglineRef.current
    const strip   = stripRef.current
    if (!section || !spacer || !tagline || !strip) return

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

      // ── Geometría inicial del strip (cached; refresh en resize) ────────────
      let leftStart = getCol2StartPx()
      let stripH = getStripHeightPx()
      let stripTop = window.innerHeight - stripH

      const applyStripState = (progress: number) => {
        // progress 0 = strip state (col-2 start, bottom), 1 = fullscreen (top:0, left:0)
        const top  = stripTop * (1 - progress)
        const left = leftStart * (1 - progress)
        gsap.set(strip, { top, left })
      }

      // ── Load animation: h1 line-mask + bold effect + strip lateral reveal ──
      const h1 = tagline.querySelector<HTMLHeadingElement>('h1')
      if (h1 && !reduced) {
        const split = new SplitType(h1, { types: 'lines' })
        const lines = split.lines ?? []
        wrapLinesInMask(lines)
        gsap.set(lines, { y: 80, opacity: 0 })
        gsap.to(lines, {
          y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', stagger: 0.1, delay: 0.2,
        })
        cleanups.push(() => split.revert())

        // Bold effect canonical (feedback_bold_effect.md) sobre [data-word]
        const wordEl = h1.querySelector<HTMLElement>('[data-word]')
        if (wordEl?.parentNode) {
          const transformDelay = 0.2 + 1.2 + (lines.length - 1) * 0.1 + 0.4
          const delayed = gsap.delayedCall(transformDelay, () => {
            const parent = wordEl.parentNode
            if (!parent) return
            // Defensive: limpia residuos si el efecto se ejecuta dos veces.
            h1.querySelectorAll('[data-slash-dynamic]').forEach((el) => el.remove())
            wordEl.style.removeProperty('-webkit-text-stroke')
            const slashL = document.createElement('span')
            slashL.textContent = '/ '
            slashL.dataset.slashDynamic = ''
            slashL.style.display = 'none'
            const slashR = document.createElement('span')
            slashR.textContent = ' /'
            slashR.dataset.slashDynamic = ''
            slashR.style.display = 'none'
            parent.insertBefore(slashL, wordEl)
            parent.insertBefore(slashR, wordEl.nextSibling)
            const proxy = { v: 0 }
            const btl = gsap.timeline()
            btl.to(proxy, {
              v: 0.6,
              duration: 1.4,
              ease: 'sine.inOut',
              onUpdate: () => {
                wordEl.style.setProperty('-webkit-text-stroke', `${proxy.v}px currentColor`)
              },
            })
            // Animar font-size 0 → natural (display:inline) — baseline alineado
            slashL.style.display = ''
            slashR.style.display = ''
            const fontSize = window.getComputedStyle(slashL).fontSize
            gsap.set(slashL, { fontSize: 0, opacity: 0 })
            gsap.set(slashR, { fontSize: 0, opacity: 0 })
            btl.to(slashL, { fontSize, opacity: 1, duration: 1.4, ease: 'sine.inOut' }, 0)
            btl.to(slashR, { fontSize, opacity: 1, duration: 1.4, ease: 'sine.inOut' }, 0)
          })
          cleanups.push(() => {
            delayed.kill()
            h1.querySelectorAll('[data-slash-dynamic]').forEach((el) => el.remove())
          })
        }
      } else if (h1 && reduced) {
        gsap.set(h1, { y: 0, opacity: 1 })
      }

      // Strip: estado inicial geometría + clip oculto
      gsap.set(strip, { top: stripTop, left: leftStart, right: 0, bottom: 0, clipPath: 'inset(0 100% 0 0)' })

      if (reduced) {
        gsap.set(strip, { clipPath: 'inset(0 0% 0 0)' })
      } else {
        // Reveal lateral canónico con el mismo ease que la cortina (power4.inOut)
        gsap.to(strip, {
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.9,
          ease: 'power4.inOut',
          delay: 0.5,
        })
      }

      // ── Scroll-driven phases ───────────────────────────────────────────────
      const taglineEl = tagline
      const arrowEl = arrowRef.current

      // Arrow bounce loop (corre siempre; se muestra/oculta via opacity)
      if (arrowEl) {
        gsap.set(arrowEl, { opacity: 0 })
        gsap.to(arrowEl.querySelector('svg'), {
          y: 8,
          duration: 0.8,
          ease: 'power2.inOut',
          yoyo: true,
          repeat: -1,
        })
      }

      // Video corre desde el principio (mute + loop), visible también dentro
      // del strip enmascarado. Click sobre el strip → fullscreen + (futuro) sonido.
      if (videoEl) {
        videoEl.style.opacity = '1'
        videoEl.play().catch(() => {})
      }

      if (!reduced) {
        const onResize = () => {
          leftStart = getCol2StartPx()
          stripH = getStripHeightPx()
          stripTop = window.innerHeight - stripH
        }
        window.addEventListener('resize', onResize, { passive: true })
        cleanups.push(() => window.removeEventListener('resize', onResize))

        const st = ScrollTrigger.create({
          trigger: spacer,
          start: 'top top',
          end: `+=${HERO_SCROLL}`,
          onUpdate: (self) => {
            const scrollY = self.progress * HERO_SCROLL

            // Tagline "se va con el scroll" (patrón rejouice): translateY 1:1
            // con la posición de scroll, simula que está en el flujo del doc.
            gsap.set(taglineEl, { y: -scrollY })

            if (scrollY <= PHASE1_END) {
              // Fase 1 — strip expande a fullscreen (top+left → 0).
              // Section transparente a z=400 hace que el strip tape chrome
              // físicamente al crecer (sin fade, sin snap).
              const p = scrollY / PHASE1_END
              applyStripState(p)
              gsap.set(strip, { clipPath: 'inset(0 0% 0 0)' })
              if (arrowEl) gsap.set(arrowEl, { opacity: 0 })

            } else if (scrollY <= PHASE2_END) {
              // Fase 2 — fullscreen. Arrow fade-in.
              applyStripState(1)
              gsap.set(strip, { clipPath: 'inset(0 0% 0 0)' })
              const vp = Math.min((scrollY - PHASE1_END) / 100, 1)
              if (arrowEl) gsap.set(arrowEl, { opacity: vp })

            } else if (scrollY <= PHASE3_END) {
              // Fase 3 — strip colapsa (clip bottom-inset crece). Al revelarse
              // la transparencia de la section, se ve el IntroScroll detrás.
              applyStripState(1)
              const p = (scrollY - PHASE2_END) / (PHASE3_END - PHASE2_END)
              gsap.set(strip, { clipPath: `inset(0 0 ${p * 100}% 0)` })
              if (arrowEl) gsap.set(arrowEl, { opacity: 1 - p })

            } else {
              // Tras el budget — strip fuera
              if (arrowEl) gsap.set(arrowEl, { opacity: 0 })
            }
          },
        })
        cleanups.push(() => st.kill())
      } else {
        // Reduced motion — mostrar fullscreen directo
        applyStripState(1)
      }

      // ── Hover "Play video"/"Close video": label follows mouse, con mix-blend
      // difference. Variante play/close según fase (scrollY threshold).
      const playHintEl = playHintRef.current
      const playVariantEl  = playVariantRef.current
      const closeVariantEl = closeVariantRef.current
      const FULLSCREEN_THRESHOLD = PHASE1_END + 50  // algo dentro de fase 2
      let variantIsFullscreen = false

      const updateHintVariant = () => {
        const next = window.scrollY >= FULLSCREEN_THRESHOLD
        if (next === variantIsFullscreen) return
        variantIsFullscreen = next
        if (playVariantEl)  playVariantEl.style.display  = next ? 'none' : 'flex'
        if (closeVariantEl) closeVariantEl.style.display = next ? 'flex' : 'none'
      }
      updateHintVariant()

      const onStripMouseMove = (e: MouseEvent) => {
        if (!playHintEl) return
        // 12px de offset para que el hint no quede exactamente bajo el cursor
        gsap.set(playHintEl, { x: e.clientX + 12, y: e.clientY + 12 })
      }
      const onStripEnter = () => {
        if (reduced || !playHintEl) return
        updateHintVariant()
        gsap.to(playHintEl, { opacity: 1, duration: 0.2, ease: 'power2.out', overwrite: true })
      }
      const onStripLeave = () => {
        if (!playHintEl) return
        gsap.to(playHintEl, { opacity: 0, duration: 0.15, ease: 'power2.out', overwrite: true })
      }
      strip.addEventListener('mouseenter', onStripEnter)
      strip.addEventListener('mouseleave', onStripLeave)
      strip.addEventListener('mousemove',  onStripMouseMove)
      cleanups.push(() => strip.removeEventListener('mouseenter', onStripEnter))
      cleanups.push(() => strip.removeEventListener('mouseleave', onStripLeave))
      cleanups.push(() => strip.removeEventListener('mousemove',  onStripMouseMove))

      // Escuchar scroll para swap play/close en tiempo real mientras el cursor
      // permanece sobre el strip (fullscreen). Usamos el propio ScrollTrigger.
      const stVariant = ScrollTrigger.create({
        trigger: spacer,
        start: 'top top',
        end: `+=${HERO_SCROLL}`,
        onUpdate: updateHintVariant,
      })
      cleanups.push(() => stVariant.kill())

      // ── Click en el strip: alterna según fase (abrir fullscreen / cerrar) ─
      const onStripClick = () => {
        if (reduced) return
        if (window.scrollY >= FULLSCREEN_THRESHOLD) {
          // Fullscreen → cerrar volviendo al top
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
        } else {
          // Strip state → abrir fullscreen
          window.scrollTo({ top: PHASE1_END + 20, left: 0, behavior: 'smooth' })
        }
      }
      strip.addEventListener('click', onStripClick)
      cleanups.push(() => strip.removeEventListener('click', onStripClick))

      cleanupRef.current = () => cleanups.forEach((fn) => fn())
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <>
      {/* ── Section — sólo contiene el tagline. z=50 (debajo del chrome).
           pointer-events-none para que cualquier click pase al chrome/contenido. */}
      <section
        ref={sectionRef}
        aria-label="Hero"
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 50 }}
      >
        <div
          ref={taglineRef}
          className="pointer-events-none absolute inset-0 z-content flex items-start pt-[22vh] lg:pt-[28vh]"
        >
          <div className="section-inner pointer-events-none">
            {children}
          </div>
        </div>
      </section>

      {/* Strip — SEPARADO de la section, fixed, z=400 (encima del chrome: 160-200).
           Al crecer a fullscreen tapa físicamente el chrome sin snaps. En estado
           strip inicial (bottom-right) el chrome está visible fuera del strip. */}
      <div
        ref={stripRef}
        className="fixed overflow-hidden cursor-pointer pointer-events-auto"
        style={{ clipPath: 'inset(0 100% 0 0)', zIndex: 400 }}
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
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

      </div>

      {/* Play/Close hint — fixed sibling, sigue el cursor con mix-blend-mode
          difference (mismo pipeline conceptual que logo/hamburger). Texto sin
          fondo. Cambia entre "Play video" / "Close video" según la fase. */}
      <div
        ref={playHintRef}
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
        <div ref={playVariantRef} className="flex items-center gap-2" style={{ display: 'flex' }}>
          <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0 L8 5 L0 10 Z" />
          </svg>
          <span>Play video</span>
        </div>
        <div ref={closeVariantRef} className="flex items-center gap-2" style={{ display: 'none' }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1 L9 9 M9 1 L1 9" />
          </svg>
          <span>Close video</span>
        </div>
      </div>

      {/* Arrow indicator — fixed, z=400 como el strip, centrado abajo */}
      <div
        ref={arrowRef}
        aria-hidden="true"
        className="fixed pointer-events-none left-1/2 -translate-x-1/2 text-warm-light"
        style={{ bottom: 'clamp(24px, 5vh, 56px)', opacity: 0, zIndex: 400 }}
      >
        <svg width="20" height="28" viewBox="0 0 20 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 2 L10 24 M2 17 L10 25 L18 17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ── Spacer — 1260px scroll budget ───────────────────────────────── */}
      <div ref={spacerRef} style={{ height: `${HERO_SCROLL}px` }} aria-hidden="true" />
    </>
  )
}
