'use client'

import { useEffect, useRef } from 'react'

import type { RouteId } from '@/lib/i18n/navigation'
import { CurtainLink } from '@/components/layout/CurtainLink'
import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { PlusArrowFlipIcon } from '@/components/ui/PlusArrowFlipIcon'

interface PillarData {
  number: string
  name: string
  description: string
  services: string[]
  href?: RouteId
}

interface ServiceRowProps {
  data: PillarData
}

export function ServiceRow({ data }: ServiceRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  // Reveal lateral del row entero (incluido el stroke full-viewport) al entrar
  useEffect(() => {
    const rowEl = rowRef.current
    if (!rowEl) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      if (reduced) return

      gsap.set(rowEl, { clipPath: 'inset(0 100% 0 0)' })
      const st = ScrollTrigger.create({
        trigger: rowEl,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(rowEl, {
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.9,
            ease: 'cubic-bezier(.16,1,.3,1)',
          })
        },
      })

      cleanupRef.current = () => st.kill()
    })()

    return () => cleanupRef.current?.()
  }, [])

  const InnerWrapper = (data.href ? CurtainLink : 'div') as React.ElementType
  const wrapperProps = data.href ? { href: data.href } : {}

  return (
    <div ref={rowRef} className="group relative w-full">
      {/* Stroke base — top, full viewport (de borde a borde de la página) */}
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-px bg-muted"
      />
      {/* Stroke hover — width 0→100% reveal lateral, full viewport, color fg */}
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 h-px bg-fg w-0 group-hover:w-full transition-[width] duration-700 ease-[cubic-bezier(.16,1,.3,1)]"
      />

      {/* Contenido — section-inner para grid-margin padding consistente */}
      <div className="relative section-inner">
        <InnerWrapper
          {...wrapperProps}
          className="hover-text-flip grid grid-cols-12 gap-grid-gutter py-10 md:py-11 lg:py-12"
        >
          {/* Número — col 3 (desktop) / col 1 (mobile) */}
          <div className="col-span-1 lg:col-start-3 lg:col-span-1 flex items-start pt-1">
            <span
              className="block font-mono text-card-sm text-fg/40"
              aria-hidden="true"
            >
              {data.number}
            </span>
          </div>

          {/* Nombre del pilar — col 4-6 (desktop) / resto del row (mobile).
              Title con line-mask flip on hover (hover-text-flip en parent).
              Cada línea (separada por \n en JSON) hace su propio flip con
              60ms de stagger entre ellas. */}
          <div className="col-span-11 lg:col-start-4 lg:col-span-3">
            <h3 className="font-serif font-light text-fg text-subtitle leading-tight">
              {data.name.split('\n').map((line, lineIdx) => (
                <span key={lineIdx} className="st-mask">
                  <span
                    className="hover-text-flip-target inline-block"
                    style={{ animationDelay: `${lineIdx * 60}ms` }}
                  >
                    {line}
                  </span>
                </span>
              ))}
            </h3>
          </div>

          {/* Descripción + labels — col 7-11 (desktop) / nueva fila (mobile) */}
          <div className="col-span-12 lg:col-start-7 lg:col-span-5 mt-6 lg:mt-0">
            <p className="font-mono text-body-sm text-fg max-w-[52ch]">
              {data.description}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {data.services.map((svc) => (
                <li key={svc}>
                  <span className="inline-block bg-grey px-1.5 py-1 font-mono text-label text-fg leading-tight">
                    {svc}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Plus icon — col 12. Default 40%, hover 100%.
              Todos los pilares usan PlusArrowFlipIcon: line-mask vertical
              entre + y flecha-up-right (stack 40×40 con translate-y -40px
              al hover). */}
          <div className="hidden lg:col-start-12 lg:col-span-1 lg:flex lg:items-start lg:justify-end lg:pt-1 text-fg/40 group-hover:text-fg transition-colors duration-300 ease-expo">
            <PlusArrowFlipIcon />
          </div>
        </InnerWrapper>
      </div>
    </div>
  )
}

