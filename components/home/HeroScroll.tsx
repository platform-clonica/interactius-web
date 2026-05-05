'use client'

import { useRef, useEffect, useState } from 'react'
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
  const lightboxVideoRef = useRef<HTMLVideoElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const taglineRef = useRef<HTMLDivElement>(null)
  const stripRef   = useRef<HTMLDivElement>(null)
  const arrowRef   = useRef<HTMLDivElement>(null)
  const playHintRef = useRef<HTMLDivElement>(null)
  const playVariantRef  = useRef<HTMLDivElement>(null)
  const closeVariantRef = useRef<HTMLDivElement>(null)

  // Estado del lightbox: cuando true, el vídeo se renderiza encima de todo
  // con audio. Cierra al hacer click. El strip/fullscreen vídeo se pausa
  // mientras el lightbox está abierto para no doblar la reproducción.
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isLightboxMuted, setIsLightboxMuted] = useState(false)
  const isLightboxOpenRef = useRef(false)
  useEffect(() => {
    isLightboxOpenRef.current = isLightboxOpen
    // Pausar/reanudar el strip video según estado del lightbox.
    const stripVideo = videoRef.current
    if (stripVideo) {
      if (isLightboxOpen) {
        stripVideo.pause()
      } else {
        // Re-evalúa fase al cerrar el lightbox.
        const sy = window.scrollY
        if (sy >= PHASE1_END && sy < PHASE3_END) {
          stripVideo.play().catch(() => {})
        }
      }
    }
    // Swap inmediato del hint variant (play ↔ cerrar).
    const playV = playVariantRef.current
    const closeV = closeVariantRef.current
    if (playV) playV.style.display = isLightboxOpen ? 'none' : 'flex'
    if (closeV) closeV.style.display = isLightboxOpen ? 'flex' : 'none'
  }, [isLightboxOpen])

  // Sync muted del vídeo del lightbox con el estado React (toggle del botón)
  useEffect(() => {
    if (!isLightboxOpen) return
    const v = lightboxVideoRef.current
    if (v) v.muted = isLightboxMuted
  }, [isLightboxOpen, isLightboxMuted])

  // Línea de reproducción del lightbox — actualiza la barra inferior con
  // scaleX según currentTime/duration. Suscribirse al vídeo solo mientras
  // el lightbox está abierto.
  useEffect(() => {
    if (!isLightboxOpen) return
    const v = lightboxVideoRef.current
    const bar = progressBarRef.current
    if (!v || !bar) return
    const onTime = () => {
      if (!v.duration || isNaN(v.duration)) return
      bar.style.transform = `scaleX(${v.currentTime / v.duration})`
    }
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onTime)
    onTime()
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('loadedmetadata', onTime)
    }
  }, [isLightboxOpen])

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

    // Detección síncrona pre-imports: si la página se refresca con scroll
    // restaurado mid-page, NO queremos disparar la entry reveal del strip
    // (clipPath 100%→0%) ni autoplay del video — porque el strip ya debería
    // estar oculto/fuera de fase. Capturamos la decisión antes de que GSAP
    // cargue async y el scroll-restoration de Next se aplique.
    const initialScrollY = window.scrollY
    const isFreshLoad = initialScrollY < 1

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

        // Bold canónico — slashes pre-renderizados via richComponents.boldWord.
        // Aquí solo animamos el text-stroke 0→0.6px del word (regular → semi).
        const wordEl = h1.querySelector<HTMLElement>('[data-word]')
        if (wordEl) {
          const transformDelay = 0.2 + 1.2 + (lines.length - 1) * 0.1 + 0.4
          const delayed = gsap.delayedCall(transformDelay, () => {
            wordEl.style.removeProperty('-webkit-text-stroke')
            const proxy = { v: 0 }
            gsap.to(proxy, {
              v: 0.6,
              duration: 1.4,
              ease: 'sine.inOut',
              onUpdate: () => {
                wordEl.style.setProperty('-webkit-text-stroke', `${proxy.v}px currentColor`)
              },
            })
          })
          cleanups.push(() => {
            delayed.kill()
            wordEl.style.removeProperty('-webkit-text-stroke')
          })
        }
      } else if (h1 && reduced) {
        gsap.set(h1, { y: 0, opacity: 1 })
      }

      // Strip: estado inicial geometría + clip oculto
      gsap.set(strip, { top: stripTop, left: leftStart, right: 0, bottom: 0, clipPath: 'inset(0 100% 0 0)' })

      if (reduced || !isFreshLoad) {
        // Reduced motion O refresco mid-page: sin reveal animation. El estado
        // final lo aplica el snap inicial de fase más abajo (basado en scrollY).
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

      // Snap inicial al phase state correcto basado en scrollY actual.
      // Sin esto, en refresh mid-page el strip flashea desde su geometría
      // inicial (bottom-strip) hasta su estado final cuando ScrollTrigger
      // dispara onUpdate por primera vez.
      const snapPhaseState = (scrollY: number) => {
        if (scrollY <= PHASE1_END) {
          const p = scrollY / PHASE1_END
          gsap.set(strip, { top: stripTop * (1 - p), left: leftStart * (1 - p) })
          gsap.set(strip, { clipPath: 'inset(0 0% 0 0)' })
        } else if (scrollY <= PHASE2_END) {
          gsap.set(strip, { top: 0, left: 0 })
          gsap.set(strip, { clipPath: 'inset(0 0% 0 0)' })
        } else if (scrollY <= PHASE3_END) {
          const p = (scrollY - PHASE2_END) / (PHASE3_END - PHASE2_END)
          gsap.set(strip, { top: 0, left: 0 })
          gsap.set(strip, { clipPath: `inset(0 0 ${p * 100}% 0)` })
        } else {
          // Más allá de fase 3 — strip totalmente clipado (oculto).
          gsap.set(strip, { top: 0, left: 0 })
          gsap.set(strip, { clipPath: 'inset(0 0 100% 0)' })
        }
      }
      if (!isFreshLoad) {
        snapPhaseState(initialScrollY)
      }

      // ── Reproducción del vídeo del strip según fase ──────────────────────
      //  · Strip (scroll < PHASE1_END): PAUSADO en el primer frame (poster).
      //  · Fullscreen (PHASE1_END < scroll < PHASE3_END): autoplay muted.
      //  · Más allá: pausado (no se ve).
      //  · Lightbox abierto: SIEMPRE pausado (la reproducción la lleva el
      //    elemento del lightbox, con audio).
      const updateStripVideoPlayback = (scrollY: number) => {
        if (!videoEl) return
        if (isLightboxOpenRef.current) {
          if (!videoEl.paused) videoEl.pause()
          return
        }
        const inFullscreen = scrollY >= PHASE1_END && scrollY < PHASE3_END
        if (inFullscreen) {
          if (videoEl.paused) videoEl.play().catch(() => {})
        } else {
          if (!videoEl.paused) videoEl.pause()
          // En estado strip (scroll < PHASE1_END), aseguramos frame 0
          if (scrollY < PHASE1_END) videoEl.currentTime = 0
        }
      }
      if (videoEl) {
        videoEl.style.opacity = '1'
        updateStripVideoPlayback(initialScrollY)
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

            // Strip video play/pause según fase
            updateStripVideoPlayback(scrollY)

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

      // ── Hover "Play video"/"Cerrar": label sigue al cursor con mix-blend
      // difference. Variante:
      //   · Lightbox cerrado → "Play video" (sobre strip o fullscreen)
      //   · Lightbox abierto → "Cerrar"
      const playHintEl = playHintRef.current
      const playVariantEl  = playVariantRef.current
      const closeVariantEl = closeVariantRef.current
      let variantIsClose = false

      const updateHintVariant = () => {
        const next = isLightboxOpenRef.current
        if (next === variantIsClose) return
        variantIsClose = next
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

      // ── Click en el strip: SIEMPRE abre el lightbox encima de todo con
      // audio. (Antes alternaba fullscreen via scroll; ahora ese estado solo
      // se alcanza scrolleando manualmente.) El cierre se hace desde el
      // overlay del lightbox.
      const onStripClick = () => {
        if (reduced) return
        setIsLightboxOpen(true)
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
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

      </div>

      {/* ── Lightbox — vídeo encima de TODO (z=2000) en formato modal:
            backdrop dark/85 (deja entrever el sitio), vídeo limitado a
            85vw / 85vh (object-contain), barra de progreso fina al pie
            estilo rejouice. Click en cualquier sitio cierra. */}
      {isLightboxOpen && videoSrc && (
        <div
          className="fixed inset-0 cursor-pointer flex items-center justify-center"
          style={{ zIndex: 2000, backgroundColor: 'rgb(28 26 23 / 0.85)' }}
          onClick={() => setIsLightboxOpen(false)}
          aria-label="Cerrar vídeo"
          role="button"
        >
          <div className="relative">
            <video
              ref={lightboxVideoRef}
              src={videoSrc}
              autoPlay
              playsInline
              preload="auto"
              className="block max-w-[85vw] max-h-[85vh]"
            />
            {/* Línea de reproducción — fina, fija al pie del vídeo. Se rellena
                vía scaleX según currentTime/duration (timeupdate listener). */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] bg-warm-light/25">
              <div
                ref={progressBarRef}
                className="h-full origin-left bg-warm-light"
                style={{ transform: 'scaleX(0)' }}
              />
            </div>

            {/* Toggle de audio — esquina inferior derecha, justo encima de la
                barra de reproducción. stopPropagation evita que el click cierre
                el lightbox. */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsLightboxMuted((m) => !m)
              }}
              aria-label={isLightboxMuted ? 'Activar sonido' : 'Silenciar'}
              aria-pressed={isLightboxMuted}
              className="absolute bottom-3 right-3 flex size-8 cursor-pointer items-center justify-center text-warm-light/80 transition-colors duration-fast ease-expo hover:text-warm-light"
            >
              {isLightboxMuted ? (
                /* Speaker muted (con X) */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                /* Speaker on (con ondas) */
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 010 7.07" />
                  <path d="M19.07 4.93a10 10 0 010 14.14" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

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
