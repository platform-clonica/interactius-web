import Image from 'next/image'

/* ==========================================================================
   ClientsMarquee (capacity / servicios) — logos de clientes del servicio.
   --------------------------------------------------------------------------
   Sustituye la versión en TEXTO (lista completa con highlight estático de los
   clientes del servicio) por la imagen de logos correspondiente al servicio
   (logos-customers/logos-serv1|2|3.png), que se pasa vía `logoSrc`.
   La versión anterior queda COMENTADA al final por si hubiera que recuperarla.
   ========================================================================== */

interface ClientsMarqueeProps {
  /** Clientes del servicio (formato " — "). Usado por la versión texto
   *  comentada; se mantiene en la API porque las páginas lo siguen pasando. */
  clients: string
  /** Imagen de logos del servicio (p.ej. /logos-customers/logos-serv1.png). */
  logoSrc: string
  /** Dimensiones intrínsecas de la imagen para el aspect-ratio de next/image. */
  logoWidth: number
  logoHeight: number
  /** Mantenido por compatibilidad con la API previa. Ignorado. */
  singleLine?: boolean
  /** 'normal' (py-16) — defecto. 'large' (pb-section) — cuando el bloque
   *  siguiente es CapacityOthers y necesita más separación visual. */
  bottomSpacing?: 'normal' | 'large'
}

export function ClientsMarquee({
  logoSrc,
  logoWidth,
  logoHeight,
  bottomSpacing = 'normal',
}: ClientsMarqueeProps) {
  return (
    <section
      aria-label="Clientes"
      className={`relative z-content w-full bg-warm-light pt-6 lg:pt-16 ${
        bottomSpacing === 'large' ? 'pb-20 lg:pb-[clamp(120px,15vw,200px)]' : 'pb-20 lg:pb-16'
      }`}
    >
      <div className="section-inner">
        {/* Desktop (≥lg): tira completa en una línea */}
        <div className="hidden lg:block">
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image
            src={logoSrc}
            alt=""
            width={logoWidth}
            height={logoHeight}
            sizes="(min-width: 1440px) 1440px, 100vw"
            className="mx-auto h-auto w-full"
          />
        </div>

        {/* Móvil (<lg): tira partida en DOS mitades apiladas para que los logos
            no queden tan pequeños. Truco con imagen única: cada fila es un
            contenedor overflow-hidden con la misma imagen a width:200%; la 2ª
            fila se desplaza -50% (de su propio ancho) para mostrar la mitad
            derecha. Asume reparto uniforme de logos (corte limpio al 50%).
            Apaño hasta tener los logos sueltos. */}
        <div className="flex flex-col gap-8 lg:hidden">
          <div className="overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="" aria-hidden="true" className="block h-auto w-[200%] max-w-none" />
          </div>
          <div className="overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="" aria-hidden="true" className="block h-auto w-[200%] max-w-none -translate-x-1/2" />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ==========================================================================
   VERSIÓN ANTERIOR (texto: lista completa con highlight estático) — comentada
   por si hay que volver a ella. Sustituida por la imagen de logos arriba.
   --------------------------------------------------------------------------

'use client'

import { Fragment } from 'react'

import { CLIENTS } from '@/lib/data/clients'

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

   ========================================================================== */
