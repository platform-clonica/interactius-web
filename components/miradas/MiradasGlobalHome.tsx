import { CurtainLink } from '@/components/layout/CurtainLink'
import { Link } from '@/lib/i18n/navigation'
import { ArticleCardSimple } from '@/components/miradas/ArticleCardSimple'
import { MiradasHero } from '@/components/miradas/MiradasHero'
import { parentListingHref } from '@/lib/i18n/article-href'
import type { Locale } from '@/lib/i18n/config'
import type { MiradaMeta } from '@/lib/content/miradas'
import {
  MIRADAS_PARENT_CATEGORIES,
  SUBS_BY_PARENT,
} from '@/lib/miradas/frontmatter.schema'
import { PARENT_DISPLAY } from '@/lib/miradas/i18n-routing'

const RECENT_PER_PARENT = 4

interface MiradasGlobalHomeProps {
  articles: MiradaMeta[]
  locale: Locale
}

/**
 * Listing global de Miradas: 3 secciones (una por madre) con 4 artículos
 * más recientes y CTA "Ver todos →" hacia el listing de la madre.
 *
 * Hero compartido (`MiradasHero`) se renderiza al inicio.
 */
export function MiradasGlobalHome({ articles, locale }: MiradasGlobalHomeProps) {
  return (
    <>
      <MiradasHero />

      {MIRADAS_PARENT_CATEGORIES.map((parent) => {
        const childSubs = SUBS_BY_PARENT[parent]
        const inParent = articles.filter((a) => childSubs.includes(a.category))
        const recent = inParent.slice(0, RECENT_PER_PARENT)
        if (recent.length === 0) return null

        const parentLabel = PARENT_DISPLAY[locale][parent]
        const totalInParent = inParent.length

        return (
          <section
            key={parent}
            className="section-inner pb-section"
            aria-label={parentLabel}
          >
            <div className="grid grid-cols-12 gap-grid-gutter mb-8 lg:mb-12 items-end">
              <h2 className="col-span-12 lg:col-start-2 lg:col-span-8 font-serif font-light text-fg text-title-sm leading-tight">
                <Link
                  href={parentListingHref(parent, locale)}
                  className="hover-wipe-underline"
                >
                  {parentLabel}
                </Link>
                <span className="ml-3 font-mono text-body-sm text-fg/60 align-middle">
                  {totalInParent}
                </span>
              </h2>
              <div className="col-span-12 lg:col-start-10 lg:col-span-3 flex lg:justify-end">
                <CurtainLink
                  href={parentListingHref(parent, locale)}
                  className="hover-wipe-underline font-mono text-body-sm text-fg"
                >
                  Ver todos →
                </CurtainLink>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-grid-gutter">
              <div className="col-span-12 lg:col-start-2 lg:col-span-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-grid-gutter">
                {recent.map((a, i) => (
                  <ArticleCardSimple
                    key={`${a.cat}/${a.slug}`}
                    article={a}
                    locale={locale}
                    priority={i === 0}
                  />
                ))}
              </div>
            </div>
          </section>
        )
      })}
    </>
  )
}
