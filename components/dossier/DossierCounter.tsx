'use client'

import { useEffect, useRef, useState } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

/* DossierCounter — una cifra que sube desde cero al entrar en pantalla.

   Trabaja sobre el texto tal cual viene del JSON, sin pedir que nadie escriba
   el número dos veces. Separa la parte numérica del resto ("760 000" → 760000
   con separador " "; "760bn" → 760 con sufijo "bn") y al formatear reconstruye
   el mismo separador que traía el original. Así cada idioma conserva su
   convención sin tocar el componente.

   El valor final está en el DOM desde el primer render: la animación solo
   recorre el camino hasta él. Si el JavaScript no corre, si la pestaña está
   en segundo plano o si hay `prefers-reduced-motion`, se lee la cifra buena.

   Esto importa más de lo que parece: un contador que empieza en cero y se
   queda ahí publica un dato falso. */

/** Parte "760 000" en { numero: 760000, separador: ' ', sufijo: '' }. */
function analizar(texto: string) {
  const m = texto.match(/^([\d][\d\s.,  ]*)(.*)$/)
  if (!m) return null
  const crudo = m[1].trimEnd()
  const sufijo = texto.slice(m[1].length)
  const separador = crudo.match(/[^\d]/)?.[0] ?? ''
  const numero = Number(crudo.replace(/[^\d]/g, ''))
  if (!Number.isFinite(numero)) return null
  return { numero, separador, sufijo }
}

/** Reinserta el separador original cada tres dígitos desde la derecha. */
function formatear(n: number, separador: string) {
  const s = String(n)
  if (!separador) return s
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, separador)
}

export function DossierCounter({
  value,
  className = '',
  duracion = 1600,
}: {
  /** La cifra tal como está escrita en el JSON. */
  value: string
  className?: string
  duracion?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [texto, setTexto] = useState(value)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const partes = analizar(value)
    if (!partes || getReducedMotion()) return

    let raf = 0
    let inicio = 0
    const obs = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return
        obs.disconnect()
        const paso = (t: number) => {
          if (!inicio) inicio = t
          const p = Math.min(1, (t - inicio) / duracion)
          // easeOutCubic: arranca rápido y frena al final, que es como se lee
          // bien un número subiendo.
          const e = 1 - Math.pow(1 - p, 3)
          setTexto(formatear(Math.round(partes.numero * e), partes.separador) + partes.sufijo)
          if (p < 1) raf = requestAnimationFrame(paso)
        }
        raf = requestAnimationFrame(paso)
      },
      { threshold: 0.6 },
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value, duracion])

  return (
    <span ref={ref} className={className}>
      {texto}
    </span>
  )
}
