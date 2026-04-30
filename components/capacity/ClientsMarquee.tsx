'use client'

import { Fragment, useEffect, useState } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

/* ==========================================================================
   ClientsMarquee (capacity) — clientes con justify pleno + spotlight random.
   --------------------------------------------------------------------------
   Mismo lenguaje visual que el ClientsMarquee del Home:
   · Tipografía text-title font-serif font-normal, color base text-fg/10.
   · Caja más ancha que el viewport con justify completo (`text-justify
     [text-align-last:justify]`) → líneas siempre llenas, nombres en bordes
     se cortan visualmente.
   · Spotlight: cada SWITCH_INTERVAL_MS un cliente aleatorio pasa a text-fg
     en TODAS sus instancias (incluye duplicados).
   · Repeat 2× del array de clientes para que el justify nunca tenga
     última línea con huecos exagerados.
   · max-height + overflow:hidden recorta verticalmente para mantener el
     bloque compacto y consistente con el del Home.
   ========================================================================== */

interface ClientsMarqueeProps {
  /** String con los clientes separados por " — " (formato de las traducciones). */
  clients: string
  /** Si true, fuerza una sola línea con tipografía fluida que escala al ancho.
   *  Útil cuando el listado es corto y `text-title` queda exagerado. */
  singleLine?: boolean
}

const SWITCH_INTERVAL_MS = 1500
const SEPARATOR = ' — '
const REPEAT = 1

export function ClientsMarquee({ clients, singleLine = false }: ClientsMarqueeProps) {
  // Parseamos la lista a un array (split por dash, trim, eliminar entradas vacías).
  const list = clients
    .split(/—/)
    .map((s) => s.trim())
    .filter(Boolean)

  const repeated = Array.from({ length: REPEAT }, () => list).flat()

  const [highlight, setHighlight] = useState<number>(-1)

  useEffect(() => {
    if (getReducedMotion()) return
    if (list.length === 0) return

    let prev = -1
    const pick = () => {
      let next: number
      do {
        next = Math.floor(Math.random() * list.length)
      } while (next === prev && list.length > 1)
      prev = next
      setHighlight(next)
    }

    pick()
    const id = setInterval(pick, SWITCH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [list.length])

  const highlightedName = highlight >= 0 ? list[highlight] : null

  if (list.length === 0) return null

  return (
    <section
      className="w-full bg-warm-light py-12 lg:py-16"
      aria-label="Clientes"
    >
      <div className="section-inner">
        <p
          aria-hidden="true"
          className={`font-serif font-normal text-fg/10 leading-[1.05] text-center ${
            singleLine
              ? 'whitespace-nowrap text-[clamp(14px,3.2vw,44px)]'
              : 'text-title [text-wrap:balance]'
          }`}
        >
          {repeated.map((c, i) => (
            <Fragment key={`${c}-${i}`}>
              <span
                className={`transition-colors duration-500 ease-out ${
                  c === highlightedName ? 'text-fg' : 'text-fg/10'
                }`}
              >
                {c}
              </span>
              {i < repeated.length - 1 && SEPARATOR}
            </Fragment>
          ))}
        </p>
      </div>
    </section>
  )
}
