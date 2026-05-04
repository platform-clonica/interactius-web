'use client'

import { Fragment } from 'react'

import { CLIENTS } from '@/lib/data/clients'

/* ==========================================================================
   ClientsMarquee (capacity) — mismo layout que home/ClientsMarquee con
   highlight ESTÁTICO de los clientes del servicio.
   --------------------------------------------------------------------------
   · Lista completa de clientes (lib/data/clients) repetida 2× para que el
     justify nunca tenga última línea con huecos exagerados.
   · Layout idéntico al home: caja más ancha que el viewport (overflow
     horizontal en los bordes), justify completo, max-height + overflow
     vertical, tipografía text-title font-serif.
   · Sin rotación random. Los clientes específicos de la página (parsed
     del prop `clients` en formato " — " separado) renderizan en text-fg;
     el resto en text-fg/10.
   ========================================================================== */

interface ClientsMarqueeProps {
  /** Clientes del servicio actual, separados por " — ". Se resaltan en
   *  text-fg dentro del listado completo. */
  clients: string
  /** Mantenido por compatibilidad con la API previa pero ignorado en el
   *  nuevo layout (siempre multi-línea justified). */
  singleLine?: boolean
}

const REPEAT = 2
const REPEATED_CLIENTS = Array.from({ length: REPEAT }, () => CLIENTS).flat()
const SEPARATOR = ' — '
const OVERFLOW = 'clamp(120px, 8vw, 320px)'

export function ClientsMarquee({ clients }: ClientsMarqueeProps) {
  // Parse del string de clientes del servicio. Normalizamos a Set para
  // lookup O(1) durante el render.
  const highlightedSet = new Set(
    clients
      .split(/—/)
      .map((s) => s.trim())
      .filter(Boolean),
  )

  return (
    <section
      aria-label="Clientes"
      className="relative z-content w-full bg-warm-light py-16"
    >
      <div
        className="overflow-hidden pb-2"
        style={{ maxHeight: 'clamp(290px, 30vh, 494px)' }}
      >
        <p
          aria-hidden="true"
          className="font-serif font-normal text-fg/10 text-title leading-[1.05] text-justify [text-align-last:justify]"
          style={{
            width: `calc(100vw + ${OVERFLOW})`,
            marginLeft: `calc(-${OVERFLOW} / 2)`,
          }}
        >
          {REPEATED_CLIENTS.map((c, i) => (
            <Fragment key={`${c}-${i}`}>
              <span
                className={highlightedSet.has(c) ? 'text-fg' : 'text-fg/10'}
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
