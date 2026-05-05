import { CurtainLink } from '@/components/layout/CurtainLink'
import { ArticleCardSimple } from '@/components/miradas/ArticleCardSimple'
import { Breadcrumb, absoluteUrl } from '@/components/miradas/Breadcrumb'
import { subListingHref } from '@/lib/i18n/article-href'
import { localizedPath } from '@/lib/i18n/navigation'
import type { Locale } from '@/lib/i18n/config'
import type { MiradaMeta } from '@/lib/content/miradas'
import {
  SUBS_BY_PARENT,
  type MiradasParentCategory,
} from '@/lib/miradas/frontmatter.schema'
import { PARENT_DISPLAY, SUB_DISPLAY } from '@/lib/miradas/i18n-routing'

interface MiradasParentListingProps {
  parent: MiradasParentCategory
  articles: MiradaMeta[]
  locale: Locale
}

/**
 * Listing de categoría madre: hero + chips de subs hijas + grid de artículos.
 * Los artículos vienen ya filtrados por madre desde el caller.
 */
export function MiradasParentListing({
  parent,
  articles,
  locale,
}: MiradasParentListingProps) {
  const parentLabel = PARENT_DISPLAY[locale][parent]
  const childSubs = SUBS_BY_PARENT[parent]

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
              { label: parentLabel },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-grid-gutter mb-12 lg:mb-16">
        <h1 className="col-span-12 lg:col-start-2 lg:col-span-10 font-serif font-light text-fg text-title leading-tight">
          {parentLabel}
        </h1>
        <p className="col-span-12 lg:col-start-2 lg:col-span-8 font-mono text-body-sm text-fg/70 leading-[1.6]">
          Reflexiones desde el territorio de {parentLabel.toLowerCase()}.
        </p>
      </div>

      {/* Chips de subs hijas */}
      <div className="grid grid-cols-12 gap-grid-gutter mb-12">
        <div className="col-span-12 lg:col-start-2 lg:col-span-10 flex flex-wrap gap-x-[10px] gap-y-[10px]">
          {childSubs.map((sub) => (
            <CurtainLink
              key={sub}
              href={subListingHref(sub, locale)}
              className="inline-flex items-center px-1.5 py-0.5 font-mono text-label text-fg bg-pure-white hover:bg-warm-dark/60"
            >
              {SUB_DISPLAY[locale][sub]}
            </CurtainLink>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-grid-gutter pb-section">
        <div className="col-span-12 lg:col-start-2 lg:col-span-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-grid-gutter">
          {articles.map((a, i) => (
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
}
