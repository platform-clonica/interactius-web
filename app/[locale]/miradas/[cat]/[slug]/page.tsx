import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { buildPageMetadata } from '@/lib/seo/metadata.config'
import { localizedPath, getAlternates, Link } from '@/lib/i18n/routing'
import { type Locale } from '@/lib/i18n/config'
import { getMiradaBySlug, getAllSlugs } from '@/lib/content/miradas'
import { MDXContent } from '@/components/miradas/MDXContent'

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

export default async function ArticlePage({ params }: PageProps) {
  const { cat, slug } = await params
  const article = getMiradaBySlug(cat, slug)
  if (!article) notFound()

  const date = new Date(article.publishedAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      {/* Header */}
      <section className="w-full border-b border-muted" aria-label="Cabecera del artículo">
        <div className="section-inner pt-32 pb-16 lg:pt-40">
          <div className="grid grid-cols-12 gap-grid-gutter">
            <div className="col-span-12 lg:col-span-8">
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href="/miradas"
                className="inline-flex items-center gap-2 font-mono text-micro text-fg/40 uppercase tracking-wider
                           mb-8 transition-opacity duration-fast hover:opacity-60"
              >
                ← Miradas
              </Link>
              <p className="font-mono text-micro text-fg/40 uppercase tracking-wider mb-4">
                {article.cat.replace(/-/g, ' ')}
              </p>
              <h1 className="font-serif font-light text-title lg:text-display text-fg leading-tight">
                {article.title}
              </h1>
              <p className="mt-6 font-mono text-body-sm text-fg/60 max-w-[52ch]">
                {article.description}
              </p>
              <div className="mt-8 flex items-center gap-6 font-mono text-micro text-fg/40">
                <span>{article.author}</span>
                <time dateTime={article.publishedAt}>{date}</time>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <article className="w-full" aria-label={article.title}>
        <div className="section-inner py-section">
          <div className="grid grid-cols-12 gap-grid-gutter">
            <div className="col-span-12 lg:col-span-8 lg:col-start-3">
              <MDXContent source={article.content} />
            </div>
          </div>
        </div>
      </article>

      {/* Back */}
      <section className="w-full border-t border-muted">
        <div className="section-inner py-12">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href="/miradas"
            className="font-mono text-body-sm text-fg/60 transition-opacity duration-fast hover:opacity-60"
          >
            ← Volver a Miradas
          </Link>
        </div>
      </section>
    </>
  )
}
