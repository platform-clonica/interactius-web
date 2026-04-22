'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { CapacityGraph } from './CapacityGraph'
import type { CapacityService } from './CapacityGraph'

export type { CapacityService }

/* ==========================================================================
   CapacityServicesAnim — gráfico sticky + bloques animados (sección 3/4)
   --------------------------------------------------------------------------
   Layout:
   · Izquierda (sticky, 100vh): CapacityGraph con activeIndex reactivo
   · Derecha (scroll): bloques de servicio

   Por bloque (IntersectionObserver threshold 0.15):
     subtitle → SplitType line-mask, 1s, power4.out
     body     → SplitType line-mask, +0.1s
     tags     → opacity 0→1, +0.2s
   ========================================================================== */

interface CapacityServicesAnimProps {
  services: CapacityService[]
  sectionLabel: string
  capacityLabel: string
}

export function CapacityServicesAnim({
  services,
  sectionLabel,
  capacityLabel,
}: CapacityServicesAnimProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const blockRefs  = useRef<(HTMLDivElement | null)[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  // Callback ref para capturar divs de cada bloque
  const setBlockRef = useCallback(
    (el: HTMLDivElement | null, i: number) => {
      blockRefs.current[i] = el
    },
    [],
  )

  useEffect(() => {
    const blocks = blockRefs.current.filter(Boolean) as HTMLDivElement[]
    if (blocks.length === 0) return

    const reduced = getReducedMotion()

    void (async () => {
      const [{ default: gsap }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('split-type'),
      ])

      const splits: InstanceType<typeof SplitType>[] = []

      if (reduced) {
        blocks.forEach((block) => {
          gsap.set(block.querySelectorAll('[data-service-title],[data-service-body],[data-service-tags]'), { clearProps: 'all' })
        })
        return
      }

      // ── Por cada bloque: estado inicial + IntersectionObserver ────────────
      const observers: IntersectionObserver[] = []

      blocks.forEach((block, i) => {
        const titleEl = block.querySelector<HTMLElement>('[data-service-title]')
        const bodyEl  = block.querySelector<HTMLElement>('[data-service-body]')
        const tagsEl  = block.querySelector<HTMLElement>('[data-service-tags]')

        // SplitType
        const titleSplit = titleEl ? new SplitType(titleEl, { types: 'lines' }) : null
        const bodySplit  = bodyEl  ? new SplitType(bodyEl,  { types: 'lines' }) : null
        if (titleSplit) splits.push(titleSplit)
        if (bodySplit)  splits.push(bodySplit)

        // Estado inicial oculto
        if (titleSplit?.lines) gsap.set(titleSplit.lines, { y: 40, opacity: 0 })
        if (bodySplit?.lines)  gsap.set(bodySplit.lines,  { y: 30, opacity: 0 })
        if (tagsEl)            gsap.set(tagsEl,           { opacity: 0 })

        let animated = false

        const reveal = () => {
          if (animated) return
          animated = true

          if (titleSplit?.lines) {
            gsap.to(titleSplit.lines, {
              y: 0, opacity: 1,
              duration: 1,
              ease: 'power4.out',
              stagger: 0.07,
            })
          }
          if (bodySplit?.lines) {
            gsap.to(bodySplit.lines, {
              y: 0, opacity: 1,
              duration: 1,
              ease: 'power4.out',
              stagger: 0.05,
              delay: 0.1,
            })
          }
          if (tagsEl) {
            gsap.to(tagsEl, { opacity: 1, duration: 0.6, delay: 0.2 })
          }
        }

        // IntersectionObserver para revelar
        const revealObserver = new IntersectionObserver(
          ([entry]) => { if (entry?.isIntersecting) reveal() },
          { threshold: 0.15 },
        )
        revealObserver.observe(block)
        observers.push(revealObserver)

        // IntersectionObserver para activeIndex (centro del viewport)
        const activeObserver = new IntersectionObserver(
          ([entry]) => { if (entry?.isIntersecting) setActiveIndex(i) },
          { threshold: 0, rootMargin: '-40% 0px -40% 0px' },
        )
        activeObserver.observe(block)
        observers.push(activeObserver)
      })

      cleanupRef.current = () => {
        splits.forEach((s) => s.revert())
        observers.forEach((o) => o.disconnect())
      }
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="w-full bg-surface"
      aria-label={sectionLabel}
    >
      <div className="section-inner py-section">
        <div className="grid grid-cols-12 gap-grid-gutter">

          {/* ── Gráfico sticky — solo desktop ─────────────────────────────── */}
          <div
            className="hidden lg:flex lg:col-span-4 items-center justify-center"
            aria-hidden="true"
          >
            <div className="sticky top-0 h-screen flex items-center justify-center w-full py-section">
              <CapacityGraph
                services={services}
                activeIndex={activeIndex}
                capacityLabel={capacityLabel}
              />
            </div>
          </div>

          {/* ── Bloques de servicio ───────────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-8">
            {services.map((svc, i) => (
              <div
                key={svc.name}
                ref={(el) => setBlockRef(el, i)}
                className={`${i > 0 ? 'border-t border-muted' : ''} py-12 lg:py-16`}
              >
                <h3
                  data-service-title
                  className="font-serif font-light text-fg text-section"
                >
                  {svc.name}
                </h3>

                <p
                  data-service-body
                  className="mt-6 max-w-[56ch] font-mono text-body-sm text-fg/80"
                >
                  {svc.description}
                </p>

                {svc.deliverables.length > 0 && (
                  <ul
                    data-service-tags
                    className="mt-6 flex flex-wrap gap-2"
                    aria-label="Entregables"
                  >
                    {svc.deliverables.map((tag) => (
                      <li
                        key={tag}
                        className="font-mono text-micro text-fg/60 border border-fg/20 px-3 py-1 rounded-full"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
