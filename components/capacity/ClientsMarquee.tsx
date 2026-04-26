'use client'

import { useRef, useEffect } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

/* ==========================================================================
   ClientsMarquee — banda de clientes en marquee infinito derecha → izquierda
   --------------------------------------------------------------------------
   · Tipografía Super: clamp(80px, 15vw, 240px), font-serif font-normal,
     leading-[0.9], tracking-[-0.04em] (idéntica al título de Metodología).
   · Color: text-fg/10 (10% opacidad — visual sutil de fondo).
   · Edge-to-edge horizontal con overflow-hidden.
   · Animación GSAP: dos copias del texto en flex; xPercent 0 → -50 con
     duration 20s, ease 'none', repeat -1. Al llegar a -50% la 2ª copia
     ocupa la posición de la 1ª → loop sin salto perceptible.
   ========================================================================== */

interface ClientsMarqueeProps {
  clients: string
}

export function ClientsMarquee({ clients }: ClientsMarqueeProps) {
  const marqueeRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tweenRef = useRef<any>(null)

  useEffect(() => {
    const marqueeEl = marqueeRef.current
    if (!marqueeEl) return

    void (async () => {
      const reduced = getReducedMotion()
      if (reduced) return

      const { default: gsap } = await import('gsap')
      tweenRef.current = gsap.to(marqueeEl, {
        xPercent: -50,
        duration: 20,
        ease: 'none',
        repeat: -1,
      })
    })()

    return () => {
      tweenRef.current?.kill()
    }
  }, [])

  return (
    <section className="w-full bg-warm-light overflow-hidden py-12 lg:py-16" aria-label="Clientes">
      <div
        ref={marqueeRef}
        className="flex whitespace-nowrap font-serif font-normal text-fg/10 text-super will-change-transform"
        aria-label={clients}
      >
        <span className="pr-[clamp(40px,5vw,100px)]" aria-hidden="true">{clients}</span>
        <span className="pr-[clamp(40px,5vw,100px)]" aria-hidden="true">{clients}</span>
      </div>
    </section>
  )
}
