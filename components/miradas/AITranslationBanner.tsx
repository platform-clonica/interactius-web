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

const COPY = {
  ca: {
    before:
      'Aquest article es va escriure originalment en castellà i traduir amb l’ajuda d’IA. Aquí tens l’',
    link: 'article original',
    after: '.',
  },
  en: {
    before:
      'This article was originally written in Spanish and translated with the help of AI. Here is the ',
    link: 'original article',
    after: '.',
  },
} as const

export function AITranslationBanner({ sub, slug, locale }: AITranslationBannerProps) {
  const copy = COPY[locale]
  return (
    <aside
      role="note"
      aria-label="AI translation notice"
      className="border-y border-fg/20 py-4 px-4 bg-warm-light/60 font-mono text-body-sm text-fg/80"
    >
      <p>
        {copy.before}
        <Link
          href={articleHref(sub, slug, 'es')}
          locale="es"
          className="underline underline-offset-2 hover:text-fg"
        >
          {copy.link}
        </Link>
        {copy.after}
      </p>
    </aside>
  )
}
