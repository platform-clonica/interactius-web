'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'

import type { Locale } from '@/lib/i18n/config'
import { formatDate } from '@/lib/i18n/formatDate'

import { SuperTitleReveal } from '@/components/ui/SuperTitleReveal'

import { CurtainLink } from '@/components/layout/CurtainLink'
import { FormField } from '@/components/ui/FormField'
import { AuthorAvatar } from '@/components/miradas/AuthorAvatar'
import { articleHref } from '@/lib/i18n/article-href'
import type { MiradaMeta } from '@/lib/content/miradas'

/* ─── Cover images ─────────────────────────────────────────── */

const PLACEHOLDER_COVERS = Array.from(
  { length: 10 },
  (_, i) => `/miradas/placeholder-${String(i + 1).padStart(2, '0')}.jpg`,
)

function getCover(article: MiradaMeta, index: number): string {
  return article.image ?? PLACEHOLDER_COVERS[index % PLACEHOLDER_COVERS.length]
}

/* ─── Date format ─ helper centralizado en lib/i18n/formatDate.ts ─ */

/* ─── Article card ─────────────────────────────────────────── */

/**
 * Subcomponente reusable: Author avatar + label nombre/fecha en columna,
 * con la base de la label tocando el borde superior del title strip por
 * items-end del row contenedor. SIN posicionamiento absoluto fijo en px:
 * todo está anclado por flex bottom-up para que sea responsive-safe.
 */
function AuthorBlock({
  author,
  publishedAt,
  locale,
}: {
  author: string
  publishedAt: string
  locale: Locale
}) {
  return (
    <div className="flex flex-col">
      <AuthorAvatar author={author} size="sm" />
      <span className="inline-flex bg-pure-white px-1.5 py-0.5 font-mono text-card-sm text-fg whitespace-nowrap">
        {author}, {formatDate(publishedAt, locale)}
      </span>
    </div>
  )
}

function ArticleCard({
  article,
  cover,
  priority = false,
  locale,
}: {
  article: MiradaMeta
  cover: string
  priority?: boolean
  locale: Locale
}) {
  return (
    <CurtainLink
      href={articleHref(article.category, article.slugByLocale[locale], locale)}
      className="group relative block overflow-hidden"
    >
      {/* Image area — único bloque del card. Author + title se apilan desde
          el bottom via flex flex-col (responsive-safe, sin px fijos). */}
      <div className="relative w-full aspect-square overflow-hidden">
        <Image
          src={cover}
          alt={article.title}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 35vw, 100vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Bottom-anchored stack: author row → title strip. items-end del row
            superior garantiza que la base de la label del autor toque el
            borde superior del title strip a cualquier tamaño. */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col">
          {/* Row above title — solo author (no quote en cards normales) */}
          <div className="flex items-end pl-5">
            <AuthorBlock author={article.author} publishedAt={article.publishedAt} locale={locale} />
          </div>

          {/* Title strip — full width en cards normales */}
          <div className="w-full bg-pure-white p-5 flex items-center min-h-[72px]">
            <h2 className="font-serif font-light text-[clamp(16px,1.5vw,22px)] text-fg leading-[1.15]">
              {article.title}
            </h2>
          </div>
        </div>
      </div>
    </CurtainLink>
  )
}

/* ─── Featured card (fullwidth) ────────────────────────────── */

function FeaturedCard({
  article,
  cover,
  locale,
}: {
  article: MiradaMeta
  cover: string
  locale: Locale
}) {
  return (
    <CurtainLink
      href={articleHref(article.category, article.slugByLocale[locale], locale)}
      className="group relative col-start-2 col-span-11 lg:col-start-2 lg:col-span-10 block overflow-hidden"
    >
      {/* Image area — único bloque del card. Layout canónico bottom-up via
          flex flex-col (NO px fijos, responsive-safe):
            · Title strip al fondo (full width mobile, w-1/2 lg)
            · Encima: row con author (left) + quote (right, lg only)
            · items-end del row → bases de author label y quote alineadas con
              el borde superior del title strip a cualquier tamaño */}
      <div className="relative w-full aspect-[16/9] lg:aspect-[1382/780] overflow-hidden">
        <Image
          src={cover}
          alt={article.title}
          fill
          priority
          sizes="(min-width: 1024px) 86vw, 100vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Bottom-anchored overlay stack */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col">
          {/* Row above title — author (left), quote (right, solo lg).
              items-end alinea las BASES de ambos con el title-top. */}
          <div className="flex justify-between items-end pl-5">
            <AuthorBlock author={article.author} publishedAt={article.publishedAt} locale={locale} />
            <div className="hidden lg:flex w-1/2 bg-pure-white p-5 items-center">
              <p className="font-mono text-body-sm text-fg leading-[1.5] line-clamp-3">
                {article.description}
              </p>
            </div>
          </div>

          {/* Title strip — w-1/2 (= 5 cols del card que es col-span-10) en lg */}
          <div className="w-full lg:w-1/2 bg-pure-white p-5 min-h-[88px] flex items-center">
            <h2 className="font-serif font-light text-[clamp(16px,1.5vw,22px)] text-fg leading-[1.15]">
              {article.title}
            </h2>
          </div>
        </div>
      </div>
    </CurtainLink>
  )
}

/* ─── Main grid component ──────────────────────────────────── */

