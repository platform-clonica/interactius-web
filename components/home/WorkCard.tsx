'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

import { Link } from '@/lib/i18n/routing'
import type { RouteId } from '@/lib/i18n/routing'
import { getReducedMotion } from '@/components/motion/useReducedMotion'

/* ==========================================================================
   Types
   ========================================================================== */

type WorkBgColor = 'lavender' | 'opal' | 'bordeaux' | 'emerald'
type WorkAspect = 'square' | '3/2' | '4/3' | '3/4' | '16/9'

export interface WorkCardData {
  client: string
  title: string
  bgColor: WorkBgColor
  aspectRatio: WorkAspect
  gridStart?: number
  gridSpan?: number
  marginTop: number
  imageUrl?: string
  href?: RouteId
}

interface WorkCardProps {
  data: WorkCardData
  index: number
  responsive?: 'desktop' | 'tablet' | 'mobile'
}

/* ==========================================================================
   Component
   ========================================================================== */

const BG_COLOR_CLASS: Record<WorkBgColor, string> = {
  lavender: 'bg-lavender',
  opal: 'bg-opal',
  bordeaux: 'bg-bordeaux',
  emerald: 'bg-emerald',
}

const ASPECT_CLASS: Record<WorkAspect, string> = {
  square: 'aspect-square',
  '3/2': 'aspect-[3/2]',
  '4/3': 'aspect-[4/3]',
  '3/4': 'aspect-[3/4]',
  '16/9': 'aspect-[16/9]',
}

export function WorkCard({ data, responsive = 'desktop' }: WorkCardProps) {
  const cardRef = useRef<HTMLElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  // Reveal lateral canónico al entrar en viewport (cada thumb por separado).
  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      if (reduced) return

      gsap.set(el, { clipPath: 'inset(0 100% 0 0)' })
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(el, {
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

  const Wrapper = (data.href ? Link : 'article') as React.ElementType
  const wrapperProps: Record<string, unknown> = data.href
    ? { href: data.href }
    : {}

  const gridStyle: React.CSSProperties =
    responsive === 'desktop'
      ? {
          gridColumnStart: data.gridStart,
          gridColumnEnd:
            data.gridStart && data.gridSpan
              ? data.gridStart + data.gridSpan
              : undefined,
          marginTop: data.marginTop ? `${data.marginTop}px` : undefined,
          clipPath: 'inset(0 100% 0 0)',
        }
      : { clipPath: 'inset(0 100% 0 0)' }

  return (
    <article ref={cardRef} style={gridStyle}>
      <Wrapper
        {...wrapperProps}
        className={`
          relative block overflow-hidden
          ${BG_COLOR_CLASS[data.bgColor]}
          ${ASPECT_CLASS[data.aspectRatio]}
          ${data.href ? 'hover:opacity-95' : ''}
        `}
      >
        {data.imageUrl && (
          <Image
            src={data.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1280px) 50vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        )}

        <div
          className="absolute bottom-0 left-0
                     max-w-[392px] w-full
                     bg-surface p-5 sm:p-6"
        >
          <span className="block font-mono text-card-sm text-fg/60">
            {data.client}
          </span>
          <h3 className="mt-2 font-serif font-light text-fg text-subtitle leading-none">
            {data.title}
          </h3>
        </div>
      </Wrapper>
    </article>
  )
}
