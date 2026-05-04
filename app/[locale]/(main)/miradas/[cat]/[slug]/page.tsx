import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import { buildPageMetadata, SITE_CONFIG } from '@/lib/seo/metadata.config'
import { localizedPath, getAlternates } from '@/lib/i18n/navigation'
import { CurtainLink } from '@/components/layout/CurtainLink'
import { type Locale } from '@/lib/i18n/config'
import {
  getMiradaBySlug,
  getAllSlugs,
  getNextArticle,
  calculateReadingTime,
} from '@/lib/content/miradas'
import { MDXContent } from '@/components/miradas/MDXContent'
import { ShareRow } from '@/components/miradas/article/ShareRow'
import { ArticleNext } from '@/components/miradas/article/ArticleNext'
import { AuthorAvatar } from '@/components/miradas/AuthorAvatar'

interface PageProps {
  params: Promise<{ locale: Locale; cat: string; slug: string }>
}

export async function generateStaticParams() {
  return getAllSlugs()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, cat, slug } = await params
  const article = getMiradaBySlug(cat, slug)
  if (!article) return {}

  return buildPageMetadata({
    locale,
    routeId: '/miradas/[cat]/[slug]',
    title: article.title,
    description: article.description,
    pathname: localizedPath('/miradas/[cat]/[slug]', locale, { params: { cat, slug } }),
    alternates: getAlternates('/miradas/[cat]/[slug]', { params: { cat, slug } }),
  })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
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
  const { locale, cat, slug } = await params
  const article = getMiradaBySlug(cat, slug)
  if (!article) notFound()

  const t = await getTranslations({ locale, namespace: 'miradas' })
  const readingTime = calculateReadingTime(article.content)
  const next = getNextArticle(cat, slug)
  const absoluteUrl = `${SITE_CONFIG.baseUrl}${localizedPath(
    '/miradas/[cat]/[slug]',
    locale,
    { params: { cat, slug } },
  )}`

  // Tags: si el frontmatter las define, las renderizamos; si no, hide.
  // Traducción via namespace `miradas.grid.categories.<tag>` con fallback
  // al propio tag prettificado.
  const tags = article.tags ?? []
  const labelForTag = (tag: string): string => {
    const key = `grid.categories.${tag}` as Parameters<typeof t>[0]
    if (t.has(key)) return t(key)
    return tag.replace(/-/g, ' ')
  }

  return (
    <>
      {/* ========================================================
          Hero — top:0 (sin pt), col 2-12 con sangrado derecho hasta viewport
          ======================================================== */}
      <section className="section-inner" aria-label="Cabecera del artículo">
        <div className="grid grid-cols-12 gap-grid-gutter">
          {/* Cover + título overlay — col 2-12, sangrado derecho */}
          <div className="col-span-12 lg:col-start-2 lg:col-span-11 lg:row-start-1 relative">
            <div
              className="relative overflow-hidden"
              style={{
                width: 'calc(100% + var(--grid-margin))',
                height: 'clamp(320px, 56vh, 640px)',
              }}
            >
              <Image
                src={getCover(article.slug, article.image)}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 86vw, 100vw"
                className="object-cover"
              />

              {/* Título — caja blanca esquina inf-izq, w-1/2 (5 cols) */}
              <div className="absolute bottom-0 left-0 w-full lg:w-1/2 bg-pure-white p-5 lg:p-6 flex items-center min-h-[88px]">
                <h1 className="font-serif font-light text-subtitle text-fg leading-tight">
                  {article.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Author — col 10 del parent grid, misma fila que la imagen.
              Avatar absoluto con bottom = bottom imagen (left aligned a
              col 10 start). Label absoluta justo debajo de la imagen,
              también arrancando en col 10. */}
          <div className="hidden lg:block lg:col-start-10 lg:col-span-3 lg:row-start-1 relative pointer-events-none">
            <div className="absolute left-0 bottom-0 pointer-events-auto">
              <AuthorAvatar author={article.author} size="lg" />
            </div>
            <div className="absolute left-0 top-full pointer-events-auto">
              <span className="block bg-pure-white px-1.5 py-1 font-mono text-card-sm text-fg whitespace-nowrap leading-none">
                {article.author}, {formatDate(article.publishedAt)}
              </span>
            </div>
          </div>

          {/* Author mobile — debajo de la imagen, sin posicionado fijo */}
          <div className="col-span-12 lg:hidden mt-6 flex items-center gap-3">
            <AuthorAvatar author={article.author} size="sm" />
            <span className="inline-flex bg-pure-white px-1.5 py-0.5 font-mono text-card-sm text-fg whitespace-nowrap">
              {article.author}, {formatDate(article.publishedAt)}
            </span>
          </div>

          {/* Volver a Miradas — debajo del título, izquierda */}
          <div className="col-span-12 lg:col-start-2 lg:col-span-6 mt-6">
            <CurtainLink
              href="/miradas"
              className="hover-wipe-underline w-fit font-mono text-body-sm text-fg"
            >
              Volver a Miradas
            </CurtainLink>
          </div>
        </div>

        {/* Share row — col 2-11 (10 cols centrales) */}
        <div className="mt-10 lg:mt-12 grid grid-cols-12 gap-grid-gutter">
          <div className="col-span-12 lg:col-start-2 lg:col-span-10">
            <ShareRow
              title={article.title}
              url={absoluteUrl}
              readingTimeMinutes={readingTime}
            />
          </div>
        </div>
      </section>

      {/* ========================================================
          Body — chips de categorías + lead description + MDX content
          ======================================================== */}
      <article className="section-inner pt-16 lg:pt-20 pb-section" aria-label={article.title}>
        <div className="grid grid-cols-12 gap-grid-gutter">
          {/* Tags chips — primer tag destacado (dark), resto en bg-pure-white.
              Wrapper SIEMPRE renderizado con min-h para reservar el espacio
              aunque el frontmatter no tenga tags todavía (BBDD pendiente). */}
          <div className="col-span-12 lg:col-start-2 lg:col-span-10 min-h-[26px] flex flex-wrap gap-x-2.5 gap-y-2.5">
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

          {/* Lead description (frontmatter.description) — text-title-sm en
              normal (400) para diferenciarse de los subtítulos h2 del cuerpo
              (que van en light 300). */}
          <div className="col-span-12 lg:col-start-2 lg:col-span-10 mt-8 lg:mt-12">
            <p className="font-serif font-normal text-fg text-title-sm leading-tight tracking-[-0.01em]">
              {article.description}
            </p>
          </div>

          {/* MDX body */}
          <div className="col-span-12 lg:col-start-2 lg:col-span-10 mt-12 lg:mt-16">
            <MDXContent source={article.content} />
          </div>
        </div>
      </article>

      {/* ========================================================
          Share row inferior + sugerencia siguiente artículo
          ======================================================== */}
      <section className="section-inner pb-section" aria-label="Continúa leyendo">
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-span-12 lg:col-start-2 lg:col-span-10">
            <ShareRow
              title={article.title}
              url={absoluteUrl}
              backLink={{ href: '/miradas', label: 'Volver a Miradas' }}
            />
          </div>
        </div>
      </section>

      {next && (
        <section className="w-full" aria-label="Siguiente artículo">
          <ArticleNext article={next} />
        </section>
      )}
    </>
  )
}
