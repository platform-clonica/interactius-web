import type { ReactNode } from 'react'

import { CurtainLink } from '@/components/layout/CurtainLink'
import type { IntlHref } from '@/lib/i18n/article-href'

/* DossierInsight — una clave, en formato breve.

   Martina pidió que los insights fueran más reducidos que los artículos y
   que dejaran solo la información esencial. Por eso aquí no hay foto ni
   entradilla larga: número, rótulo, titular, un párrafo, tres puntos y la
   pregunta que abre conversación.

   El número grande en serif hace de ancla visual y numera la lectura, que es
   información real (son cuatro claves en orden), no un adorno numerado.

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
}) {
  return (
    <article className="grid grid-cols-12 gap-x-grid-gutter gap-y-5 border-t border-fg/25 pt-6">
      <div className="col-span-12 flex items-baseline gap-4 lg:col-span-2 lg:flex-col lg:gap-2">
        <span className="font-serif text-title font-light tabular-nums text-fg/30">{number}</span>
        <span className="font-mono text-caption uppercase tracking-[0.14em] text-fg/60">
          {kicker}
        </span>
      </div>

      <div className="col-span-12 lg:col-span-5">
        <h3 className="font-serif text-title-sm font-light text-fg">{title}</h3>
        <p className="mt-4 font-mono text-body-sm leading-[1.6] text-fg/70">{body}</p>
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
                  className="border-l border-fg/25 pl-4 font-mono text-body-sm leading-[1.6] text-fg"
                >
                  {p}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <p
          className={`font-mono text-body-sm leading-[1.6] text-fg/70 ${points?.length ? 'mt-5' : ''}`}
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
    </article>
  )
}
