export interface CapacityService {
  name: string
  description: string
  deliverables: string[]
}

function ServiceItem({
  service,
  isFirst,
}: {
  service: CapacityService
  isFirst: boolean
}) {
  return (
    <div className={`${!isFirst ? 'border-t border-muted' : ''} py-12 lg:py-16`}>
      <h3 className="font-serif font-light text-fg text-section">
        {service.name}
      </h3>

      <p className="mt-6 max-w-[56ch] font-mono text-body-sm text-fg/80">
        {service.description}
      </p>

      {service.deliverables.length > 0 && (
        <ul className="mt-6 flex flex-col gap-2 font-mono text-micro text-fg/60">
          {service.deliverables.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-[2px] shrink-0 text-fg/40">—</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface CapacityServicesProps {
  services: CapacityService[]
  sectionLabel?: string
}

export function CapacityServices({ services, sectionLabel = 'Servicios' }: CapacityServicesProps) {
  return (
    <section className="w-full bg-surface" aria-label={sectionLabel}>
      <div className="section-inner py-section">
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="hidden lg:block lg:col-span-4" aria-hidden="true" />
          <div className="col-span-12 lg:col-span-8">
            {services.map((svc, i) => (
              <ServiceItem
                key={svc.name}
                service={svc}
                isFirst={i === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
