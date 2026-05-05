'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'

import { ArticleCardSimple } from '@/components/miradas/ArticleCardSimple'
import type { Locale } from '@/lib/i18n/config'
import type { MiradaMeta } from '@/lib/content/miradas'

interface MiradasSubFilteredGridProps {
  articles: MiradaMeta[]
  locale: Locale
  /** Hasta 6 tags más usados — se renderizan como chips toggleables. */
  topTags: string[]
}

/**
 * Grid filtrable por tags client-side. Sin navegación a `/tag/<x>` (decisión
 * del prompt: tags como filtro UI, no rutas).
 *
 * Si `activeTags` está vacío, muestra todos. Si tiene tags, muestra
 * artículos cuyo `tags` incluya AL MENOS UNO de los activos (OR).
 */
export function MiradasSubFilteredGrid({
  articles,
  locale,
  topTags,
}: MiradasSubFilteredGridProps) {
  const t = useTranslations('miradas')
  const [activeTags, setActiveTags] = useState<string[]>([])

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  function labelForTag(tag: string): string {
    const key = `grid.categories.${tag}` as Parameters<typeof t>[0]
    if (t.has(key)) return t(key)
    return tag.replace(/-/g, ' ')
  }

  const filtered = useMemo(() => {
    if (activeTags.length === 0) return articles
    return articles.filter((a) => (a.tags ?? []).some((tag) => activeTags.includes(tag)))
  }, [activeTags, articles])

  return (
    <>
      {topTags.length > 0 && (
        <div className="mb-8 lg:mb-12 flex flex-wrap gap-x-[10px] gap-y-[10px]">
          {topTags.map((tag) => {
            const active = activeTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`inline-flex items-center gap-2 px-1.5 py-0.5 font-mono text-label text-fg transition-colors ${
                  active ? 'bg-warm-dark' : 'bg-pure-white hover:bg-warm-dark/60'
                }`}
              >
                {labelForTag(tag)}
                {active && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <p
          role="status"
          aria-live="polite"
          className="font-mono text-body-sm text-fg/70 leading-[1.6]"
        >
          {t('grid.noResults')}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-grid-gutter">
          {filtered.map((a, i) => (
            <ArticleCardSimple
              key={`${a.cat}/${a.slug}`}
              article={a}
              locale={locale}
              priority={i === 0}
            />
          ))}
        </div>
      )}
    </>
  )
}
