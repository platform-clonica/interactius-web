'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'
import { useMenuStore } from '@/lib/store/menu'
import { usePageCurtainStore } from '@/lib/store/curtain'

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
  const t = useTranslations('home')
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
  const playHintTextRef = useRef<HTMLSpanElement>(null)
  // Labels del hint guardados en ref → la useEffect principal no necesita
  // depender de `t`, evita el warning de HMR cuando el array de deps crece.
  const hintLabelsRef = useRef({ play: '', mute: '' })
  hintLabelsRef.current = {
    play: t('hero.playWithSound'),
    mute: t('hero.muteSound'),
  }

  // Estado del lightbox: cuando true, el vídeo se renderiza encima de todo
  // con audio. Cierra al hacer click. El strip/fullscreen vídeo se pausa
  // mientras el lightbox está abierto para no doblar la reproducción.
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isLightboxMuted, setIsLightboxMuted] = useState(false)
  const isLightboxOpenRef = useRef(false)

  // Helper de play — respeta el estado de muted actual. NUNCA pone muted=false
  // por su cuenta: el audio solo se activa por click manual del usuario
  // (handleStripClick). Si Chrome bloquea por autoplay policy (puede pasar
  // si muted=false sin gesture previo), fallback a muted como red de seguridad.
  const playRespectingMutedState = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (!v.paused) return
    const p = v.play()
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        if (!v.muted) {
          v.muted = true
          v.play().catch(() => {})
        }
      })
    }
  }, [])

  // Click sobre el strip → toggle de audio (muted ↔ unmuted). Es el único
  // sitio donde el audio puede activarse — el gesto del usuario libera la
  // autoplay policy del browser.
  const handleStripClick = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    if (v.paused) v.play().catch(() => {})
  }, [])

  // Tras la cortina de transición, asegurar que el video sigue playing
  // (puede haberse pausado durante el unmount/mount). NO desmuteamos: si el
  // usuario navegó a otra página y volvió, el video debe arrancar muted.
  const isCurtainActive = usePageCurtainStore((s) => s.isActive)
  const prevCurtainActiveRef = useRef(isCurtainActive)
  useEffect(() => {
    if (prevCurtainActiveRef.current && !isCurtainActive) {
      playRespectingMutedState()
    }
    prevCurtainActiveRef.current = isCurtainActive
  }, [isCurtainActive, playRespectingMutedState])

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
        if (sy < PHASE3_END) {
          playRespectingMutedState()
        }
      }
    }
  }, [isLightboxOpen, playRespectingMutedState])

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
  // header siempre encima del strip mientras menu esté abierto. Además, mute
  // el video — el strip queda tapado, así que el audio debe desactivarse y
  // requerir click del usuario para reactivarse al cerrar el menú.
  useEffect(() => {
    const s = stripRef.current
    const a = arrowRef.current
    const z = isMenuOpen ? '100' : '400'
    if (s) s.style.zIndex = z
    if (a) a.style.zIndex = z
    if (isMenuOpen) {
      const v = videoRef.current
      if (v) v.muted = true
    }
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
      // El wrapper del tagline nace con opacity:0 inline (en el JSX) para
      // evitar el flash del h1 visible antes de que SplitType + gsap.set
      // apliquen el estado inicial oculto. Se restaura aquí, una vez las
      // líneas YA tienen su estado hidden y la animación está armada.
      const h1 = tagline.querySelector<HTMLHeadingElement>('h1')
      if (h1 && !reduced) {
        const split = new SplitType(h1, { types: 'lines' })
        const lines = split.lines ?? []
        wrapLinesInMask(lines)
        gsap.set(lines, { y: 80, opacity: 0 })
        gsap.set(tagline, { opacity: 1 })
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
              duration: 0.5,
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
        gsap.set(tagline, { opacity: 1 })
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

      // Pointer-events autoritativo según fase. Strip clickable solo cuando
      // está visible (Phase 1/2 o inicio de Phase 3). En Phase 3 ya colapsado
      // o más allá del budget → no-interactivo, no atrapando al usuario.
      const setStripInteractivity = (scrollY: number) => {
        const visible = scrollY < PHASE3_END
        strip.style.pointerEvents = visible ? 'auto' : 'none'
      }

      // ── Reproducción del vídeo del strip ─────────────────────────────────
      //  · scroll < PHASE3_END: playing con el muted state actual (toggled
      //    solo por click del usuario sobre el strip).
      //  · scroll ≥ PHASE3_END: pausado Y muted=true (el video desaparece,
      //    el audio queda desactivado hasta el siguiente click del usuario).
      //  · Lightbox abierto: SIEMPRE pausado.
      //  · Curtain activa: no-op — el efecto del curtain dispara el play tras
      //    la uncover, así evitamos audio bajo la cortina.
      const updateStripVideoPlayback = (scrollY: number) => {
        if (!videoEl) return
        if (usePageCurtainStore.getState().isActive) return
        if (isLightboxOpenRef.current) {
          if (!videoEl.paused) videoEl.pause()
          return
        }
        if (scrollY < PHASE3_END) {
          playRespectingMutedState()
        } else {
          if (!videoEl.paused) videoEl.pause()
          videoEl.muted = true
        }
      }

      // ── applyScrollState — fuente única de verdad por posición de scroll ─
      // Llamada desde ScrollTrigger.onUpdate (camino feliz) Y desde el rAF
      // scroll listener redundante (failsafe). Tagline + arrow + video se
      // actualizan AQUÍ — antes vivían solo en onUpdate, y si ScrollTrigger
      // se dormía (bfcache, scroll-lock atascado, resize en iOS) el tagline
      // quedaba "sticky" al viewport mientras el strip sí se mantenía OK.
      const applyScrollState = (scrollY: number) => {
        // Tagline "se va con el scroll" (patrón rejouice): translateY 1:1.
        gsap.set(taglineEl, { y: -scrollY })

        if (scrollY <= PHASE1_END) {
          // Fase 1 — strip expande a fullscreen (top+left → 0).
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
          // Fase 3 — strip colapsa (clip bottom-inset crece).
          const p = (scrollY - PHASE2_END) / (PHASE3_END - PHASE2_END)
          applyStripState(1)
          gsap.set(strip, { clipPath: `inset(0 0 ${p * 100}% 0)` })
          if (arrowEl) gsap.set(arrowEl, { opacity: 1 - p })
        } else {
          // Tras el budget — strip totalmente clipado, arrow oculto.
          applyStripState(1)
          gsap.set(strip, { clipPath: 'inset(0 0 100% 0)' })
          if (arrowEl) gsap.set(arrowEl, { opacity: 0 })
        }

        setStripInteractivity(scrollY)
        updateStripVideoPlayback(scrollY)
      }

      if (!isFreshLoad) {
        applyScrollState(initialScrollY)
      } else {
        // Fresh load: el reveal lateral del strip arranca con clipPath
        // 100% (oculto) y se anima vía gsap.to — NO llamamos a applyScrollState
        // aquí porque sobreescribiría ese clipPath. Solo inicializamos
        // pointer-events + video (curtain-aware).
        setStripInteractivity(initialScrollY)
        if (videoEl) {
          videoEl.style.opacity = '1'
          updateStripVideoPlayback(initialScrollY)
        }
      }

      if (!reduced) {
        const onResize = () => {
          leftStart = getCol2StartPx()
          stripH = getStripHeightPx()
          stripTop = window.innerHeight - stripH
          // Tras un resize las métricas internas de ScrollTrigger quedan stale
          // (en iOS Safari el collapse de la URL bar dispara resize). Refresh
          // las recalcula sin afectar al scroll position.
          ScrollTrigger.refresh()
        }
        window.addEventListener('resize', onResize, { passive: true })
        cleanups.push(() => window.removeEventListener('resize', onResize))

        const st = ScrollTrigger.create({
          trigger: spacer,
          start: 'top top',
          end: `+=${HERO_SCROLL}`,
          onUpdate: (self) => {
            applyScrollState(self.progress * HERO_SCROLL)
          },
        })
        cleanups.push(() => st.kill())
      } else {
        // Reduced motion — mostrar fullscreen directo
        applyStripState(1)
      }

      // ── Failsafe: scroll listener nativo redundante ──────────────────────
      // Red de seguridad si ScrollTrigger se queda dormido (bfcache, GPU
      // compositor stale tras hibernación, scroll-lock atascado, etc.).
      // Aplica el ESTADO COMPLETO según scrollY actual — incluyendo tagline
      // y arrow — sin sustituir a ScrollTrigger. rAF throttle para no
      // penalizar el scroll.
      let rafScheduled = false
      const onWindowScroll = () => {
        if (rafScheduled) return
        rafScheduled = true
        requestAnimationFrame(() => {
          rafScheduled = false
          applyScrollState(window.scrollY)
        })
      }
      window.addEventListener('scroll', onWindowScroll, { passive: true })
      cleanups.push(() => window.removeEventListener('scroll', onWindowScroll))

      // ── Refresh en visibility/pageshow ───────────────────────────────────
      // Tras hibernación/tab-switch ScrollTrigger pierde frames y queda con
      // valores stale. Tras bfcache restore los useEffect no se re-disparan
      // y el strip puede quedar atascado. En ambos casos re-aplicamos el
      // estado correcto basado en scrollY actual y refrescamos ScrollTrigger.
      const refreshAll = () => {
        applyScrollState(window.scrollY)
        ScrollTrigger.refresh()
      }
      const onVisibility = () => {
        if (document.hidden) return
        refreshAll()
      }
      const onPageShow = (e: PageTransitionEvent) => {
        if (!e.persisted) return
        refreshAll()
      }
      document.addEventListener('visibilitychange', onVisibility)
      window.addEventListener('pageshow', onPageShow)
      cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility))
      cleanups.push(() => window.removeEventListener('pageshow', onPageShow))

      // ── Escape hatch para usuario atrapado ────────────────────────────────
      // Si por cualquier motivo el strip queda fullscreen sin que el scroll
      // funcione, Esc o dblclick fuerzan el salto a más allá del budget.
      // Pausa el video, libera el body lock si está heredado, y scrollea más
      // allá de Phase 3 para que el strip se contraiga.
      const escapeHero = () => {
        if (window.scrollY >= PHASE3_END) return // ya fuera del budget
        if (videoEl && !videoEl.paused) videoEl.pause()
        const root = document.documentElement
        const body = document.body
        if (root.style.overflow === 'hidden') root.style.overflow = ''
        if (body.style.overflow === 'hidden') body.style.overflow = ''
        window.scrollTo({ top: HERO_SCROLL + 1, left: 0, behavior: 'instant' })
        applyScrollState(HERO_SCROLL + 1)
      }
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Escape') return
        escapeHero()
      }
      const onStripDblClick = (e: MouseEvent) => {
        e.preventDefault()
        escapeHero()
      }
      window.addEventListener('keydown', onKeyDown)
      strip.addEventListener('dblclick', onStripDblClick)
      cleanups.push(() => window.removeEventListener('keydown', onKeyDown))
      cleanups.push(() => strip.removeEventListener('dblclick', onStripDblClick))

      // ── [EXPERIMENT] Hover hint siguiendo el cursor ──────────────────────
      // Visible siempre durante el hover. El texto alterna según el estado
      // muted del strip video ("Play with sound" ↔ "Quitar sonido").
      const playHintEl = playHintRef.current
      const playHintTextEl = playHintTextRef.current
      if (playHintEl && playHintTextEl && !reduced) {
        const refreshLabel = () => {
          const next = videoEl?.muted ? hintLabelsRef.current.play : hintLabelsRef.current.mute
          if (playHintTextEl.textContent !== next) playHintTextEl.textContent = next
        }
        const onStripEnter = () => {
          refreshLabel()
          gsap.to(playHintEl, { opacity: 1, duration: 0.2, ease: 'power2.out', overwrite: true })
        }
        const onStripLeave = () => {
          gsap.to(playHintEl, { opacity: 0, duration: 0.15, ease: 'power2.out', overwrite: true })
        }
        const onStripMouseMove = (e: MouseEvent) => {
          gsap.set(playHintEl, { x: e.clientX + 12, y: e.clientY + 12 })
          refreshLabel()
        }
        strip.addEventListener('mouseenter', onStripEnter)
        strip.addEventListener('mouseleave', onStripLeave)
        strip.addEventListener('mousemove',  onStripMouseMove)
        cleanups.push(() => strip.removeEventListener('mouseenter', onStripEnter))
        cleanups.push(() => strip.removeEventListener('mouseleave', onStripLeave))
        cleanups.push(() => strip.removeEventListener('mousemove',  onStripMouseMove))
      }

      cleanupRef.current = () => cleanups.forEach((fn) => fn())
    })()

    return () => cleanupRef.current?.()
  }, [playRespectingMutedState])

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
          style={{ opacity: 0 }}
        >
          <div className="section-inner pointer-events-none">
            {children}
          </div>
        </div>
      </section>

      {/* Strip — SEPARADO de la section, fixed, z=400 (encima del chrome: 160-200).
           Al crecer a fullscreen tapa físicamente el chrome sin snaps. En estado
           strip inicial (bottom-right) el chrome está visible fuera del strip.

           Failsafe: arranca con pointer-events:none y se activa solo cuando GSAP
           confirma que el strip es visible (Phase 1/2). Si GSAP nunca carga, el
           strip permanece no-interactivo, no atrapando al usuario. */}
      <div
        ref={stripRef}
        className="fixed overflow-hidden cursor-pointer"
        style={{ clipPath: 'inset(0 100% 0 0)', zIndex: 400, pointerEvents: 'none' }}
        onClick={handleStripClick}
        role="button"
        tabIndex={0}
        aria-label="Alternar sonido del vídeo"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleStripClick()
          }
        }}
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
          aria-label={t('hero.closeVideoAriaLabel')}
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

      {/* [EXPERIMENT] Hint que sigue al cursor con mix-blend difference (mismo
          pipeline que logo/hamburger). Texto alterna entre "Play with sound"
          y "Mute sound" según el estado muted del strip video. */}
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
        <div className="flex items-center gap-2">
          <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M0 0 L8 5 L0 10 Z" />
          </svg>
          <span ref={playHintTextRef}>{t('hero.playWithSound')}</span>
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
