import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { buildPageMetadata, SITE_CONFIG } from '@/lib/seo/metadata.config'
import { formatDate } from '@/lib/i18n/formatDate'
import { localizedPath, getAlternates } from '@/lib/i18n/navigation'
import { CurtainLink } from '@/components/layout/CurtainLink'
import { type Locale, LOCALES } from '@/lib/i18n/config'
import {
  getMiradaBySlug,
  getAllMiradas,
  getNextArticle,
  calculateReadingTime,
} from '@/lib/content/miradas'
import { MDXContent } from '@/components/miradas/MDXContent'
import { ShareRow } from '@/components/miradas/article/ShareRow'
import { ArticleNext } from '@/components/miradas/article/ArticleNext'
import { AuthorAvatar } from '@/components/miradas/AuthorAvatar'
import { Breadcrumb, absoluteUrl as toAbsoluteUrl } from '@/components/miradas/Breadcrumb'
import {
  delocalizeSubSlug,
  localizeSubSlug,
  localizeParentSlug,
  parseParentOrSubSlugAnyLocale,
  SUB_DISPLAY,
  PARENT_DISPLAY,
} from '@/lib/miradas/i18n-routing'
import { SUB_TO_PARENT } from '@/lib/miradas/frontmatter.schema'
import type { MiradasSubcategory } from '@/lib/miradas/frontmatter.schema'
import { parentListingHref, subListingHref } from '@/lib/i18n/article-href'

interface PageProps {
  params: Promise<{ locale: Locale; parentOrSub: string; slug: string }>
}

export async function generateStaticParams() {
  // Para cada artículo, generamos las 3 versiones (parentOrSub × locale).
  // Next.js intersecta con [locale]; cada locale recibe sus combinaciones
  // válidas. Las inválidas las maneja notFound() en runtime.
  const articles = getAllMiradas()
  const params: { parentOrSub: string; slug: string }[] = []
  for (const article of articles) {
    for (const locale of LOCALES) {
      params.push({
        parentOrSub: localizeSubSlug(article.category as MiradasSubcategory, locale),
        slug: article.slug,
      })
    }
  }
  // Dedupe por (parentOrSub, slug)
  const map = new Map<string, { parentOrSub: string; slug: string }>()
  for (const p of params) map.set(`${p.parentOrSub}/${p.slug}`, p)
  return [...map.values()]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, parentOrSub, slug } = await params
  const sub = delocalizeSubSlug(parentOrSub, locale)
  if (!sub) return {}
  const article = getMiradaBySlug(sub, slug)
  if (!article) return {}

  // Construir alternates manualmente porque el slug del segmento parentOrSub
  // varía por locale.
  const alternates: Record<string, string> = {}
  for (const loc of LOCALES) {
    const localized = localizeSubSlug(sub, loc)
    alternates[loc] = `${SITE_CONFIG.baseUrl}${localizedPath(
      '/miradas/[parentOrSub]/[slug]',
      loc,
      { params: { parentOrSub: localized, slug } },
    )}`
  }
  alternates['x-default'] = alternates.es

  return buildPageMetadata({
    locale,
    routeId: '/miradas/[parentOrSub]/[slug]',
    title: article.title,
    description: article.description,
    pathname: localizedPath('/miradas/[parentOrSub]/[slug]', locale, {
      params: { parentOrSub, slug },
    }),
    alternates,
    ogImage: {
      url: getCover(article.slug, article.image),
      width: 1200,
      height: 630,
      alt: article.title,
    },
    type: 'article',
    article: {
      publishedTime: article.publishedAt,
      modifiedTime: article.modifiedAt,
      author: article.author,
      section: SUB_DISPLAY[locale][sub],
      tags: article.tags,
    },
  })
}

const PLACEHOLDER_COVERS = Array.from(
  { length: 10 },
  (_, i) => `/miradas/placeholder-${String(i + 1).padStart(2, '0')}.jpg`,
)

function getCover(slug: string, cover?: string): string {
  if (cover) return cover
  let h = 0
  for (let i = 0; i < slug.length; i++) h = ((h << 5) - h + slug.charCodeAt(i)) | 0
  return PLACEHOLDER_COVERS[Math.abs(h) % PLACEHOLDER_COVERS.length]
}

