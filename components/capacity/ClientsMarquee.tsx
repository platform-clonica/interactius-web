'use client'

import { Fragment } from 'react'

import { CLIENTS } from '@/lib/data/clients'

/* ==========================================================================
   ClientsMarquee (capacity) — mismo layout que home/ClientsMarquee con
   highlight ESTÁTICO de los clientes del servicio.
   --------------------------------------------------------------------------
   · Lista completa de clientes (lib/data/clients) en una sola pasada,
     centrada, sin justify ni overflow lateral. Una línea natural-wrap.
   · Sin rotación random. Los clientes específicos de la página (parsed
     del prop `clients` en formato " — " separado) renderizan en text-fg;
     el resto en text-fg/10.
   ========================================================================== */

interface ClientsMarqueeProps {
  /** Clientes del servicio actual, separados por " — ". Se resaltan en
   *  text-fg dentro del listado completo. */
  clients: string
  /** Mantenido por compatibilidad con la API previa. Ignorado. */
  singleLine?: boolean
  /** 'normal' (py-16) — defecto, cuando hay otra sección con padding propio
   *  debajo (ej. CapacityManifiesto). 'large' (pb-section) — cuando el
   *  bloque siguiente es CapacityOthers (sin pt propio) y necesita más
   *  separación visual. */
  bottomSpacing?: 'normal' | 'large'
}

const SEPARATOR = ' — '

export function ClientsMarquee({ clients, bottomSpacing = 'normal' }: ClientsMarqueeProps) {
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
      className={`relative z-content w-full bg-warm-light pt-6 lg:pt-16 ${
        bottomSpacing === 'large' ? 'pb-20 lg:pb-[clamp(120px,15vw,200px)]' : 'pb-20 lg:pb-16'
      }`}
    >
      <div className="section-inner">
        <p
          aria-hidden="true"
          className="font-serif font-normal text-fg/10 text-[18px] lg:text-title leading-[1.2] lg:leading-[1.05] text-center [text-wrap:pretty]"
        >
          {CLIENTS.map((c, i) => (
            <Fragment key={c}>
              <span
                className={highlightedSet.has(c) ? 'text-fg' : 'text-fg/10'}
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
