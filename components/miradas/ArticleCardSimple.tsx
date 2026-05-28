import Image from 'next/image'

import { CurtainLink } from '@/components/layout/CurtainLink'
import { AuthorAvatar } from '@/components/miradas/AuthorAvatar'
import type { MiradaMeta } from '@/lib/content/miradas'
import type { Locale } from '@/lib/i18n/config'
import { articleHref } from '@/lib/i18n/article-href'

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

function formatDate(dateStr: string, locale: Locale): string {
  const localeTag =
    locale === 'es' ? 'es-ES' : locale === 'ca' ? 'ca-ES' : 'en-GB'
  return new Date(dateStr).toLocaleDateString(localeTag, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface ArticleCardSimpleProps {
  article: MiradaMeta
  locale: Locale
  priority?: boolean
}

/**
 * Card de artículo Miradas — versión simplificada compartida por listings.
 *
 * Layout canónico: cover aspect-square + author block + title strip al fondo.
 * Sin filtros/scroll-infinito (eso lo gestiona MiradasGrid en el listado
 * legacy con búsqueda).
 */
export function ArticleCardSimple({
  article,
  locale,
  priority = false,
}: ArticleCardSimpleProps) {
  return (
    <CurtainLink
      href={articleHref(article.category, article.slugByLocale[locale], locale)}
      className="group relative block overflow-hidden"
    >
      <div className="relative w-full aspect-square overflow-hidden">
        <Image
          src={getCover(article.slug, article.image)}
          alt={article.title}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 35vw, 100vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col">
          <div className="flex items-end pl-5">
            <div className="flex flex-col">
              <AuthorAvatar author={article.author} size="sm" />
              <span className="inline-flex bg-pure-white px-1.5 py-0.5 font-mono text-card-sm text-fg whitespace-nowrap">
                {article.author}, {formatDate(article.publishedAt, locale)}
              </span>
            </div>
          </div>
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
