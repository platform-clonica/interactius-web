import { CurtainLink } from '@/components/layout/CurtainLink'

import { DossierSection } from './DossierSection'
import type { IntlHref } from '@/lib/i18n/article-href'

/* DossierClose — el pie del dossier: una afirmación y una puerta.

   El titular va en serif grande y a media caja para que el ojo pare aquí
   después de un recorrido largo de texto a varias columnas. */
export function DossierClose({
  title,
  body,
  cta,
  href,
}: {
  title: string
  body: string
  cta: string
  href: IntlHref
}) {
  return (
    <DossierSection className="pb-section-md pt-section-md lg:pb-section lg:pt-section">
      <div className="grid grid-cols-12 gap-x-grid-gutter gap-y-6 border-t-2 border-fg pt-10">
        <h2 className="col-span-12 font-serif text-title font-light text-fg lg:col-span-6">
          {title}
        </h2>

        <div className="col-span-12 lg:col-span-5 lg:col-start-8">
          <p className="font-mono text-body-sm leading-[1.6] text-fg/70">{body}</p>
          <CurtainLink
            href={href}
            className="hover-wipe-underline mt-6 inline-flex w-fit font-mono text-title-mono text-fg"
          >
            {cta}
          </CurtainLink>
        </div>
      </div>
    </DossierSection>
  )
}
