'use client'

import { useCallback, useRef, useEffect } from 'react'

import { Link } from '@/lib/i18n/navigation'
import type { RouteId } from '@/lib/i18n/navigation'
import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { usePageCurtainStore } from '@/lib/store/curtain'

/* ==========================================================================
   CapacityOthersAnim — tarjetas con clip-path lateral (sección 4/4)
   --------------------------------------------------------------------------
   Dos tarjetas de "otras capacidades" animadas al entrar en el viewport:

   IntersectionObserver (threshold 0):
     Tarjeta 1: clip-path inset(0 100% 0 0) → inset(0 0% 0 0), 0.8s, power3.out
     Tarjeta 2: mismo, delay 0.15s
     Tras clip-path complete: SplitType line-mask de textos internos
   ========================================================================== */

export interface CapacityOtherItem {
  title: string
  description: string
  href: RouteId
}

interface CapacityOthersAnimProps {
  items: [CapacityOtherItem, CapacityOtherItem]
  sectionLabel: string
}

export function CapacityOthersAnim({
  items,
  sectionLabel,
}: CapacityOthersAnimProps) {
  const beginPageCurtain = usePageCurtainStore((s) => s.beginPageCurtain)

  // Click handler — intercepta navegación interna y dispara la cortina global.
  // Cmd/Ctrl/Shift/Alt clicks o middle-click se dejan pasar (abrir en pestaña).
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      e.preventDefault()
      beginPageCurtain(href)
    },
    [beginPageCurtain],
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const card0Ref = useRef<HTMLAnchorElement>(null)
  const card1Ref = useRef<HTMLAnchorElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const card0 = card0Ref.current
    const card1 = card1Ref.current
    if (!card0 || !card1) return

    void (async () => {
      const [{ default: gsap }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('split-type'),
      ])

      const reduced = getReducedMotion()

      if (reduced) {
        gsap.set([card0, card1], { clearProps: 'all' })
        return
      }

      // ── Estado inicial ─────────────────────────────────────────────────────
      gsap.set(card0, { clipPath: 'inset(0 100% 0 0)' })
      gsap.set(card1, { clipPath: 'inset(0 100% 0 0)' })

      // ── Función para revelar textos de una tarjeta ────────────────────────
      const revealCardText = (card: HTMLElement) => {
        const titleEl = card.querySelector<HTMLElement>('[data-other-title]')
        const descEl  = card.querySelector<HTMLElement>('[data-other-desc]')
        const arrowEl = card.querySelector<HTMLElement>('[data-other-arrow]')

        if (!titleEl) return
        const splits: InstanceType<typeof SplitType>[] = []

        const titleSplit = new SplitType(titleEl, { types: 'lines' })
        const descSplit  = descEl ? new SplitType(descEl, { types: 'lines' }) : null
        splits.push(titleSplit)
        if (descSplit) splits.push(descSplit)

        gsap.set(titleSplit.lines ?? [], { y: 30, opacity: 0 })
        if (descSplit?.lines) gsap.set(descSplit.lines, { y: 20, opacity: 0 })
        if (arrowEl) gsap.set(arrowEl, { opacity: 0 })

        gsap.to(titleSplit.lines ?? [], {
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

        // Cleanup splits cuando termine
        setTimeout(() => splits.forEach((s) => s.revert()), 2000)
      }

      let triggered = false

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting || triggered) return
          triggered = true

          // Tarjeta 0
          gsap.to(card0, {
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.8,
            ease: 'power4.inOut',
            onComplete: () => revealCardText(card0),
          })

          // Tarjeta 1 con stagger
          gsap.to(card1, {
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.8,
            ease: 'power4.inOut',
            delay: 0.15,
            onComplete: () => revealCardText(card1),
          })
        },
        { threshold: 0.1 },
      )

      const container = containerRef.current
      if (container) observer.observe(container)

      cleanupRef.current = () => observer.disconnect()
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section
      className="w-full bg-pure-white border-t border-muted"
      aria-label={sectionLabel}
    >
      <div className="section-inner">
        <div
          ref={containerRef}
          className="grid grid-cols-12"
        >
          {items.map((item, i) => (
            <Link
              key={item.href}
              ref={i === 0 ? card0Ref : card1Ref}
              href={item.href as Exclude<RouteId, '/miradas/[cat]/[slug]'>}
              onClick={(e) => handleClick(e, item.href)}
              className={`
                col-span-12 lg:col-span-6
                flex flex-col gap-2 py-12 lg:py-16
                ${i === 0 ? 'lg:border-r lg:border-muted lg:pr-grid-gutter' : 'border-t border-muted lg:border-t-0 lg:pl-grid-gutter'}
                hover:opacity-60 focus-visible:opacity-60
              `}
              style={{ clipPath: 'inset(0 100% 0 0)' }}
            >
              <span data-other-arrow aria-hidden="true" className="text-fg">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0"
                >
                  <line
                    x1="2"
                    y1="20"
                    x2="20"
                    y2="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <polyline
                    points="4,2 20,2 20,18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </span>
              <span
                data-other-title
                className="font-serif font-light text-fg text-title-sm whitespace-pre-line"
              >
                {item.title}
              </span>
              <span
                data-other-desc
                className="font-mono text-body-sm text-fg/60 max-w-[40ch]"
              >
                {item.description}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
