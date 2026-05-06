'use client'

import { useCallback, useEffect, useRef } from 'react'

import { Link } from '@/lib/i18n/navigation'
import type { RouteId } from '@/lib/i18n/navigation'
import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { usePageCurtainStore } from '@/lib/store/curtain'
import { PlusArrowFlipIcon } from '@/components/ui/PlusArrowFlipIcon'

/* ==========================================================================
   CapacityOthersAnim — tab strip de los 3 servicios (sección final)
   --------------------------------------------------------------------------
   3 columnas iguales con los 3 servicios en orden canónico.
   - Servicio actual (currentHref): bg-warm-light (se funde con la sección),
     sin flecha, sin link, sin hover.
   - Otros 2: bg-pure-white (cards levantadas), flecha + link + hover-text-flip.

   Los 2 cards "inactivos" entran con clip-path lateral (canónico) cuando
   la sección entra en viewport, con stagger.
   ========================================================================== */

export interface CapacityTabItem {
  title: string
  description: string
  href: RouteId
}

interface CapacityOthersAnimProps {
  tabs: [CapacityTabItem, CapacityTabItem, CapacityTabItem]
  currentHref: RouteId
  sectionLabel: string
}

export function CapacityOthersAnim({
  tabs,
  currentHref,
  sectionLabel,
}: CapacityOthersAnimProps) {
  const beginPageCurtain = usePageCurtainStore((s) => s.beginPageCurtain)

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      e.preventDefault()
      beginPageCurtain(href)
    },
    [beginPageCurtain],
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Array<HTMLElement | null>>([null, null, null])
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const cards = cardRefs.current
    const inactiveCards = cards
      .map((el, i) => ({ el, isActive: tabs[i]?.href === currentHref }))
      .filter((c) => c.el && !c.isActive)
      .map((c) => c.el as HTMLElement)

    if (inactiveCards.length === 0) return

    void (async () => {
      const [{ default: gsap }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('split-type'),
      ])

      const reduced = getReducedMotion()

      if (reduced) {
        gsap.set(inactiveCards, { clearProps: 'all' })
        return
      }

      gsap.set(inactiveCards, { clipPath: 'inset(0 100% 0 0)' })

      const revealCardText = (card: HTMLElement) => {
        const titleEl = card.querySelector<HTMLElement>('[data-other-title]')
        const descEl  = card.querySelector<HTMLElement>('[data-other-desc]')
        const arrowEl = card.querySelector<HTMLElement>('[data-other-arrow]')

        if (!titleEl) return
        const splits: InstanceType<typeof SplitType>[] = []

        const titleLines = Array.from(
          titleEl.querySelectorAll<HTMLElement>('.st-mask'),
        )

        const descSplit = descEl ? new SplitType(descEl, { types: 'lines' }) : null
        if (descSplit) splits.push(descSplit)

        gsap.set(titleLines, { y: 30, opacity: 0 })
        if (descSplit?.lines) gsap.set(descSplit.lines, { y: 20, opacity: 0 })
        if (arrowEl) gsap.set(arrowEl, { opacity: 0 })

        gsap.to(titleLines, {
          y: 0, opacity: 1,
          duration: 0.8,
          ease: 'power4.out',
          stagger: 0.06,
        })
        if (descSplit?.lines) {
          gsap.to(descSplit.lines, {
            y: 0, opacity: 1,
            duration: 0.8,
            ease: 'power4.out',
            stagger: 0.04,
            delay: 0.1,
          })
        }
        if (arrowEl) gsap.to(arrowEl, { opacity: 1, duration: 0.4, delay: 0.2 })

        setTimeout(() => splits.forEach((s) => s.revert()), 2000)
      }

      let triggered = false

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting || triggered) return
          triggered = true

          inactiveCards.forEach((card, idx) => {
            gsap.to(card, {
              clipPath: 'inset(0 0% 0 0)',
              duration: 0.8,
              ease: 'power4.inOut',
              delay: idx * 0.15,
              onComplete: () => revealCardText(card),
            })
          })
        },
        { threshold: 0.1 },
      )

      const container = containerRef.current
      if (container) observer.observe(container)

      cleanupRef.current = () => observer.disconnect()
    })()

    return () => cleanupRef.current?.()
  }, [tabs, currentHref])

  return (
    <section
      className="w-full bg-warm-light pb-5 lg:pb-0"
      aria-label={sectionLabel}
    >
      <div className="section-inner">
        <div
          ref={containerRef}
          className="grid grid-cols-12 gap-grid-gutter"
        >
        {tabs.map((tab, i) => {
          const isActive = tab.href === currentHref
          const isFirst = i === 0
          const isLast = i === tabs.length - 1
          const nextInactive =
            i < tabs.length - 1 && tabs[i + 1].href !== currentHref
          const showSeparator = !isActive && nextInactive

          const titleLines = tab.title.split('\n').map((line, lineIdx) => (
            <span key={lineIdx} className="st-mask">
              <span
                className={isActive ? 'inline-block' : 'hover-text-flip-target inline-block'}
                style={isActive ? undefined : { animationDelay: `${lineIdx * 60}ms` }}
              >
                {line}
              </span>
            </span>
          ))

          // Cada tab cae en su col canónica (col-span-4 → col-start auto = 1/5/9).
          // Bg extiende a viewport-edge en first/last y a gutter/2 en lados
          // internos. Padding-x compensatorio (20px + extensión) → contenido
          // queda 20px PASADO el borde izq de su col canónica.
          // Separador 1px entre adyacentes inactivos cae justo donde se juntan
          // los dos bgs (midpoint del gutter original).
          const bgClass = isActive ? 'bg-warm-light' : 'bg-pure-white'
          const sepClass = showSeparator ? 'lg:border-r lg:border-muted' : ''
          const lgEdgeLeft = isFirst
            ? 'lg:ml-[calc(-1_*_var(--grid-margin))] lg:pl-[calc(40px_+_var(--grid-margin))]'
            : 'lg:ml-[calc(-1_*_var(--grid-gutter)_/_2)] lg:pl-[calc(40px_+_var(--grid-gutter)_/_2)]'
          const lgEdgeRight = isLast
            ? 'lg:mr-[calc(-1_*_var(--grid-margin))] lg:pr-[calc(40px_+_var(--grid-margin))]'
            : 'lg:mr-[calc(-1_*_var(--grid-gutter)_/_2)] lg:pr-[calc(40px_+_var(--grid-gutter)_/_2)]'
          const commonClasses =
            `col-span-12 lg:col-span-4 p-10 flex flex-col gap-2 ${bgClass} ${sepClass} ${lgEdgeLeft} ${lgEdgeRight}`

          if (isActive) {
            return (
              <div
                key={tab.href}
                ref={(el) => { cardRefs.current[i] = el }}
                className={`${commonClasses} hidden lg:flex`}
                aria-current="page"
              >
                {/* Spacer invisible: reserva el alto del PlusArrowFlipIcon
                    (size-10 = 40px) para alinear título y descripción con
                    las tabs inactivas. */}
                <span aria-hidden="true" className="block size-10" />
                <span
                  data-other-title
                  className="block font-serif font-light text-fg text-title-sm"
                >
                  {titleLines}
                </span>
                <span
                  data-other-desc
                  className={`font-mono text-body-sm text-fg/60 ${i === 0 ? 'lg:w-full' : 'lg:w-3/4'}`}
                >
                  {tab.description}
                </span>
              </div>
            )
          }

          return (
            <Link
              key={tab.href}
              ref={(el) => { cardRefs.current[i] = el }}
              href={tab.href as Exclude<RouteId, '/miradas/[cat]/[slug]'>}
              onClick={(e) => handleClick(e, tab.href)}
              className={`group hover-text-flip ${commonClasses} focus-visible:opacity-90`}
              style={{ clipPath: 'inset(0 100% 0 0)' }}
            >
              <span
                data-other-arrow
                aria-hidden="true"
                className="text-fg/40 group-hover:text-fg transition-colors duration-300 ease-expo"
              >
                <PlusArrowFlipIcon />
              </span>
              <span
                data-other-title
                className="block font-serif font-light text-fg text-title-sm"
              >
                {titleLines}
              </span>
              <span
                data-other-desc
                className={`font-mono text-body-sm text-fg/60 ${i === 0 ? 'lg:w-full' : 'lg:w-3/4'}`}
              >
                {tab.description}
              </span>
            </Link>
          )
        })}
        </div>
      </div>
    </section>
  )
}
