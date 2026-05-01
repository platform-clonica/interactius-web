'use client'

import { Fragment, useEffect, useState } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { CLIENTS } from '@/lib/data/clients'

// Repeticiones del array. Generamos suficiente material como para que el
// justify nunca tenga última línea con huecos; el bloque se recorta
// verticalmente con `max-height + overflow:hidden` en la section.
const REPEAT = 2
const REPEATED_CLIENTS = Array.from({ length: REPEAT }, () => CLIENTS).flat()

// Cada cuánto se mueve el "spotlight" a otro cliente.
const SWITCH_INTERVAL_MS = 1500

// nbsp + em-dash + espacio normal — el dash siempre queda pegado al cliente
// anterior; el espacio normal después permite el wrap natural.
const SEPARATOR = ' — '

// Desbordamiento horizontal del bloque respecto al viewport. Cada lado
// se sale ~OVERFLOW/2 px → al recortar con overflow:hidden los nombres
// quedan cortados en los bordes (igual que en una composición editorial).
const OVERFLOW = 'clamp(120px, 8vw, 320px)'

export function ClientsMarquee() {
  // Índice del cliente destacado dentro del array CLIENTS original (sin
  // duplicados). El highlight se aplica a TODAS las instancias del mismo
  // nombre en REPEATED_CLIENTS para que el efecto sea visualmente coherente.
  const [highlight, setHighlight] = useState<number>(-1)

  useEffect(() => {
    if (getReducedMotion()) return

    let prev = -1
    const pick = () => {
      let next: number
      do {
        next = Math.floor(Math.random() * CLIENTS.length)
      } while (next === prev && CLIENTS.length > 1)
      prev = next
      setHighlight(next)
    }

    pick()
    const id = setInterval(pick, SWITCH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const highlightedName = highlight >= 0 ? CLIENTS[highlight] : null

  return (
    <section
      aria-hidden="true"
      className="relative z-content w-full bg-bg py-16"
    >
      {/* Bloque de clientes — wrapper con clipping vertical y horizontal,
          pero PRESERVA el py-section de la section padre para que el footer
          no se solape. */}
      <div
        className="overflow-hidden pb-2"
        style={{ maxHeight: 'clamp(290px, 30vh, 494px)' }}
      >
      {/* Caja del texto: más ancha que el viewport y justificada al ancho
          de la caja (no al del viewport). Los nombres en los bordes se
          cortan; el resto reparte espacios uniformes. */}
      <p
        className="font-serif font-normal text-fg/10 text-title leading-[1.05] text-justify [text-align-last:justify]"
        style={{
          width: `calc(100vw + ${OVERFLOW})`,
          marginLeft: `calc(-${OVERFLOW} / 2)`,
        }}
      >
        {REPEATED_CLIENTS.map((c, i) => (
          <Fragment key={`${c}-${i}`}>
            <span
              className={`transition-colors duration-500 ease-out ${
                c === highlightedName ? 'text-fg' : 'text-fg/10'
              }`}
            >
              {c}
            </span>
            {i < REPEATED_CLIENTS.length - 1 && SEPARATOR}
          </Fragment>
        ))}
      </p>
      </div>
    </section>
  )
}
