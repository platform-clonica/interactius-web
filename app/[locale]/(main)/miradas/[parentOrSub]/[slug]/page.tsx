import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
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
  if (!sub) notFound()

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
          <div className="col-start-2 col-span-11 lg:col-start-2 lg:col-span-11 lg:row-start-1 relative">
            <div
              className="relative overflow-hidden"
              style={{
                width: 'calc(100% + var(--grid-margin))',
                height: 'clamp(320px, 56vh, 640px)',
              }}
            >
              <Image
                src={getCover(article.slug, article.image)}
                alt={article.title}
                fill
                priority
                sizes="(min-width: 1024px) 86vw, 100vw"
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 w-full lg:w-1/2 bg-pure-white p-5 lg:p-6 flex items-center min-h-[88px]">
                <h1 className="font-serif font-light text-subtitle text-fg leading-tight">
                  {article.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Author desktop */}
          <div className="hidden lg:block lg:col-start-10 lg:col-span-3 lg:row-start-1 relative pointer-events-none">
            <div className="absolute left-0 bottom-0 pointer-events-auto">
              <AuthorAvatar author={article.author} size="lg" />
            </div>
            <div className="absolute left-0 top-full pointer-events-auto">
              <span className="block bg-pure-white px-1.5 py-1 font-mono text-card-sm text-fg whitespace-nowrap leading-none">
                {article.author}, {formatDate(article.publishedAt, locale)}
              </span>
            </div>
          </div>

          {/* Author mobile */}
          <div className="col-span-12 lg:hidden mt-6 flex items-center gap-3">
            <AuthorAvatar author={article.author} size="sm" />
            <span className="inline-flex bg-pure-white px-1.5 py-0.5 font-mono text-card-sm text-fg whitespace-nowrap">
              {article.author}, {formatDate(article.publishedAt, locale)}
            </span>
          </div>

          {/* Breadcrumb 4 niveles — usa componente compartido */}
          <div className="col-start-2 col-span-11 lg:col-start-2 lg:col-span-10 mt-6">
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
                { label: article.title },
              ]}
            />
          </div>
        </div>

        <div className="mt-10 lg:mt-12 grid grid-cols-12 gap-grid-gutter">
          <div className="col-start-2 col-span-11 lg:col-start-2 lg:col-span-10">
            <ShareRow
              title={article.title}
              url={absoluteUrl}
              readingTimeMinutes={readingTime}
            />
          </div>
        </div>
      </section>

      <article className="section-inner pt-16 lg:pt-20 pb-section" aria-label={article.title}>
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-start-2 col-span-11 lg:col-start-2 lg:col-span-10 min-h-[26px] flex flex-wrap gap-x-2.5 gap-y-2.5">
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

          <div className="col-start-2 col-span-11 lg:col-start-2 lg:col-span-10 mt-8 lg:mt-12">
            <p className="font-serif font-normal text-fg text-title-sm leading-tight tracking-[-0.01em]">
              {article.description}
            </p>
          </div>

          <div className="col-start-2 col-span-11 lg:col-start-2 lg:col-span-10 mt-12 lg:mt-16">
            <MDXContent source={article.content} />
          </div>
        </div>
      </article>

      <section className="section-inner pb-section" aria-label={t('article.continueReading')}>
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-start-2 col-span-11 lg:col-start-2 lg:col-span-10">
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
