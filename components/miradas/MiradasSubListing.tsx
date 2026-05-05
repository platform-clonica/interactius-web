import { CurtainLink } from '@/components/layout/CurtainLink'
import { Breadcrumb, absoluteUrl } from '@/components/miradas/Breadcrumb'
import { MiradasSubFilteredGrid } from '@/components/miradas/MiradasSubFilteredGrid'
import { parentListingHref, subListingHref } from '@/lib/i18n/article-href'
import { localizedPath } from '@/lib/i18n/navigation'
import type { Locale } from '@/lib/i18n/config'
import type { MiradaMeta } from '@/lib/content/miradas'
import {
  SUBS_BY_PARENT,
  SUB_TO_PARENT,
  type MiradasSubcategory,
} from '@/lib/miradas/frontmatter.schema'
import {
  PARENT_DISPLAY,
  SUB_DISPLAY,
  localizeParentSlug,
  localizeSubSlug,
} from '@/lib/miradas/i18n-routing'

const TOP_TAGS_LIMIT = 6

interface MiradasSubListingProps {
  sub: MiradasSubcategory
  articles: MiradaMeta[]
  locale: Locale
}

/** Cuenta ocurrencias de tags y devuelve los top N. */
function topTagsFromArticles(articles: MiradaMeta[], limit: number): string[] {
  const counts = new Map<string, number>()
  for (const a of articles) {
    for (const tag of a.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag)
}

/**
 * Listing de subcategoría: hero + breadcrumb + filtro de tags + grid +
 * bloque "Otras temáticas en [madre]".
 */
export function MiradasSubListing({
  sub,
  articles,
  locale,
}: MiradasSubListingProps) {
  const parent = SUB_TO_PARENT[sub]
  const subLabel = SUB_DISPLAY[locale][sub]
  const parentLabel = PARENT_DISPLAY[locale][parent]
  const sisters = SUBS_BY_PARENT[parent].filter((s) => s !== sub)
  const topTags = topTagsFromArticles(articles, TOP_TAGS_LIMIT)

  const parentAbs = absoluteUrl(
    localizedPath('/miradas/[parentOrSub]', locale, {
      params: { parentOrSub: localizeParentSlug(parent, locale) },
    }),
  )

  return (
    <section className="section-inner pt-section">
      <div className="grid grid-cols-12 gap-grid-gutter mb-8">
        <div className="col-span-12 lg:col-start-2 lg:col-span-10">
          <Breadcrumb
            items={[
              {
                label: 'Miradas',
                href: '/miradas',
                absoluteUrl: absoluteUrl(localizedPath('/miradas', locale)),
              },
              {
                label: parentLabel,
                href: parentListingHref(parent, locale),
                absoluteUrl: parentAbs,
              },
              { label: subLabel },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-grid-gutter mb-8 lg:mb-10">
        <div className="col-span-12 lg:col-start-2 lg:col-span-10">
          <CurtainLink
            href={parentListingHref(parent, locale)}
            className="hover-wipe-underline w-fit font-mono text-body-sm text-fg/70 mb-4 inline-flex"
          >
            ← {parentLabel}
          </CurtainLink>
        </div>
        <h1 className="col-span-12 lg:col-start-2 lg:col-span-10 font-serif font-light text-fg text-title leading-tight">
          {subLabel}
        </h1>
      </div>

      <div className="grid grid-cols-12 gap-grid-gutter">
        <div className="col-span-12 lg:col-start-2 lg:col-span-10">
          <MiradasSubFilteredGrid
            articles={articles}
            locale={locale}
            topTags={topTags}
          />
        </div>
      </div>

      {sisters.length > 0 && (
        <div className="grid grid-cols-12 gap-grid-gutter mt-section pb-section">
          <div className="col-span-12 lg:col-start-2 lg:col-span-10">
            <h2 className="font-serif font-light text-fg text-title-sm leading-tight mb-6">
              Otras temáticas en {parentLabel}
            </h2>
            <div className="flex flex-wrap gap-x-[10px] gap-y-[10px]">
              {sisters.map((s) => (
                <CurtainLink
                  key={s}
                  href={subListingHref(s, locale)}
                  className="inline-flex items-center px-1.5 py-0.5 font-mono text-label text-fg bg-pure-white hover:bg-warm-dark/60"
                >
                  {SUB_DISPLAY[locale][s]}
                </CurtainLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
