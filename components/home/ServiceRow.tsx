'use client'

import { useEffect, useRef } from 'react'

import type { RouteId } from '@/lib/i18n/navigation'
import { CurtainLink } from '@/components/layout/CurtainLink'
import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { PlusArrowFlipIcon } from '@/components/ui/PlusArrowFlipIcon'
import { CAPACITY_ACCENTS, computeLabelBg } from '@/components/capacity/accents'
import { CapacityVortex, type VortexController } from '@/components/capacity/CapacityVortex'

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
  // Controller del vortex: el parent escribe `mountIn` vía GSAP en hover/
  // hover-out, CapacityVortex lee de aquí cada frame y dibuja.
  const vortexCtrlRef = useRef<VortexController>({
    mountIn: 0,
    mountOut: 0,
    progress: 0,
  })

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

  // Hover-driven mount-in / mount-out del vortex.
  // Duración + easing alineados con la line-mask flip del titular y con el
  // morph del PlusArrowFlipIcon — todo el conjunto entra/sale al mismo tempo.
  // overwrite:'auto' permite interrumpir mid-animation si entras-sales-entras
  // rápido; la nueva tween arranca desde el `mountIn` actual sin saltos.
  useEffect(() => {
    const rowEl = rowRef.current
    if (!rowEl) return

    let detach: (() => void) | undefined
    void (async () => {
      const { default: gsap } = await import('gsap')
      const reduced = getReducedMotion()
      if (reduced) return

      const ease = 'cubic-bezier(.45,0,.15,1)'
      const duration = 0.5

      const handleEnter = () => {
        gsap.to(vortexCtrlRef.current, {
          mountIn: 1,
          duration,
          ease,
          overwrite: 'auto',
        })
      }
      const handleLeave = () => {
        gsap.to(vortexCtrlRef.current, {
          mountIn: 0,
          duration,
          ease,
          overwrite: 'auto',
        })
      }

      rowEl.addEventListener('mouseenter', handleEnter)
      rowEl.addEventListener('mouseleave', handleLeave)
      detach = () => {
        rowEl.removeEventListener('mouseenter', handleEnter)
        rowEl.removeEventListener('mouseleave', handleLeave)
      }
    })()

    return () => detach?.()
  }, [])

  const InnerWrapper = (data.href ? CurtainLink : 'div') as React.ElementType
  const wrapperProps = data.href ? { href: data.href } : {}

  // Label bg tintado del accent del servicio. Mismo cálculo (computeLabelBg)
  // que en CapacityServicesAnim para mantener el peso visual idéntico al
  // bg-grey original. Sin href → fallback a bg-grey via className.
  const accent =
    data.href && data.href in CAPACITY_ACCENTS
      ? CAPACITY_ACCENTS[data.href as keyof typeof CAPACITY_ACCENTS]
      : undefined
  const labelBg = accent ? computeLabelBg(accent.accentColor) : null

  return (
    <div ref={rowRef} className="group relative w-full transition-colors duration-300 ease-expo hover:bg-pure-white">
      {/* Vortex background — hover-driven, debajo de strokes y contenido.
          Mismo render que el vortex sticky de las páginas de servicio, pero
          en modo controller (sin ScrollTrigger) y disableDrift (estático
          una vez formado). Solo se monta si hay accent (i.e. la fila apunta
          a una capacidad conocida). shapeCount=1 → solo la primera forma,
          progress fijo en 0 (no morph entre subservicios en el home).
          Sangrado vertical: el wrapper se extiende 150% del rowH por encima
          del row y termina al 30% del rowH (no llega al borde inferior).
          Así la figura, centrada en el canvas extendido, queda en la mitad
          superior del row con su parte alta sobresaliendo por arriba y la
          inferior cómodamente dentro (sin enmascarar por abajo). */}
      {accent && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(-150%+200px)] bottom-[calc(30%-200px)] pointer-events-none opacity-60 translate-x-[100px]"
        >
          <CapacityVortex
            shapeCount={1}
            accentColor={accent.accentColor}
            strokeColor={'strokeColor' in accent ? accent.strokeColor : undefined}
            shapeKind={accent.shapeKind}
            triggerRef={rowRef}
            centerXFrac={0.22}
            radiusFactor={0.35 * ('homeSizeMultiplier' in accent ? accent.homeSizeMultiplier : 1)}
            lockY
            disableDrift
            controller={vortexCtrlRef}
          />
        </div>
      )}

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

          {/* Descripción + labels — col 7-11 (desktop) / col-start-2 col-span-11 (mobile, alineado con el titular) */}
          <div className="col-start-2 col-span-11 lg:col-start-7 lg:col-span-5 mt-6 lg:mt-0">
            <p className="font-mono text-body-sm text-fg max-w-[52ch]">
              {data.description}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {data.services.map((svc) => (
                <li key={svc}>
                  <span
                    className={`inline-block px-1.5 py-1 font-mono text-label text-fg leading-tight${labelBg ? '' : ' bg-grey'}`}
                    style={labelBg ? { backgroundColor: labelBg } : undefined}
                  >
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

