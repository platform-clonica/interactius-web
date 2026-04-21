'use client'

import { useState, Fragment, useTransition } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { Link } from '@/lib/i18n/routing'
import { articleHref } from '@/lib/i18n/article-href'
import type { MiradaMeta } from '@/lib/content/miradas'

/* ─── Cover images ─────────────────────────────────────────── */

const PLACEHOLDER_COVERS = Array.from(
  { length: 10 },
  (_, i) => `/miradas/placeholder-${String(i + 1).padStart(2, '0')}.jpg`,
)

function getCover(article: MiradaMeta, index: number): string {
  return article.cover ?? PLACEHOLDER_COVERS[index % PLACEHOLDER_COVERS.length]
}

/* ─── Date format ──────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/* ─── Article card ─────────────────────────────────────────── */

function ArticleCard({
  article,
  cover,
  priority = false,
}: {
  article: MiradaMeta
  cover: string
  priority?: boolean
}) {
  return (
    <Link
      href={articleHref(article.cat, article.slug)}
      className="group relative flex flex-col bg-pure-white overflow-hidden"
    >
      {/* Image area */}
      <div className="relative w-full aspect-square overflow-hidden">
        <Image
          src={cover}
          alt={article.title}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 35vw, 100vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Author avatar + date — stacked at bottom-left */}
        <div className="absolute bottom-5 left-6 flex flex-col gap-1">
          <div className="relative w-[60px] h-[63px] overflow-hidden flex-shrink-0 bg-muted">
            <Image
              src="/identidad/team.jpg"
              alt={article.author}
              fill
              sizes="60px"
              className="object-cover"
              style={{ objectPosition: '22% 10%' }}
            />
          </div>
          <span className="inline-flex bg-pure-white px-1.5 py-0.5 font-mono text-card-sm text-fg whitespace-nowrap">
            {article.author}, {formatDate(article.publishedAt)}
          </span>
        </div>
      </div>

      {/* Title strip */}
      <div className="bg-pure-white p-5 flex items-center min-h-[72px]">
        <h2 className="font-serif font-light text-subtitle text-fg leading-none">
          {article.title}
        </h2>
      </div>
    </Link>
  )
}

/* ─── Featured card (fullwidth) ────────────────────────────── */

function FeaturedCard({
  article,
  cover,
}: {
  article: MiradaMeta
  cover: string
}) {
  return (
    <Link
      href={articleHref(article.cat, article.slug)}
      className="group relative col-span-12 lg:col-start-2 lg:col-span-10 flex flex-col bg-pure-white overflow-hidden"
    >
      {/* Image area */}
      <div className="relative w-full aspect-[16/7] lg:aspect-[1382/640] overflow-hidden">
        <Image
          src={cover}
          alt={article.title}
          fill
          priority
          sizes="(min-width: 1024px) 86vw, 100vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Author avatar + date — stacked at bottom-left */}
        <div className="absolute bottom-5 left-6 flex flex-col gap-1">
          <div className="relative w-[60px] h-[63px] overflow-hidden flex-shrink-0 bg-muted">
            <Image
              src="/identidad/team.jpg"
              alt={article.author}
              fill
              sizes="60px"
              className="object-cover"
              style={{ objectPosition: '22% 10%' }}
            />
          </div>
          <span className="inline-flex bg-pure-white px-1.5 py-0.5 font-mono text-card-sm text-fg whitespace-nowrap">
            {article.author}, {formatDate(article.publishedAt)}
          </span>
        </div>

        {/* Quote — right half, desktop only */}
        <div className="hidden lg:flex absolute bottom-[108px] right-0 w-1/2 bg-pure-white p-5 items-center">
          <p className="font-mono text-body-sm text-fg leading-[1.5] line-clamp-3">
            {article.description}
          </p>
        </div>
      </div>

      {/* Title strip */}
      <div className="bg-pure-white p-5 lg:w-1/2 min-h-[72px] flex items-center">
        <h2 className="font-serif font-light text-subtitle text-fg leading-none">
          {article.title}
        </h2>
      </div>
    </Link>
  )
}

/* ─── Main grid component ──────────────────────────────────── */

