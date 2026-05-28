import { getTranslations } from 'next-intl/server'

import { Link } from '@/lib/i18n/navigation'
import { articleHref } from '@/lib/i18n/article-href'
import type { Locale } from '@/lib/i18n/config'
import type { MiradasSubcategory } from '@/lib/miradas/frontmatter.schema'

interface AITranslationBannerProps {
  /** Sub canónica del artículo (para construir el href ES). */
  sub: MiradasSubcategory
  /** Slug del artículo (invariante ES en todas las locales). */
  slug: string
  /** Locale actual. ES no muestra banner — solo CA/EN. */
  locale: Exclude<Locale, 'es'>
}

export async function AITranslationBanner({
  sub,
  slug,
  locale,
}: AITranslationBannerProps) {
  const t = await getTranslations({ locale, namespace: 'miradas.article' })
  return (
    <aside
      role="note"
      aria-label="AI translation notice"
      className="border-y border-fg/20 py-4 px-4 bg-pure-white font-mono text-body-sm text-fg/80"
    >
      <p>
        {t.rich('aiTranslationBanner', {
          link: (chunks) => (
            <Link
              href={articleHref(sub, slug, 'es')}
              locale="es"
              className="underline underline-offset-2 hover:text-fg"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </aside>
  )
}
