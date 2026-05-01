'use client'

import { useRef, useEffect, useState, useCallback, type ReactNode } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { CapacityGraph } from './CapacityGraph'
import { CapacityVortex } from './CapacityVortex'
import type { CapacityService } from './CapacityGraph'

export type { CapacityService }

// Renderiza inline `<strong>...</strong>` markers desde un string del JSON.
// Permite negritas dentro de `description` sin migrar a t.rich (los services
// se cargan via t.raw para mantener el array como objeto plano).
function renderRich(text: string): ReactNode[] {
  return text.split(/<strong>(.*?)<\/strong>/).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  )
}

/** Calcula el background de los pills/labels a partir del accentColor del
 *  servicio. Mantiene el peso visual del bg-grey original (#e8e6e3 sobre
 *  warm-light = ~13 unidades de diferencia por canal) pero teñido del
 *  accent. Alpha = 13 / |distancia_brillo_promedio|. Colores muy
 *  saturados (granate) reciben menos alpha; colores cercanos al bg
 *  (grey-green) reciben más, manteniendo todos un peso perceptual
 *  similar al grey original. */
function computeLabelBg(accentHex: string): string {
  const r = parseInt(accentHex.slice(1, 3), 16)
  const g = parseInt(accentHex.slice(3, 5), 16)
  const b = parseInt(accentHex.slice(5, 7), 16)
  const accentAvg = (r + g + b) / 3
  const warmAvg = 241 // bg warm-light #F5F2ED, promedio RGB
  const distance = Math.max(1, Math.abs(warmAvg - accentAvg))
  const alpha = Math.min(0.4, Math.max(0.05, 13 / distance))
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`
}

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
  /** Si se pasa, el panel sticky usa CapacityVortex (canvas geométrico
   *  scroll-driven) en lugar de CapacityGraph estático. El color tiñe
   *  el gradient diagonal del stroke. */
  accentColor?: string
  /** Tipo de geometría base del vortex. 'polygon' (default) para
   *  pensamiento, 'ellipse' para experiencias, 'wave' para
   *  transformación cultural. */
  shapeKind?: 'polygon' | 'ellipse' | 'wave'
}

export function CapacityServicesAnim({
  services,
  sectionLabel,
  capacityLabel,
  accentColor,
  shapeKind,
}: CapacityServicesAnimProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  // Trigger del vortex: el wrapper de los bloques de subservicios. Mapea
  // limpio cada bloque a un punto del progress (block 0 top → 0, block N-1
  // top → 1), sin offset por el py-section de la sección.
  const blocksRef = useRef<HTMLDivElement>(null)
  // Fondo blanco bajo el vortex (col 1-5). Se revela cuando arranca el
  // mount-in del vortex y se oculta cuando termina el mount-out — mismos
  // triggers que CapacityVortex pero animando clip-path lateral.
  const whiteBgRef = useRef<HTMLDivElement>(null)
  // Background calculado de los pills de deliverables — accent del
  // servicio con alpha para mantener el peso visual del bg-grey original.
  const labelBg = accentColor ? computeLabelBg(accentColor) : null
  // Cada wrapper es min-h-screen (un subservicio = una pantalla). Observamos
  // el wrapper; title/body/tags son descendientes vía querySelector.
  const blockRefs  = useRef<(HTMLDivElement | null)[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  // Callback ref para capturar el wrapper de cada servicio
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
      const [{ default: gsap }, scrollTriggerMod, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
      ])
      const ScrollTrigger = scrollTriggerMod.ScrollTrigger
      gsap.registerPlugin(ScrollTrigger)

      const splits: InstanceType<typeof SplitType>[] = []
      type ScrollTriggerInstance = { kill: () => void }
      const scrollTriggers: ScrollTriggerInstance[] = []

      // Fondo blanco bajo el vortex — animación clip-path tied a los
      // mismos rangos de mount-in/out que CapacityVortex. Composición:
      // - mount-in scrub: right inset 100% → 0% (reveal de izquierda a derecha)
      // - mount-out scrub: left inset 0% → 100% (hide saliendo por la derecha)
      // El clip-path final es `inset(0 RIGHT% 0 LEFT%)`. Antes de mount-in
      // ambos contribuyen a hacerlo invisible; durante el rango activo se
      // ven progresivamente; después de mount-out de nuevo invisible.
      const whiteBgEl = whiteBgRef.current
      const triggerEl = blocksRef.current
      if (whiteBgEl && triggerEl && accentColor && !reduced) {
        let mountIn = 0
        let mountOut = 0
        const updateBg = () => {
          const rightInset = (1 - mountIn) * 100
          const leftInset = mountOut * 100
          whiteBgEl.style.clipPath = `inset(0 ${rightInset}% 0 ${leftInset}%)`
        }
        updateBg()

        scrollTriggers.push(
          ScrollTrigger.create({
            trigger: triggerEl,
            start: 'top 65%',
            end: 'top top',
            scrub: true,
            onUpdate: (self) => {
              mountIn = self.progress
              updateBg()
            },
          }),
        )
        scrollTriggers.push(
          ScrollTrigger.create({
            trigger: triggerEl,
            start: 'bottom bottom',
            end: 'bottom 65%',
            scrub: true,
            onUpdate: (self) => {
              mountOut = self.progress
              updateBg()
            },
          }),
        )
      } else if (whiteBgEl && accentColor && reduced) {
        // Reduced motion: bg blanco estático visible (sin animación)
        whiteBgEl.style.clipPath = 'inset(0 0% 0 0%)'
      }

      if (reduced) {
        blocks.forEach((wrapper) => {
          const elements = wrapper.querySelectorAll('[data-service-title],[data-service-body],[data-service-tags]')
          gsap.set(elements, { clearProps: 'all' })
        })
        cleanupRef.current = () => {
          scrollTriggers.forEach((st) => st.kill())
        }
        return
      }

      // ── Por cada bloque: estado inicial + IntersectionObserver ────────────
      const observers: IntersectionObserver[] = []

      blocks.forEach((wrapper, i) => {
        const titleEl = wrapper.querySelector<HTMLElement>('[data-service-title]')
        const bodyEl = wrapper.querySelector<HTMLElement>('[data-service-body]')
        const tagsEl = wrapper.querySelector<HTMLElement>('[data-service-tags]')

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
        revealObserver.observe(wrapper)
        observers.push(revealObserver)

        // IntersectionObserver para activeIndex (centro del viewport)
        const activeObserver = new IntersectionObserver(
          ([entry]) => { if (entry?.isIntersecting) setActiveIndex(i) },
          { threshold: 0, rootMargin: '-40% 0px -40% 0px' },
        )
        activeObserver.observe(wrapper)
        observers.push(activeObserver)
      })

      cleanupRef.current = () => {
        splits.forEach((s) => s.revert())
        observers.forEach((o) => o.disconnect())
        scrollTriggers.forEach((st) => st.kill())
      }
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="w-full bg-warm-light relative"
      aria-label={sectionLabel}
    >
      {/* ── Layer del graph — absolute fill de la sección. Sticky interno se
            ancla al viewport y permanece visible mientras los subservicios
            scrollean por la derecha. Dos variantes:
            · Vortex (accentColor): canvas full-width de la sección, z-10 →
              queda por encima de los bloques de texto (que son z-auto). La
              forma se sesga a la izquierda via centerXFrac y puede
              extenderse libremente (incluso cortarse por bordes y solapar
              con el área de texto, donde se ve por encima).
            · CapacityGraph (sin accentColor): layout original constreñido
              a col-span-4 con flex-center, sin z-index extra. ───────────── */}
      {accentColor ? (
        <>
          {/* Fondo blanco bajo el vortex — se extiende desde el borde
              izquierdo del viewport (incluido el sangrado y la zona del
              sidebar) hasta el final visual de col-5 del grid canónico.
              Sin z-index propio: el vortex (DOM más abajo) pinta encima.
              Sticky h-screen para que acompañe al vortex en todo momento.
              Reveal vía clip-path lateral en mount-in/out (ScrollTriggers
              que mirran los del vortex). */}
          <div
            className="hidden lg:block absolute inset-0 pointer-events-none"
            aria-hidden="true"
          >
            <div className="sticky top-0 h-screen">
              <div className="section-inner h-full">
                <div className="grid grid-cols-12 gap-grid-gutter h-full">
                  <div
                    ref={whiteBgRef}
                    className="col-start-1 col-span-5 h-full bg-pure-white"
                    style={{
                      // Extiende leftward al borde del viewport sumando
                      // grid-margin (padding del section-inner) + bleed
                      // (mitad del espacio sobrante cuando viewport > grid-max-w).
                      marginLeft:
                        'calc(-1 * (var(--grid-margin) + max(0px, (100vw - var(--grid-max-w)) / 2)))',
                      width:
                        'calc(100% + var(--grid-margin) + max(0px, (100vw - var(--grid-max-w)) / 2))',
                      clipPath: 'inset(0 100% 0 0%)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div
            className="hidden lg:block absolute inset-0 z-10 pointer-events-none"
            aria-hidden="true"
          >
            <div className="sticky top-0 h-screen pointer-events-none">
              <CapacityVortex
                shapeCount={services.length}
                accentColor={accentColor}
                triggerRef={blocksRef}
                centerXFrac={0.22}
                shapeKind={shapeKind}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="hidden lg:block absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="section-inner h-full">
            <div className="grid grid-cols-12 gap-grid-gutter h-full">
              <div className="col-start-1 col-span-4 h-full">
                <div className="sticky top-0 h-screen flex items-center justify-center pointer-events-auto">
                  <CapacityGraph
                    services={services}
                    activeIndex={activeIndex}
                    capacityLabel={capacityLabel}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Subservicios — cada uno ocupa una pantalla completa
            (lg:min-h-screen + flex items-center). Wrapper full-width
            (col-span-12) en el outer grid; inner grid-cols-12 con mismo
            ancho y gap → cols alineadas pixel-perfect con el sistema
            canónico. Patrón equivalente al de IdentidadValores: panel
            sticky a la izquierda + paneles full-viewport scrolleando. ────── */}
      <div className="section-inner py-section relative">
        <div ref={blocksRef} className="grid grid-cols-12 gap-grid-gutter">
          {services.map((svc, i) => (
            <div
              key={svc.name}
              ref={(el) => setBlockRef(el, i)}
              className="col-span-12 lg:min-h-screen lg:flex lg:items-center py-12 lg:py-0"
            >
              <div className="grid grid-cols-12 gap-x-grid-gutter gap-y-6 w-full">
                {/* Título — outer col 6, span 6. text-title-sm. */}
                <h3
                  data-service-title
                  className="col-span-12 lg:col-start-6 lg:col-span-6 font-serif font-light text-fg text-title-sm"
                >
                  {svc.name}
                </h3>

                {/* Body + labels — outer col 7, span 5. Salto diagonal.
                    No mt-6 aquí: el row-gap del grid (gap-y-6 = 24px, igual
                    que IdentidadValores) ya provee la separación con el título. */}
                <div className="col-span-12 lg:col-start-7 lg:col-span-5">
                  {/* description puede contener varios párrafos separados por \n\n */}
                  {svc.description.split(/\n\n+/).map((para, i) => (
                    <p
                      key={i}
                      data-service-body
                      className={`font-mono text-body-sm text-fg ${i > 0 ? 'mt-6' : ''}`}
                    >
                      {renderRich(para)}
                    </p>
                  ))}

                  {svc.deliverables.length > 0 && (
                    <ul
                      data-service-tags
                      className="mt-6 flex flex-col gap-2"
                      aria-label="Entregables"
                    >
                      {svc.deliverables.map((tag) => (
                        <li key={tag}>
                          <span
                            className={`inline-block px-1.5 py-1 font-mono text-label text-fg leading-tight${labelBg ? '' : ' bg-grey'}`}
                            style={labelBg ? { backgroundColor: labelBg } : undefined}
                          >
                            {renderRich(tag)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