export default async function ArticlePage({ params }: PageProps) {
  const { locale, parentOrSub, slug } = await params
  const sub = delocalizeSubSlug(parentOrSub, locale)
  if (!sub) {
    // Auto-cura URL cruzada locale × slug. Si el segmento es una sub
    // válida en OTRA locale, redirigimos al canónico de la locale actual
    // preservando el slug del artículo (que es invariante ES).
    const crossLocale = parseParentOrSubSlugAnyLocale(parentOrSub)
    if (
      crossLocale &&
      crossLocale.kind === 'sub' &&
      crossLocale.foundInLocale !== locale
    ) {
      const canonicalSub = localizeSubSlug(crossLocale.canonical, locale)
      permanentRedirect(
        localizedPath('/miradas/[parentOrSub]/[slug]', locale, {
          params: { parentOrSub: canonicalSub, slug },
        }),
      )
    }
    notFound()
  }

  const article = getMiradaBySlug(sub, slug)
  if (!article) notFound()

  const parent = SUB_TO_PARENT[sub]
  const t = await getTranslations({ locale, namespace: 'miradas' })
  const readingTime = calculateReadingTime(article.content)
  const next = getNextArticle(sub, slug)
  const absoluteUrl = `${SITE_CONFIG.baseUrl}${localizedPath(
    '/miradas/[parentOrSub]/[slug]',
    locale,
    { params: { parentOrSub, slug } },
  )}`

  const tags = article.tags ?? []
  const labelForTag = (tag: string): string => {
    const key = `grid.categories.${tag}` as Parameters<typeof t>[0]
    if (t.has(key)) return t(key)
    return tag.replace(/-/g, ' ')
  }

  const parentLabel = PARENT_DISPLAY[locale][parent]
  const subLabel = SUB_DISPLAY[locale][sub]

  // JSON-LD Article schema con articleSection y breadcrumb 4 niveles.
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.modifiedAt ?? article.publishedAt,
    author: { '@type': 'Person', name: article.author },
    articleSection: subLabel,
    isPartOf: {
      '@type': 'CollectionPage',
      name: subLabel,
      url: `${SITE_CONFIG.baseUrl}${localizedPath('/miradas/[parentOrSub]', locale, {
        params: { parentOrSub: localizeSubSlug(sub, locale) },
      })}`,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl },
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Miradas',
        item: `${SITE_CONFIG.baseUrl}${localizedPath('/miradas', locale)}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: parentLabel,
        item: `${SITE_CONFIG.baseUrl}${localizedPath('/miradas/[parentOrSub]', locale, {
          params: { parentOrSub: localizeParentSlug(parent, locale) },
        })}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: subLabel,
        item: `${SITE_CONFIG.baseUrl}${localizedPath('/miradas/[parentOrSub]', locale, {
          params: { parentOrSub: localizeSubSlug(sub, locale) },
        })}`,
      },
      { '@type': 'ListItem', position: 4, name: article.title },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Hero — cover + título + breadcrumb 4 niveles */}
      <section className="section-inner" aria-label="Cabecera del artículo">
        <div className="grid grid-cols-12 gap-grid-gutter">
          {/* Hero image — full-width edge-to-edge en mobile/iPad portrait,
              col-start-2 col-span-11 con bleed-right (grid-margin) en lg+.
              Altura reducida bajo lg para no comer espacio antes del
              contenido del artículo. */}
          <div className="col-span-12 lg:col-start-2 lg:col-span-11 min-[1920px]:col-start-1 min-[1920px]:col-span-12 min-[1920px]:w-full min-[1920px]:max-w-[1280px] min-[1920px]:justify-self-center lg:row-start-1 relative">
            <div
              className="relative overflow-hidden
                         -mx-[var(--grid-margin)] lg:mx-0
                         lg:w-[calc(100%+var(--grid-margin))]
                         min-[1920px]:w-full
                         h-[clamp(180px,32vh,300px)]
                         lg:h-[clamp(320px,56vh,640px)]"
            >
              <Image
                src={getCover(article.slug, article.image)}
                alt={article.title}
                fill
                priority
                sizes="(min-width: 1024px) 86vw, 100vw"
                className="object-cover"
              />
              {/* Overlay inferior — flex column en bottom-0 del wrapper:
                  · Grupo autor (avatar arriba, label justo debajo) left-aligned.
                  · Strip blanco con el título debajo del grupo.
                  El grupo autor "reposa" sobre el strip blanco (mb-3 = 12px
                  de aire) y el strip queda anclado al borde inferior real
                  de la imagen. En lg+ el grupo autor mobile queda oculto y
                  el bloque desktop (en su columna propia) controla autor +
                  label. */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col">
                <div className="lg:hidden ml-[var(--grid-margin)] w-fit flex flex-col items-start">
                  <AuthorAvatar author={article.author} size="sm" />
                  <span className="inline-flex bg-pure-white px-1.5 py-0.5 font-mono text-card-sm text-fg whitespace-nowrap">
                    {article.author}, {formatDate(article.publishedAt, locale)}
                  </span>
                </div>
                <div className="w-full lg:w-1/2 bg-pure-white p-5 lg:p-6 flex items-center min-h-[88px]">
                  <h1 className="font-serif font-light text-subtitle text-fg leading-tight">
                    {article.title}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Author desktop — al pasar a min-[1920px]+, el bloque adopta la
              misma geometría que la imagen hero (col-span-12 + w-full +
              max-w-1280 + justify-self-center) y los hijos absolutes se
              flippean de `left:0` a `right:0` para que avatar y label se
              alineen con el borde derecho del width capeado de la imagen.
              Por debajo de 1920 mantiene el comportamiento original
              (col-start-10 col-span-3, left-0). */}
          <div className="hidden lg:block lg:col-start-10 lg:col-span-3 min-[1920px]:col-start-1 min-[1920px]:col-span-12 min-[1920px]:w-full min-[1920px]:max-w-[1280px] min-[1920px]:justify-self-center lg:row-start-1 relative pointer-events-none">
            <div className="absolute left-0 bottom-0 min-[1920px]:left-auto min-[1920px]:right-0 pointer-events-auto">
              <AuthorAvatar author={article.author} size="lg" />
            </div>
            <div className="absolute left-0 top-full min-[1920px]:left-auto min-[1920px]:right-0 pointer-events-auto">
              <span className="block bg-pure-white px-1.5 py-1 font-mono text-card-sm text-fg whitespace-nowrap leading-none">
                {article.author}, {formatDate(article.publishedAt, locale)}
              </span>
            </div>
          </div>

          {/* Author mobile — movido como overlay dentro del hero image
              (encima del strip blanco). Eliminado de su antigua posición
              debajo de la imagen para no duplicar. */}

          {/* Breadcrumb 4 niveles — usa componente compartido */}
          <div className="col-span-12 lg:col-start-2 lg:col-span-10 min-[1920px]:col-start-1 min-[1920px]:col-span-12 min-[1920px]:w-full min-[1920px]:max-w-[1280px] min-[1920px]:justify-self-center mt-6">
            <Breadcrumb
              withJsonLd={false}
              items={[
                {
                  label: 'Miradas',
                  href: '/miradas',
                  absoluteUrl: toAbsoluteUrl(localizedPath('/miradas', locale)),
                },
                {
                  label: parentLabel,
                  href: parentListingHref(parent, locale),
                  absoluteUrl: toAbsoluteUrl(
                    localizedPath('/miradas/[parentOrSub]', locale, {
                      params: { parentOrSub: localizeParentSlug(parent, locale) },
                    }),
                  ),
                },
                {
                  label: subLabel,
                  href: subListingHref(sub, locale),
                  absoluteUrl: toAbsoluteUrl(
                    localizedPath('/miradas/[parentOrSub]', locale, {
                      params: { parentOrSub: localizeSubSlug(sub, locale) },
                    }),
                  ),
                },
                // Título del artículo eliminado del breadcrumb visual: ya
                // está como h1 del hero, repetirlo (sobre todo largo) infla
                // el espacio antes del contenido. El JSON-LD breadcrumb
                // (schema.org) sí incluye el título por SEO.
              ]}
            />
          </div>
        </div>

        {/* Fila superior — replica la estructura de ShareRow (border-y,
            minutos de lectura a la izquierda) pero con los tags a la
            derecha en lugar de los social links. La share social vive
            ahora solo al final del artículo (segunda ShareRow tras MDX). */}
        <div className="mt-10 lg:mt-12 grid grid-cols-12 gap-grid-gutter">
          <div className="col-span-12 lg:col-start-2 lg:col-span-10 min-[1920px]:col-start-1 min-[1920px]:col-span-12 min-[1920px]:w-full min-[1920px]:max-w-[1280px] min-[1920px]:justify-self-center">
            <div className="border-y border-fg/20 py-6 flex flex-wrap items-center justify-between gap-x-10 gap-y-3 font-mono text-body-sm text-fg">
              <span>{readingTime} {t('article.minRead')}</span>
              <div className="flex flex-wrap items-center gap-x-[10px] gap-y-[10px]">
                {tags.map((tag, i) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center px-1.5 py-0.5 font-mono text-label text-fg ${
                      i === 0 ? 'bg-warm-dark' : 'bg-pure-white'
                    }`}
                  >
                    {labelForTag(tag)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <article className="section-inner pt-16 lg:pt-20 pb-section" aria-label={article.title}>
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-span-12 lg:col-start-2 lg:col-span-10 min-[1920px]:col-start-1 min-[1920px]:col-span-12 min-[1920px]:w-full min-[1920px]:max-w-[1280px] min-[1920px]:justify-self-center">
            <p className="font-serif font-normal text-fg text-title-sm leading-tight tracking-[-0.01em]">
              {article.description}
            </p>
          </div>

          <div className="col-span-12 lg:col-start-2 lg:col-span-10 min-[1920px]:col-start-1 min-[1920px]:col-span-12 min-[1920px]:w-full min-[1920px]:max-w-[1280px] min-[1920px]:justify-self-center mt-12 lg:mt-16">
            <MDXContent source={article.content} />
          </div>
        </div>
      </article>

      <section className="section-inner pb-section" aria-label={t('article.continueReading')}>
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-span-12 lg:col-start-2 lg:col-span-10 min-[1920px]:col-start-1 min-[1920px]:col-span-12 min-[1920px]:w-full min-[1920px]:max-w-[1280px] min-[1920px]:justify-self-center">
            <ShareRow
              title={article.title}
              url={absoluteUrl}
              backLink={{ href: '/miradas', label: t('article.backToListing') }}
            />
          </div>
        </div>
      </section>

      {next && (
        <section className="w-full" aria-label={t('article.next')}>
          <ArticleNext article={next} locale={locale} />
        </section>
      )}
    </>
  )
}
