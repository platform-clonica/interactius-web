import Image from 'next/image'

import { CurtainLink } from '@/components/layout/CurtainLink'
import { PlusArrowFlipIcon } from '@/components/ui/PlusArrowFlipIcon'
import { articleHref } from '@/lib/i18n/article-href'
import type { MiradaMeta } from '@/lib/content/miradas'

interface ArticleNextProps {
  article: MiradaMeta
}

const PLACEHOLDER_COVERS = Array.from(
  { length: 10 },
  (_, i) => `/miradas/placeholder-${String(i + 1).padStart(2, '0')}.jpg`,
)

function getCover(article: MiradaMeta): string {
  if (article.cover) return article.cover
  let h = 0
  for (let i = 0; i < article.slug.length; i++) h = ((h << 5) - h + article.slug.charCodeAt(i)) | 0
  return PLACEHOLDER_COVERS[Math.abs(h) % PLACEHOLDER_COVERS.length]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Sugerencia del siguiente artículo. Mismo lenguaje canónico que los
 * "otras capacidades" del final de las páginas de Servicios:
 *   · Icono PlusArrowFlipIcon (line-mask vertical + → ↗ al hover).
 *   · NO line-mask reveal en el título (sería redundante con el icon flip).
 *   · `group` en la raíz para disparar el group-hover del icono.
 * Pegado al footer sin padding-bottom.
 */
export function ArticleNext({ article }: ArticleNextProps) {
  return (
    <CurtainLink
      href={articleHref(article.cat, article.slug)}
      className="group block w-full"
      aria-label={`Siguiente artículo: ${article.title}`}
    >
      {/* Grid sin altura fija: el bloque blanco define el alto via py-12/16
          (mismo rhythm vertical que los enlaces "otras capacidades" del
          final de las páginas de Servicios). La imagen se estira para
          llenar la fila → bottom flush con el top del footer. */}
      <div className="grid grid-cols-12">
        {/* Imagen — sangrado izquierdo total + cols 1-6, stretch vertical */}
        <div className="col-span-12 lg:col-span-6 relative aspect-[4/3] lg:aspect-auto overflow-hidden">
          <div
            className="relative h-full"
            style={{
              marginLeft: 'calc(-1 * max(var(--grid-margin), (100vw - var(--grid-max-w)) / 2))',
              width:
                'calc(100% + max(var(--grid-margin), (100vw - var(--grid-max-w)) / 2))',
            }}
          >
            <Image
              src={getCover(article)}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-expo group-hover:scale-[1.02]"
            />
          </div>
        </div>

        {/* Bloque blanco con icono + título + autor/fecha. py-12/16 = mismo
            rhythm que CapacityOthersAnim. */}
        <div className="col-span-12 lg:col-span-6 bg-pure-white flex flex-col gap-2 py-12 lg:py-16 px-grid-gutter lg:pl-grid-gutter">
          <span
            aria-hidden="true"
            className="text-fg/40 group-hover:text-fg transition-colors duration-300 ease-expo"
          >
            <PlusArrowFlipIcon />
          </span>
          <h2 className="mt-2 font-serif font-light text-subtitle text-fg leading-tight">
            {article.title}
          </h2>
          <p className="mt-1 font-mono text-card-sm text-fg/60">
            {article.author}, {formatDate(article.publishedAt)}
          </p>
        </div>
      </div>
    </CurtainLink>
  )
}
