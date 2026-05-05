import { Link } from '@/lib/i18n/navigation'
import type { IntlHref } from '@/lib/i18n/article-href'
import { SITE_CONFIG } from '@/lib/seo/metadata.config'

export interface BreadcrumbItem {
  /** Texto visible del nivel. Si es la página actual, se renderiza como `<span>` con aria-current. */
  label: string
  /** Href para los niveles linkables. Omitir en el último nivel (página actual). */
  href?: IntlHref
  /** URL absoluta opcional para el JSON-LD BreadcrumbList. */
  absoluteUrl?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  /** Si true, también emite `<script type="application/ld+json">` con BreadcrumbList. */
  withJsonLd?: boolean
  className?: string
}

/**
 * Breadcrumb de Miradas — patrón canónico de 2-4 niveles.
 *
 * Render: items separados por `/` (aria-hidden), todos los niveles excepto
 * el último son `<Link>` (next-intl, locale-aware). El último es texto plano
 * con `aria-current="page"`.
 *
 * Tipografía: `font-mono text-body-sm text-fg/70 leading-[1.5]`. El item
 * actual usa `text-fg` para destacar.
 */
export function Breadcrumb({
  items,
  withJsonLd = true,
  className,
}: BreadcrumbProps) {
  const jsonLd = withJsonLd
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.label,
          ...(item.absoluteUrl ? { item: item.absoluteUrl } : {}),
        })),
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <nav
        aria-label="Breadcrumb"
        className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-body-sm text-fg/70 leading-[1.5] ${className ?? ''}`}
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <span key={`${i}-${item.label}`} className="flex items-center gap-x-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover-wipe-underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className="text-fg">
                  {item.label}
                </span>
              )}
              {!isLast && <span aria-hidden>/</span>}
            </span>
          )
        })}
      </nav>
    </>
  )
}

/**
 * Helper: construye una URL absoluta para el JSON-LD BreadcrumbList a partir
 * de un pathname relativo (`/miradas/...`).
 */
export function absoluteUrl(pathname: string): string {
  return `${SITE_CONFIG.baseUrl}${pathname}`
}
