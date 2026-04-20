'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { useReducedMotion } from '@/components/motion/useReducedMotion'

import { IntroText } from './IntroText'
import { IntroQuote } from './IntroQuote'

/**
 * IntroScroll — sección intro animada en 4 fases scroll-driven (A03 + A05 + A06).
 *
 * Spacer: 2740px. Distribución aproximada:
 *   A (0→30%)   body1 reveal
 *   B (30→50%)  quote reveal (body1 mantiene visible)
 *   C (50→80%)  body2 reveal (body1 empieza fade-out sutil)
 *   D (80→100%) todo fade-out para ceder a Services
 *
 * Responsive: bajo 901px o reduced-motion, sección estática normal con
 * los tres bloques en flujo natural.
 */

export type IntroPhase = 'A' | 'B' | 'C' | 'D' | 'past'

const SPACER_HEIGHT = 2740
const PHASE_A_END = 0.3
const PHASE_B_END = 0.5
const PHASE_C_END = 0.8

const DESKTOP_MIN_WIDTH = 901

export function IntroScroll() {
  const sectionRef = useRef<HTMLElement>(null)
  const spacerRef = useRef<HTMLDivElement | null>(null)
  const phaseRef = useRef<IntroPhase>('A')
  const [phase, setPhase] = useState<IntroPhase>('A')
  const reduced = useReducedMotion()

  // ========================================================================
  // Pin + spacer (pre-paint).
  // ========================================================================
  useLayoutEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (reduced || !matchDesktop()) return

    // El intro se pinea cuando su top alcanza 0vh. Next-up tras el hero
    // (cuya salida fase 3 empuja la intro a entrar).
    const spacer = document.createElement('div')
    spacer.setAttribute('aria-hidden', 'true')
    spacer.style.height = `${SPACER_HEIGHT}px`
    spacer.style.width = '100%'
    spacer.dataset.introSpacer = 'true'
    el.after(spacer)
    spacerRef.current = spacer

    el.style.position = 'sticky'
    el.style.top = '0'
    el.style.zIndex = 'var(--z-intro-active, 5)'

    return () => {
      el.style.position = ''
      el.style.top = ''
      el.style.zIndex = ''
      spacer.remove()
      spacerRef.current = null
    }
  }, [reduced])

  // ========================================================================
  // Scroll handler — calcula progreso relativo a la sección y emite fase.
  // ========================================================================
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (reduced || !matchDesktop()) {
      setPhase('C')
      phaseRef.current = 'C'
      return
    }

    let rafId = 0
    let ticking = false

    const update = () => {
      ticking = false
      const rect = el.getBoundingClientRect()
      const spacer = spacerRef.current
      if (!spacer) return

      // Cálculo de progreso local dentro del intro.
      // El intro está sticky mientras su sibling spacer sigue en viewport.
      // spacerTop = posición top del spacer relativa al viewport.
      // Cuando spacerTop es 0, el intro empezó a pinnarse.
      // Cuando spacerTop es -SPACER_HEIGHT, el intro va a despinnarse.
      const spacerRect = spacer.getBoundingClientRect()
      const rawProgress = -spacerRect.top / SPACER_HEIGHT
      const progress = Math.max(0, Math.min(1, rawProgress))

      let nextPhase: IntroPhase
      if (progress < 0) nextPhase = 'A'
      else if (progress <= PHASE_A_END) nextPhase = 'A'
      else if (progress <= PHASE_B_END) nextPhase = 'B'
      else if (progress <= PHASE_C_END) nextPhase = 'C'
      else if (progress < 1) nextPhase = 'D'
      else nextPhase = 'past'

      if (nextPhase !== phaseRef.current) {
        phaseRef.current = nextPhase
        setPhase(nextPhase)
      }

      // Opacity global según fase D — fade-out gradual para ceder.
      if (nextPhase === 'D') {
        const p = (progress - PHASE_C_END) / (1 - PHASE_C_END)
        el.style.opacity = String(1 - p * 0.6)
      } else if (nextPhase === 'past') {
        el.style.opacity = '0'
      } else {
        el.style.opacity = '1'
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

  // Visibilidad por bloque según fase
  // body1 está activo desde el inicio (fase A). Los otros entran tras.
  const body1Active = true
  const quoteActive = phase === 'B' || phase === 'C' || phase === 'D'
  const body2Active = phase === 'C' || phase === 'D'

  return (
    <section
      ref={sectionRef}
      aria-label="Introducción"
      className="relative h-screen w-full overflow-hidden bg-warm-light"
    >
      <div className="section-inner flex h-full items-center">
        <div className="grid w-full grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-grid-gutter">
          {/* Body copy 1 — aparece en fase A */}
          <div className="lg:col-span-7">
            <IntroText revealed={body1Active}>
              Ese lugar no tiene nombre en ningún catálogo de servicios.{' '}
              <strong className="font-medium">
                Llevamos años construyendo ahí.
              </strong>{' '}
              Combinamos diseño estratégico, criterio humano y tecnología para
              ayudar a las organizaciones a tomar mejores decisiones.
            </IntroText>
          </div>

          {/* Quote — aparece en fase B, centrada */}
          <div className="flex justify-center lg:col-span-12 lg:my-16">
            <IntroQuote revealed={quoteActive}>
              Trabajamos en el &lsquo;entre&rsquo;.
            </IntroQuote>
          </div>

          {/* Body copy 2 — aparece en fase C */}
          <div className="lg:col-span-7 lg:col-start-6">
            <IntroText revealed={body2Active}>
              Convertimos la estrategia en productos y servicios validados para
              activar cambios culturales sostenibles.
            </IntroText>
          </div>
        </div>
      </div>
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
