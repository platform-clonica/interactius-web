'use client'

import { useEffect, useRef, useState } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

/* DossierBar — una barra proporcional que crece al entrar en pantalla.

   La usan el precedente del teletrabajo (sobre fondo oscuro) y la comparativa
   de Gartner (sobre fondo claro), de ahí que los colores lleguen por props en
   vez de estar fijados dentro.

   Es decorativa por contrato: el dato siempre está escrito al lado en texto,
   que es lo que lee un lector de pantalla. Por eso va con `aria-hidden` y por
   eso da igual que la animación no llegue a correr. */
export function DossierBar({
  pct,
  pista,
  relleno,
  alto = 'h-3',
  retardo = 0,
}: {
  /** Porcentaje de la pista que ocupa la barra. */
  pct: number
  /** Clase de fondo de la pista. */
  pista: string
  /** Clase de fondo de la barra. */
  relleno: string
  alto?: string
  /** Milisegundos de espera, para escalonar varias barras. */
  retardo?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [crecer, setCrecer] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (getReducedMotion()) {
      setCrecer(true)
      return
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return
        obs.disconnect()
        const id = window.setTimeout(() => setCrecer(true), retardo)
        return () => window.clearTimeout(id)
      },
      { threshold: 0.5 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [retardo])

  return (
    <div ref={ref} className={`mt-2 w-full ${alto} ${pista}`} aria-hidden="true">
      <div
        className={`h-full ${relleno} transition-[width] duration-[1100ms] ease-out motion-reduce:transition-none`}
        style={{ width: crecer ? `${pct}%` : '0%' }}
      />
    </div>
  )
}
