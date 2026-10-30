import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { DossierMasthead } from '@/components/dossier/DossierMasthead'
import { DossierArticle } from '@/components/dossier/DossierArticle'
import { DossierData } from '@/components/dossier/DossierData'
import { DossierInsight } from '@/components/dossier/DossierInsight'
import { DossierAside } from '@/components/dossier/DossierAside'
import { DossierClose } from '@/components/dossier/DossierClose'
import { DossierRule } from '@/components/dossier/DossierRule'
import { getMiradaBySlug } from '@/lib/content/miradas'
import type { MiradasSubcategory } from '@/lib/content/miradas'
import { articleHref } from '@/lib/i18n/article-href'
import { richComponents } from '@/lib/i18n/rich-text'
import { buildPageMetadata } from '@/lib/seo/metadata.config'
import { getAlternates, localizedPath } from '@/lib/i18n/navigation'
import { type Locale } from '@/lib/i18n/config'

/* Dossier de comercio agéntico.

   Recopila en una sola página lo que Interactius ha publicado sobre el tema
   en sus distintos canales: tres artículos de Miradas, cuatro claves que
   venían de la newsletter y una recomendación.

   Los artículos NO se copian aquí. Se leen de `content/miradas/` con
   `getMiradaBySlug`, así que el titular, la foto, la autora y la URL salen
   siempre del MDX. Si alguien edita un artículo, el dossier se entera. Lo
   único que vive en el JSON de la landing es la entradilla editorial que
   presenta cada pieza dentro de este contexto, que no existe en el artículo.

   El layout imita un diario: mancheta, apertura a todo el ancho, banda de
   datos en negativo, dos columnas con tratamientos distintos (una con foto y
   otra sin), claves numeradas y un recuadro de recomendación. */

const RUTA = '/comercio-agentico'

/* Los tres artículos del dossier, en orden de portada. `sub` y `slug` son las
   coordenadas canónicas del MDX, no de la URL: el helper localiza la URL. */
const PIEZAS = [
  { id: 'ax', sub: 'futuros', slug: 'ecommerce-agentico-ax-fin-de-la-interfaz-tradicional' },
  { id: 'prospectiva', sub: 'futuros', slug: 'prospectiva-estrategica-prepararse-para-la-era-agentica' },
  { id: 'criterio', sub: 'diseno-ux-ui', slug: 'de-disenar-pdps-a-disenar-criterio-era-agentica' },
] as const

const CLAVES = ['accesibilidad', 'cero-clics', 'invisibilidad', 'adopcion'] as const

interface PageProps {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'agentico' })
  return buildPageMetadata({
    locale,
    routeId: RUTA,
    pathname: localizedPath(RUTA, locale),
    alternates: getAlternates(RUTA),
    title: t('meta.title'),
    description: t('meta.description'),
  })
}

