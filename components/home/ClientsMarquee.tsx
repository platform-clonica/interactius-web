'use client'

import { Fragment, useEffect, useState } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

const CLIENTS = [
  'AD Parts', 'Adeslas', 'Allianz', 'AXA', 'Banc Sabadell', 'Bershka', 'Brico Depot',
  'Bytetravel', 'CaixaBank', 'Castañer', 'CatSalut', 'Citring', 'Consentio',
  'Desigual', 'EAE', 'Ecoembes', 'MWC', 'Frit Ravich', 'FCB', 'Gescaser',
  'GLS', 'Grandvalira', 'Grupo Piñero', 'Hermex', 'Ignion', 'Imagin',
  'Inditex', 'ING', 'La Wash', 'Mahou', 'Mango', 'Masmusculo', 'Massimo Dutti',
  'Nestlé', 'Novartis', 'Quepo', 'Ricoh', 'Hospital Sant Pau', 'Serveo',
  'Tecnocasa', 'Telefónica', 'UPF ESCI', 'Vibia', 'Voicemod', 'Voro',
]

// Cada cuánto se mueve el "spotlight" a otro cliente.
const SWITCH_INTERVAL_MS = 1500

// nbsp + em-dash + espacio normal — el dash siempre queda pegado al cliente
// anterior; el espacio normal después permite el wrap natural.
const SEPARATOR = ' — '

export function ClientsMarquee() {
  // -1 = ninguno destacado (estado inicial SSR + reduced motion).
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

  return (
    <section
      aria-hidden="true"
      className="relative z-content w-full bg-bg py-16"
    >
      {/* Lista de clientes — full viewport, centrada, em-dash entre nombres,
          line-height ajustado. text-wrap:pretty evita orphans en la última
          línea. Solo un cliente está en `text-fg` a la vez; el resto en
          `text-fg/20`. El spotlight cambia cada SWITCH_INTERVAL_MS. */}
      <p className="font-serif font-normal text-fg/10 text-title leading-[1.05] text-center [text-wrap:pretty] px-4">
        {CLIENTS.map((c, i) => (
          <Fragment key={c}>
            <span
              className={`transition-colors duration-500 ease-out ${
                i === highlight ? 'text-fg' : 'text-fg/10'
              }`}
            >
              {c}
            </span>
            {i < CLIENTS.length - 1 && SEPARATOR}
          </Fragment>
        ))}
      </p>
    </section>
  )
}