export function MiradasGrid({ articles }: { articles: MiradaMeta[] }) {
  const t = useTranslations('miradas')
  const [search, setSearch] = useState('')
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [, startTransition] = useTransition()

  // Las categorías se derivan de articles (prop estable del server) — sin useMemo
  const categories = [...new Set(articles.map((a) => a.cat))].sort()

  // El filtrado es O(n) sobre una lista pequeña — sin useMemo
  let filtered = articles
  if (activeCategories.length > 0) {
    filtered = filtered.filter((a) => activeCategories.includes(a.cat))
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase()
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q),
    )
  }

  function toggleCategory(cat: string) {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    )
  }

  function catLabel(cat: string): string {
    const key = `grid.categories.${cat}` as Parameters<typeof t>[0]
    try {
      return t(key)
    } catch {
      return cat.charAt(0).toUpperCase() + cat.slice(1)
    }
  }

  const featured = filtered[0]
  const rest = filtered.slice(1)

  const leftCol = rest.filter((_, i) => i % 2 === 0)
  const rightCol = rest.filter((_, i) => i % 2 === 1)

  return (
    <section className="w-full" aria-label="Artículos">

      {/* ── "Miradas" super title ── */}
      <div className="overflow-x-hidden w-full pt-8">
        <p
          className="font-serif font-normal text-super text-fg whitespace-nowrap select-none"
          style={{ marginLeft: '-57px' }}
          aria-hidden="true"
        >
          {t('grid.superTitle')}
        </p>
      </div>

      {/* ── Search + filters ── */}
      <div className="section-inner mt-8 mb-12">
        <div className="grid grid-cols-12 gap-grid-gutter items-start">
          {/* Search — left col */}
          <div className="col-span-12 lg:col-start-2 lg:col-span-5 border-b border-fg/20 pb-1">
            <input
              type="search"
              value={search}
              onChange={(e) => {
                const val = e.target.value
                startTransition(() => setSearch(val))
              }}
              placeholder={t('grid.searchPlaceholder')}
              className="w-full bg-transparent font-mono text-body-sm text-fg placeholder:text-fg/20 outline-none"
              aria-label={t('grid.searchAriaLabel')}
            />
          </div>

          {/* Category filters — right col */}
          <div className="col-span-12 lg:col-start-7 lg:col-span-5 flex flex-wrap gap-2.5 justify-end">
            {categories.map((cat) => {
              const active = activeCategories.includes(cat)
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`inline-flex items-center gap-2 px-1.5 py-0.5 font-mono text-label text-fg transition-colors ${
                    active ? 'bg-warm-dark' : 'bg-pure-white hover:bg-warm-dark/60'
                  }`}
                >
                  {catLabel(cat)}
                  {active && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Articles grid ── */}
      {filtered.length === 0 ? (
        <div className="section-inner py-16">
          <p className="font-mono text-body-sm text-fg/40">{t('grid.noResults')}</p>
        </div>
      ) : (
        <div className="section-inner">
          {/* Featured article */}
          {featured && (
            <div className="grid grid-cols-12 gap-grid-gutter mb-grid-gutter">
              <FeaturedCard
                article={featured}
                cover={getCover(featured, 0)}
              />
            </div>
          )}

          {/* Two-column grid */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-grid-gutter items-start">
              {/* Left column */}
              <div className="lg:col-start-2 lg:col-span-5 flex flex-col gap-grid-gutter">
                {leftCol.map((article, i) => (
                  <ArticleCard
                    key={`${article.cat}/${article.slug}`}
                    article={article}
                    cover={getCover(article, i * 2 + 1)}
                    priority={i === 0}
                  />
                ))}
              </div>

              {/* Right column — offset to create visual rhythm */}
              <div className="lg:col-start-7 lg:col-span-5 flex flex-col gap-grid-gutter lg:mt-20">
                {rightCol.map((article, i) => (
                  <Fragment key={`${article.cat}/${article.slug}`}>
                    <ArticleCard
                      article={article}
                      cover={getCover(article, i * 2 + 2)}
                      priority={i === 0}
                    />
                    {i === 0 && rightCol.length > 2 && (
                      <p className="hidden lg:block font-mono text-body text-fg leading-[1.5] py-8">
                        {t('grid.interstitialQuote')}
                      </p>
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          )}

          {/* "Quiero más." CTA */}
          {filtered.length > 0 && (
            <div className="mt-24 mb-section flex justify-center">
              <p className="font-serif font-normal text-section text-fg text-center">
                {t.rich('grid.loadMore', {
                  u: (chunks) => <span className="underline underline-offset-4">{chunks}</span>,
                })}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
