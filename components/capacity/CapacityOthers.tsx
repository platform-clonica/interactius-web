import { Link } from '@/lib/i18n/routing'
import type { RouteId } from '@/lib/i18n/routing'

export interface CapacityOtherItem {
  title: string
  description: string
  href: RouteId
}

export function CapacityOthers({
  items,
  sectionLabel,
}: {
  items: [CapacityOtherItem, CapacityOtherItem]
  sectionLabel: string
}) {
  return (
    <section
      className="w-full border-t border-muted"
      aria-label={sectionLabel}
    >
      <div className="section-inner">
        <div className="grid grid-cols-12">
          {items.map((item, i) => (
            <Link
              key={item.href}
              href={item.href as Exclude<RouteId, '/miradas/[cat]/[slug]'>}
              className={`
                col-span-12 lg:col-span-6
                flex flex-col gap-4 py-12 lg:py-16
                ${i === 0 ? 'lg:border-r lg:border-muted lg:pr-grid-gutter' : 'border-t border-muted lg:border-t-0 lg:pl-grid-gutter'}
                hover:opacity-60 focus-visible:opacity-60
              `}
            >
              <span aria-hidden="true" className="font-mono text-micro text-fg/40">→</span>
              <span className="font-serif font-light text-fg text-title">
                {item.title}
              </span>
              <span className="font-mono text-body-sm text-fg/60 max-w-[40ch]">
                {item.description}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
