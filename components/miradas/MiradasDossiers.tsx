import { getTranslations } from 'next-intl/server'

import { CurtainLink } from '@/components/layout/CurtainLink'
import type { Locale } from '@/lib/i18n/config'

/* MiradasDossiers — la banda de dossiers, bajo el titular de Miradas.

   Un dossier no es un artículo: recopila en una página lo publicado sobre un
   tema en varios canales. Por eso va separado de la rejilla de posts, entre
   dos filetes y antes de las categorías, para que se lea como otra cosa y no
   como el primer artículo de la lista.

   Los que aún no existen se anuncian igual, con su estado en vez de su
   enlace. Anunciar lo que viene es parte de lo que hace creíble la serie:
   dice que hay un plan, no una pieza suelta. Esos no son enlaces ni tienen
   `hover`, para que nadie los pulse esperando que pase algo.

   Los títulos van a `text-title-sm` y no a tamaño de artículo: la banda tiene
   que pesar menos que el gran "Miradas" que lleva encima y más que las fichas
   que lleva debajo. */

interface Dossier {
  id: string
  title: string
  summary: string
  cta?: string
  soon?: string
}

/* Los dossiers publicados y su ruta. Lo que no está aquí se pinta como
   próximo, aunque tenga texto en el JSON. Así no hay forma de enlazar por
   error a una página que todavía no existe. */
const RUTAS: Record<string, '/miradas/comercio-agentico'> = {
  'comercio-agentico': '/miradas/comercio-agentico',
}

export async function MiradasDossiers({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'miradas' })
  const items = t.raw('dossiers.items') as Dossier[]
  if (!items?.length) return null

  return (
    <section className="section-inner pb-section">
      <div className="grid grid-cols-12 gap-x-grid-gutter">
        <div className="col-span-12 lg:col-start-2 lg:col-span-11">
          <div className="flex flex-col gap-2 border-t border-fg/25 pt-3 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="font-mono text-caption uppercase tracking-[0.2em] text-fg">
              {t('dossiers.label')}
            </span>
            <span className="max-w-[46ch] font-mono text-caption text-fg/50">
              {t('dossiers.intro')}
            </span>
          </div>

          <ul className="mt-8 grid grid-cols-12 gap-x-grid-gutter gap-y-10">
            {items.map((d) => {
              const href = RUTAS[d.id]
              const disponible = Boolean(href)

              return (
                <li key={d.id} className="col-span-12 lg:col-span-6">
                  <article
                    className={`flex h-full flex-col border-t-2 pt-5 ${
                      disponible ? 'border-fg' : 'border-fg/20'
                    }`}
                  >
                    <h3
                      className={`font-serif text-title-sm font-light ${
                        disponible ? 'text-fg' : 'text-fg/40'
                      }`}
                    >
                      {disponible ? (
                        <CurtainLink href={href} className="hover-wipe-underline">
                          {d.title}
                        </CurtainLink>
                      ) : (
                        d.title
                      )}
                    </h3>

                    {d.summary ? (
                      <p className="mt-4 max-w-[52ch] font-mono text-micro leading-[1.6] text-fg/70">
                        {d.summary}
                      </p>
                    ) : null}

                    {disponible ? (
                      <CurtainLink
                        href={href}
                        className="hover-wipe-underline mt-auto inline-flex w-fit pt-6 font-mono text-caption uppercase tracking-[0.14em] text-fg"
                      >
                        {d.cta}
                      </CurtainLink>
                    ) : (
                      <p className="mt-auto pt-6 font-mono text-caption uppercase tracking-[0.14em] text-fg/40">
                        {d.soon}
                      </p>
                    )}
                  </article>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
