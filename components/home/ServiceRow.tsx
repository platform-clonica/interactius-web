import { Link } from '@/lib/i18n/routing'
import type { RouteId } from '@/lib/i18n/routing'

interface PillarData {
  number: string
  name: string
  description: string
  services: string[]
  href?: RouteId
}

interface ServiceRowProps {
  data: PillarData
  isFirst: boolean
}

export function ServiceRow({ data, isFirst }: ServiceRowProps) {
  const InnerWrapper = (data.href ? Link : 'div') as React.ElementType
  const wrapperProps = data.href ? { href: data.href } : {}

  return (
    <div className={isFirst ? '' : 'border-t border-muted'}>
      <InnerWrapper
        {...wrapperProps}
        className={`
          grid grid-cols-12 gap-grid-gutter py-10 lg:py-12
          ${data.href ? 'hover:opacity-70 focus-visible:opacity-70' : ''}
        `}
      >
        {/* Número */}
        <div className="col-span-1 flex items-start pt-1">
          <span
            className="block font-mono text-card-sm text-fg/40"
            aria-hidden="true"
          >
            {data.number}
          </span>
        </div>

        {/* Nombre del pilar */}
        <div className="col-span-11 lg:col-span-3">
          <h3 className="font-serif font-light text-fg text-title-sm leading-tight">
            {data.name}
          </h3>

          {/* Mobile: descripción + tags */}
          <div className="mt-4 lg:hidden">
            <p className="font-mono text-body-sm text-fg/80">
              {data.description}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {data.services.map((svc) => (
                <li key={svc}>
                  <span className="inline-block bg-grey px-1.5 py-px font-mono text-label text-fg">
                    {svc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Desktop: descripción + tags */}
        <div className="hidden lg:col-span-7 lg:block">
          <p className="max-w-[52ch] font-mono text-body-sm text-fg/80">
            {data.description}
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {data.services.map((svc) => (
              <li key={svc}>
                <span className="inline-block bg-grey px-1.5 py-px font-mono text-label text-fg">
                  {svc}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* + icon */}
        <div className="hidden lg:col-span-1 lg:flex lg:items-start lg:justify-end lg:pt-1">
          <PlusIcon />
        </div>
      </InnerWrapper>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-fg/40"
    >
      <line x1="10" y1="0" x2="10" y2="20" stroke="currentColor" strokeWidth="1" />
      <line x1="0" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}