export default async function ComercioAgentico({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'agentico' })

  /* Se resuelven las tres piezas contra el contenido real. Si alguna faltara
     (un slug renombrado, por ejemplo), se cae de la lista en vez de romper la
     página entera. */
  const piezas = PIEZAS.map((p) => {
    const art = getMiradaBySlug(p.sub, p.slug, locale)
    if (!art) return null
    return {
      id: p.id,
      titulo: art.titleByLocale[locale],
      autora: art.author,
      imagen: art.image,
      href: articleHref(p.sub as MiradasSubcategory, art.slugByLocale[locale], locale),
    }
  }).filter((p): p is NonNullable<typeof p> => p !== null)

  const apertura = piezas.find((p) => p.id === 'ax')
  const columnas = piezas.filter((p) => p.id !== 'ax')

  const datos = t.raw('data.items') as { figure: string; label: string; source: string }[]
  const contacto = { pathname: '/contacto' as const }

  return (
    <>
      <DossierMasthead
        eyebrow={t('masthead.eyebrow')}
        title={t('masthead.title')}
        edition={t('masthead.edition')}
        contents={t('masthead.contents')}
        standfirst={t.rich('masthead.standfirst', richComponents.bold)}
        summary={t('masthead.summary')}
      />

      {apertura ? (
        <div className="section-inner mt-14 lg:mt-20">
          <DossierRule label={t('sections.opening')} />
          <div className="mt-8">
            <DossierArticle
              variant="lead"
              kicker={t('articles.ax.kicker')}
              title={apertura.titulo}
              author={apertura.autora}
              byLabel={t('by')}
              standfirst={t('articles.ax.standfirst')}
              body={t('articles.ax.body')}
              href={apertura.href}
              readLabel={t('read')}
              image={apertura.imagen}
              imageAlt=""
            />
          </div>
        </div>
      ) : null}

      <div className="mt-section-md lg:mt-section">
        <DossierData
          eyebrow={t('data.eyebrow')}
          title={t('data.title')}
          intro={t('data.intro')}
          items={datos}
          precedent={{
            title: t('data.precedent.title'),
            body: t('data.precedent.body'),
            fromLabel: t('data.precedent.fromLabel'),
            fromValue: t('data.precedent.fromValue'),
            toLabel: t('data.precedent.toLabel'),
            toValue: t('data.precedent.toValue'),
          }}
          note={t('data.note')}
        />
      </div>

      {/* Las dos columnas del cuerpo. La primera va sin foto y la segunda con
          ella: mismo componente, tratamiento distinto, que es lo que evita
          que la página se lea como una rejilla de fichas iguales. */}
      {columnas.length ? (
        <div className="section-inner mt-section-md lg:mt-section">
          <DossierRule label={t('sections.analysis')} />
          <div className="mt-8 grid grid-cols-12 gap-x-grid-gutter gap-y-14">
            {columnas.map((c, i) => (
              <div key={c.id} className="col-span-12 lg:col-span-6">
                <DossierArticle
                  variant="column"
                  kicker={t(`articles.${c.id}.kicker`)}
                  title={c.titulo}
                  author={c.autora}
                  byLabel={t('by')}
                  standfirst={t(`articles.${c.id}.standfirst`)}
                  body={t(`articles.${c.id}.body`)}
                  href={c.href}
                  readLabel={t('read')}
                  image={i === 0 ? undefined : c.imagen}
                  imageAlt=""
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="section-inner mt-section-md lg:mt-section">
        <DossierRule label={t('sections.insights')} />
        <div className="mt-8 flex flex-col gap-12">
          {CLAVES.map((k) => {
            const puntos = t.has(`insights.${k}.points`)
              ? (t.raw(`insights.${k}.points`) as string[])
              : undefined
            return (
              <DossierInsight
                key={k}
                number={t(`insights.${k}.number`)}
                kicker={t(`insights.${k}.kicker`)}
                title={t(`insights.${k}.title`)}
                body={t(`insights.${k}.body`)}
                pointsLabel={
                  t.has(`insights.${k}.pointsLabel`) ? t(`insights.${k}.pointsLabel`) : undefined
                }
                points={puntos?.map((_, i) =>
                  t.rich(`insights.${k}.points.${i}`, richComponents.bold),
                )}
                close={t(`insights.${k}.close`)}
                cta={t(`insights.${k}.cta`)}
                ctaHref={contacto}
              />
            )
          })}
        </div>
      </div>

      <div className="section-inner mt-section-md lg:mt-section">
        <DossierRule label={t('sections.recommends')} />
        <div className="mt-8 grid grid-cols-12 gap-x-grid-gutter">
          <div className="col-span-12 lg:col-span-7 lg:col-start-6">
            <DossierAside
              by={t('recommends.by')}
              format={t('recommends.format')}
              title={t('recommends.title')}
              body={t('recommends.body')}
              cta={t('recommends.cta')}
              href="https://www.ivoox.com/hf-96-8211-socialismo-del-futuro-post-capitalismo-de-audios-mp3_rf_95600291_1.html"
            />
          </div>
        </div>
      </div>

      <DossierClose
        title={t('close.title')}
        body={t('close.body')}
        cta={t('close.cta')}
        href={contacto}
      />
    </>
  )
}
