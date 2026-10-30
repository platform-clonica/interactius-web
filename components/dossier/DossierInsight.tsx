import type { ReactNode } from 'react'

import { CurtainLink } from '@/components/layout/CurtainLink'

import { DossierCounter } from './DossierCounter'
import { DossierParallaxImage } from './DossierParallaxImage'
import type { IntlHref } from '@/lib/i18n/article-href'

/* DossierInsight — una clave, en formato breve.

   Martina pidió que las claves fueran más reducidas que los artículos y que
   dejaran solo la información esencial: número, rótulo, titular, un párrafo,
   tres puntos y la pregunta que abre conversación.

   El número grande en serif hace de ancla visual y numera la lectura, que es
   información real (son cuatro claves en orden), no un adorno numerado. Va en
   el color del servicio al que remite la pregunta final, igual que los
   artículos (ver `accent.ts`).

   La columna de la derecha baja a `text-micro`: es material de consulta, no
   de lectura corrida, y a tamaño de cuerpo competía con el titular.

   La imagen es opcional y cae bajo el párrafo de la columna central, que es
   donde quedaba hueco muerto en las claves sin puntos.

   Los puntos llegan ya renderizados como ReactNode desde la página, que es
   quien resuelve el <strong> del JSON con `t.rich` y `richComponents.bold`.
   Así el peso de la negrita lo sigue mandando un único sitio del proyecto. */
export function DossierInsight({
  number,
  kicker,
  title,
  body,
  pointsLabel,
  points,
  close,
  cta,
  ctaHref,
  acentoFondo,
  acentoChipTexto,
  image,
  imageAlt,
  imageCaption,
  imageRatio = 'aspect-[4/5]',
  dato,
}: {
  number: string
  kicker: string
  title: string
  body: string
  pointsLabel?: string
  points?: ReactNode[]
  close: string
  cta: string
  ctaHref: IntlHref
  /** Clase de fondo del servicio al que remite la clave. */
  acentoFondo: string
  /** Color del texto sobre ese fondo. Ver la tabla de contraste de `accent.ts`. */
  acentoChipTexto: string
  image?: string
  imageAlt?: string
  imageCaption?: string
  imageRatio?: string
  /** Cifra de apoyo que cierra la columna de la derecha, bajo los puntos. */
  dato?: { prefix?: string; figure: string; unit?: string; label: string; source: string }
}) {
  return (
    <article>
      <div className={`h-[2px] w-full ${acentoFondo}`} aria-hidden="true" />

      <div className="grid grid-cols-12 gap-x-grid-gutter gap-y-5 pt-6">
        <div className="col-span-12 flex items-baseline gap-4 lg:col-span-2 lg:flex-col lg:gap-2">
          {/* El número vive dentro de un cuadrado relleno: el acento como
              tinta no llega al contraste mínimo, como fondo sí. */}
          <span
            className={`inline-flex h-14 w-14 items-center justify-center font-serif text-subtitle font-light tabular-nums ${acentoFondo} ${acentoChipTexto}`}
          >
            {number}
          </span>
          <span className="font-mono text-caption uppercase tracking-[0.14em] text-fg/60">
            {kicker}
          </span>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <h3 className="font-serif text-title-sm font-light text-fg">{title}</h3>
          <p className="mt-4 font-mono text-body-sm leading-[1.6] text-fg/70">{body}</p>

          {image ? (
            <figure className="mt-7">
              <DossierParallaxImage
                src={image}
                alt={imageAlt ?? ''}
                sizes="(max-width: 900px) 100vw, 40vw"
                ratio={imageRatio}
                className="border border-fg/15"
              />
              {imageCaption ? (
                <figcaption className="mt-3 font-mono text-micro leading-[1.5] text-fg/50">
                  {imageCaption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}
        </div>

        <div className="col-span-12 lg:col-span-4 lg:col-start-9">
          {points?.length ? (
            <>
              {pointsLabel ? (
                <p className="font-mono text-caption uppercase tracking-[0.14em] text-fg/50">
                  {pointsLabel}
                </p>
              ) : null}
              <ul className={`flex flex-col gap-3 ${pointsLabel ? 'mt-3' : ''}`}>
                {points.map((p, i) => (
                  <li
                    key={i}
                    className="border-l border-fg/25 pl-4 font-mono text-micro leading-[1.6] text-fg"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {/* El dato de apoyo va justo bajo los puntos, separado por un
              filete: cierra el argumento con una cifra antes de pasar al
              texto de conclusión. */}
          {dato ? (
            <div className="mt-6 border-t border-fg/25 pt-5">
              <p className="flex items-baseline gap-2 font-serif font-light text-fg">
                {dato.prefix ? (
                  <span className="font-mono text-caption uppercase tracking-[0.14em] text-fg/50">
                    {dato.prefix}
                  </span>
                ) : null}
                <DossierCounter value={dato.figure} className="text-title tabular-nums" />
                {dato.unit ? <span className="text-title-sm text-fg/60">{dato.unit}</span> : null}
              </p>
              <p className="mt-2 font-mono text-micro leading-[1.6] text-fg/70">{dato.label}</p>
              <p className="mt-2 font-mono text-caption uppercase tracking-[0.14em] text-fg/40">
                {dato.source}
              </p>
            </div>
          ) : null}

          <p
            className={`font-mono text-micro leading-[1.6] text-fg/70 ${points?.length || dato ? 'mt-5' : ''}`}
          >
            {close}
          </p>

          <CurtainLink
            href={ctaHref}
            className="hover-wipe-underline mt-5 inline-flex w-fit font-mono text-caption uppercase tracking-[0.14em] text-fg"
          >
            {cta}
          </CurtainLink>
        </div>
      </div>
    </article>
  )
}
