'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

import type { HeroPhase } from './HeroScroll'

/**
 * HeroMedia — poster + video opcional del hero.
 *
 * Comportamiento por fase:
 * - 0-1: poster visible, video preload none (si existe).
 * - 2-3: video visible con opacity 1 sobre el poster, llama a .play().
 * - 4:   video pause (ahorro batería/CPU mientras no se ve).
 *
 * Si no hay videoSrc:
 * - El poster aplica Ken-Burns sutil (scale 1 → 1.03 loop 12s) como
 *   sensación de vida. Desactivado en reduced-motion.
 *
 * LCP budget:
 * - Poster con fetchPriority="high", loading="eager".
 * - Video preload="none" hasta fase 2 → se cambia dinámicamente a "auto"
 *   y se dispara .load() + .play().
 */

interface HeroMediaProps {
  posterSrc: string
  posterAlt: string
  videoSrc?: string
  phase: HeroPhase
  reduced: boolean
}

export function HeroMedia({
  posterSrc,
  posterAlt,
  videoSrc,
  phase,
  reduced,
}: HeroMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasLoadedRef = useRef(false)

  // ========================================================================
  // Control del video según fase.
  // ========================================================================
  useEffect(() => {
    if (!videoSrc) return
    const video = videoRef.current
    if (!video) return

    if (phase >= 2 && phase <= 3) {
      // Primera vez que entramos en fase 2 — forzar load + play.
      if (!hasLoadedRef.current) {
        video.preload = 'auto'
        video.load()
        hasLoadedRef.current = true
      }
      // Play silenciado (muted ya garantiza el auto-play en navegadores).
      video.play().catch(() => {
        // Si el browser bloquea (raro con muted), fallback al poster permanente.
      })
    } else if (phase === 4) {
      // Oculto — pausamos para ahorrar CPU.
      if (!video.paused) video.pause()
    }
  }, [phase, videoSrc])

  const videoVisible = phase >= 2 && phase <= 3
  const applyKenBurns = !videoSrc && !reduced

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-[1]"
      aria-hidden="true"
    >
      {/* Poster — siempre presente, LCP candidate */}
      <div
        className={`absolute inset-0 ${applyKenBurns ? 'hero-poster-kenburns' : ''}`}
      >
        <Image
          src={posterSrc}
          alt={posterAlt}
          fill
          priority
          fetchPriority="high"
          sizes="(min-width: 901px) calc(100vw - 60px), 100vw"
          className="object-cover"
        />
      </div>

      {/* Video — solo si hay src. Opacity fade cuando fase >= 2 */}
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          preload="none"
          poster={posterSrc}
          className={`absolute inset-0 h-full w-full object-cover
                      transition-opacity duration-slow ease-expo
                      ${videoVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ willChange: 'opacity' }}
        />
      )}
    </div>
  )
}
