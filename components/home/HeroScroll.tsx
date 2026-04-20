'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { useReducedMotion } from '@/components/motion/useReducedMotion'

import { HeroTagline } from './HeroTagline'
import { HeroMedia } from './HeroMedia'

/**
 * HeroScroll — hero animado en 3 fases scroll-driven (A01 + A02 + A04).
 *
 * Spacer: 1260px (fase 1: 380, fase 2: 500, fase 3: 380).
 *
 * Fase 0 — pre-scroll: estado inicial con clip abierto reducido.
 * Fase 1 (0→380) — apertura: clip se expande desde la ventana inicial.
 * Fase 2 (380→880) — fullscreen dwell: video play + fade-in.
 * Fase 3 (880→1260) — cierre vertical: clip colapsa desde abajo.
 * Fase 4 (>1260) — oculto detrás del contenido siguiente.
 *
 * Responsive: bajo 901px o reduced-motion, queda como sección estática normal.
 */

export type HeroPhase = 0 | 1 | 2 | 3 | 4

const PHASE_1_END = 380
const PHASE_2_END = 880
const PHASE_3_END = 1260
const SPACER_HEIGHT = PHASE_3_END

const DESKTOP_MIN_WIDTH = 901

interface HeroScrollProps {
  posterSrc?: string
  posterAlt?: string
  videoSrc?: string
}

export function HeroScroll({
  posterSrc = '/home/hero-poster.webp',
  posterAlt = '',
  videoSrc,
}: HeroScrollProps) {
  const heroRef = useRef<HTMLElement>(null)
  const spacerRef = useRef<HTMLDivElement | null>(null)
  const phaseRef = useRef<HeroPhase>(0)
  const [phase, setPhase] = useState<HeroPhase>(0)
  const reduced = useReducedMotion()

  // ========================================================================
  // Promoción a fixed + inyección de spacer (pre-paint).
  // ========================================================================
  useLayoutEffect(() => {
    const el = heroRef.current
    if (!el) return
    if (reduced || !matchDesktop()) return

    const spacer = document.createElement('div')
    spacer.setAttribute('aria-hidden', 'true')
    spacer.style.height = `${SPACER_HEIGHT}px`
    spacer.style.width = '100%'
    spacer.dataset.heroSpacer = 'true'
    el.after(spacer)
    spacerRef.current = spacer

    el.style.position = 'fixed'
    el.style.top = '0'
    el.style.left = 'var(--sidebar-w)'
    el.style.right = '0'
    el.style.zIndex = 'var(--z-hero-fixed, 400)'

    return () => {
      el.style.position = ''
      el.style.top = ''
      el.style.left = ''
      el.style.right = ''
      el.style.zIndex = ''
      spacer.remove()
      spacerRef.current = null
    }
  }, [reduced])

  // ========================================================================
  // Scroll handler con RAF — actualiza clip-path y emite phase.
  // ========================================================================
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    if (reduced || !matchDesktop()) {
      // Estado estático: fase 2 equivalente — visible fullscreen.
      el.style.clipPath = 'inset(0 0 0 0)'
      setPhase(2)
      phaseRef.current = 2
      return
    }

    let rafId = 0
    let ticking = false

    const update = () => {
      ticking = false
      const y = window.scrollY

      let nextPhase: HeroPhase
      if (y <= 0) nextPhase = 0
      else if (y <= PHASE_1_END) nextPhase = 1
      else if (y <= PHASE_2_END) nextPhase = 2
      else if (y <= PHASE_3_END) nextPhase = 3
      else nextPhase = 4

      // Aplica clip-path según progreso dentro de la fase
      if (nextPhase === 0) {
        el.style.clipPath = 'inset(48vh 0 0 calc(1 * var(--grid-margin)))'
      } else if (nextPhase === 1) {
        const p = y / PHASE_1_END
        const topClip = 48 - p * 48
        const leftMult = 1 - p
        el.style.clipPath = `inset(${topClip}vh 0 0 calc(${leftMult} * var(--grid-margin)))`
      } else if (nextPhase === 2) {
        el.style.clipPath = 'inset(0 0 0 0)'
      } else if (nextPhase === 3) {
        const p = (y - PHASE_2_END) / (PHASE_3_END - PHASE_2_END)
        el.style.clipPath = `inset(0 0 ${p * 100}vh 0)`
      }

      // z-index + state sync solo en cambio de fase
      if (nextPhase !== phaseRef.current) {
        if (nextPhase === 4) {
          el.style.zIndex = '-1'
        } else {
          el.style.zIndex = 'var(--z-hero-fixed, 400)'
        }
        phaseRef.current = nextPhase
        setPhase(nextPhase)
      }
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      rafId = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [reduced])

  return (
    <section
      ref={heroRef}
      aria-label="Hero"
      className="relative h-screen w-full overflow-hidden bg-warm-light"
      style={
        reduced || !matchDesktopSSR()
          ? undefined
          : {
              clipPath: 'inset(48vh 0 0 var(--grid-margin))',
            }
      }
    >
      <HeroMedia
        posterSrc={posterSrc}
        posterAlt={posterAlt}
        videoSrc={videoSrc}
        phase={phase}
        reduced={reduced}
      />
      <HeroTagline />
    </section>
  )
}

/* ==========================================================================
   Helpers
   ========================================================================== */

function matchDesktop(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`).matches
}

function matchDesktopSSR(): boolean {
  if (typeof window === 'undefined') return false
  return matchDesktop()
}