export function MiradasGrid({ articles }: { articles: MiradaMeta[] }) {
  const t = useTranslations('miradas')
  const locale = useLocale() as Locale
  const [search, setSearch] = useState('')
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [, startTransition] = useTransition()


  // Lista canónica fija de categorías (orden de Figma). Independiente de los
  // cats reales en los MDX — los artículos sin cat coincidente no se filtran
  // hasta que se actualice su frontmatter.
  const categories = [
    'ux-design',
    'innovacion',
    'research',
    'estrategia',
    'ui-design',
    'tendencias',
    'product-design',
  ]

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

  // Scroll infinito: PAGE_SIZE artículos por carga. Inicial pequeño para
  // que el sentinel quede claramente bajo el fold y el usuario pueda ver
  // el efecto de loading dots al hacer scroll.
  const PAGE_SIZE = 4
  const [visibleCount, setVisibleCount] = useState(1 + PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset al cambiar filtros/búsqueda — evita "se quedó cargado n+1" en una
  // lista filtrada más corta.
  useEffect(() => {
    setVisibleCount(1 + PAGE_SIZE)
  }, [search, activeCategories])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length
  const filteredLength = filtered.length

  // IntersectionObserver + scroll listener como respaldo. Algunas combinaciones
  // de layout (sticky, transforms en ancestros) hacen que IO no dispare como
  // se espera; el scroll listener garantiza que la paginación avance.
  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return

    const loadMore = () =>
      setVisibleCount((c) => Math.min(c + PAGE_SIZE, filteredLength))

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore()
      },
      { rootMargin: '800px 0px', threshold: 0 },
    )
    io.observe(el)

    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight + 800) loadMore()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    // Trigger inicial por si el sentinel ya está visible al montar
    onScroll()

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [hasMore, filteredLength])

  const featured = visible[0]
  const rest = visible.slice(1)

  const leftCol = rest.filter((_, i) => i % 2 === 0)
  const rightCol = rest.filter((_, i) => i % 2 === 1)

  return (
    <section className="w-full" aria-label={t('grid.articlesLabel')}>

      {/* ── "Miradas" super title — sangrado izquierdo canónico + line-mask
            reveal. Sin paddingBottom 0.2em (excepción al canónico): los 3
            títulos en sus idiomas ("Miradas" / "Views" / "Mirades") no
            tienen descenders, así que podemos acortar la máscara hasta la
            línea base. ── */}
      <div className="relative overflow-hidden mt-0">
        <h2
          className="font-serif font-normal text-fg text-super whitespace-nowrap select-none"
          style={{
            marginLeft: 'calc(-1 * clamp(6px, 0.8vw, 18px))',
          }}
          aria-hidden="true"
        >
          <SuperTitleReveal>{t('grid.superTitle')}</SuperTitleReveal>
        </h2>
      </div>

      {/* ── Search + filters ── */}
      <div className="section-inner mt-20 mb-12 lg:mt-24">
        <div className="grid grid-cols-12 gap-grid-gutter items-end">
          {/* Search — left col. Usa FormField canónico (mismo lenguaje que
              los formularios: floating label, border-b dark/40 → dark on
              focus, font-mono text-body-sm). */}
          <div className="col-start-2 col-span-11 lg:col-start-2 lg:col-span-5">
            <FormField
              name="search"
              type="search"
              label={t('grid.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                const val = e.target.value
                startTransition(() => setSearch(val))
              }}
              aria-label={t('grid.searchAriaLabel')}
            />
          </div>

          {/* Category filters — right col. gap-x/gap-y 10px entre tags. */}
          <div className="col-span-12 lg:col-start-7 lg:col-span-5 flex flex-wrap justify-end gap-x-[10px] gap-y-[10px]">
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
        <div className="section-inner py-24 lg:py-32">
          <p className="text-center font-mono text-body-sm text-fg leading-[1.6]">
            {t('grid.noResults')}
          </p>
        </div>
      ) : (
        <div className="section-inner pb-section lg:pb-[160px]">
          {/* Featured article */}
          {featured && (
            <div className="grid grid-cols-12 gap-grid-gutter mb-grid-gutter">
              <FeaturedCard
                article={featured}
                cover={getCover(featured, 0)}
                locale={locale}
              />
            </div>
          )}

          {/* Two-column grid */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-grid-gutter items-start">
              {/* Left column */}
              <div className="md:col-span-1 lg:col-start-2 lg:col-span-5 flex flex-col gap-grid-gutter">
                {leftCol.map((article, i) => (
                  <ArticleCard
                    key={`${article.cat}/${article.slug}`}
                    article={article}
                    cover={getCover(article, i * 2 + 1)}
                    priority={i === 0}
                    locale={locale}
                  />
                ))}
              </div>

              {/* Right column — offset to create visual rhythm */}
              <div className="md:col-span-1 lg:col-start-7 lg:col-span-5 flex flex-col gap-grid-gutter lg:mt-20">
                {rightCol.map((article, i) => (
                  <ArticleCard
                    key={`${article.cat}/${article.slug}`}
                    article={article}
                    cover={getCover(article, i * 2 + 2)}
                    priority={i === 0}
                    locale={locale}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sentinel + loading dots para scroll infinito. El sentinel
              dispara IntersectionObserver con 600px de pre-margin. Cuando
              hay más artículos disponibles, mostramos los 3 puntitos
              (animación CSS canónica). */}
          <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
          {hasMore && (
            <div
              className="mt-16 mb-section flex justify-center"
              role="status"
              aria-live="polite"
              aria-label={t('grid.loadingMore')}
            >
              <span className="loading-dots inline-flex items-end gap-1">
                <span className="block size-1.5 rounded-full bg-fg/60" />
                <span className="block size-1.5 rounded-full bg-fg/60" />
                <span className="block size-1.5 rounded-full bg-fg/60" />
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
