'use client'

import { Fragment, useEffect, useState } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { CLIENTS } from '@/lib/data/clients'

// Cada cuánto se mueve el "spotlight" a otro cliente.
const SWITCH_INTERVAL_MS = 1200

// nbsp + em-dash + espacio normal — el dash siempre queda pegado al cliente
// anterior; el espacio normal después permite el wrap natural.
const SEPARATOR = ' — '

export function ClientsMarquee() {
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
      <div className="section-inner">
        <p className="font-serif font-normal text-fg/10 text-title leading-[1.05] text-center [text-wrap:pretty]">
          {CLIENTS.map((c, i) => (
            <Fragment key={c}>
              <span
                className={`transition-colors duration-500 ease-out ${
                  c === highlightedName ? 'text-fg' : 'text-fg/10'
                }`}
              >
                {c}
              </span>
              {i < CLIENTS.length - 1 && SEPARATOR}
            </Fragment>
          ))}
        </p>
      </div>
    </section>
  )
}
