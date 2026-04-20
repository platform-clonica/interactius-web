'use client'

import { useEffect, useRef, useState } from 'react'

import { Link } from '@/lib/i18n/routing'

interface PillarData {
  number: string
  name: string
  description: string
  services: string[]
  href?: string
}

interface ServiceRowProps {
  data: PillarData
  isFirst: boolean
}

/**
 * ServiceRow — fila individual de un pilar con reveal clip-path lateral (A07).
 *
 * Reveal one-shot cuando entra en viewport (threshold 0.15).
 * Si hay href, toda la fila es un link accesible.
 */
export function ServiceRow({ data, isFirst }: ServiceRowProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || revealed) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -5% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [revealed])

  const InnerWrapper = data.href ? Link : 'div'
  const wrapperProps = data.href ? { href: data.href as never } : {}

  return (
    <div
      ref={ref}
      className={`
        reveal-clip-lateral ${revealed ? 'is-revealed' : ''}
        ${isFirst ? '' : 'border-t border-muted'}
      `}
    >
      <InnerWrapper
        {...wrapperProps}
        className={`
          grid grid-cols-12 gap-grid-gutter py-12 lg:py-16
          ${data.href ? 'group transition-opacity duration-fast ease-expo hover:opacity-70 focus-visible:opacity-70' : ''}
        `}
      >
        {/* Número grande */}
        <div className="col-span-2 lg:col-span-1">
          <span
            className="block font-serif font-light leading-none text-fg
                       text-title-sm
                       lg:text-display"
            aria-hidden="true"
          >
            {data.number}
          </span>
        </div>

        {/* Nombre del pilar */}
        <div className="col-span-10 lg:col-span-3">
          <h3
            className="font-serif font-light text-fg
                       text-subtitle
                       lg:text-section"
          >
            {data.name}
          </h3>

          {/* Descripción + chips en mobile (dentro del mismo stack) */}
          <div className="mt-4 lg:hidden">
            <p className="font-mono text-body-sm text-fg/80">
              {data.description}
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-2 font-mono text-micro text-fg/60">
              {data.services.map((svc, i) => (
                <li key={svc} className="inline-flex items-center">
                  {i > 0 && <span className="mr-3 text-fg/40">·</span>}
                  {svc}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Descripción + chips en desktop (col-span-8) */}
        <div className="hidden lg:col-span-8 lg:block">
          <p className="max-w-[52ch] font-mono text-body-sm text-fg/80 lg:text-body">
            {data.description}
          </p>
          <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-2 font-mono text-micro text-fg/60">
            {data.services.map((svc, i) => (
              <li key={svc} className="inline-flex items-center">
                {i > 0 && <span className="mr-4 text-fg/40">·</span>}
                {svc}
              </li>
            ))}
          </ul>
        </div>
      </InnerWrapper>
    </div>
  )
}
