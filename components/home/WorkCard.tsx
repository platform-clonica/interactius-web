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

const LATERAL_EASE = 'cubic-bezier(.16,1,.3,1)'

export function WorkCard({ data, responsive = 'desktop' }: WorkCardProps) {
  const cardRef = useRef<HTMLElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const clientLabelRef = useRef<HTMLDivElement>(null)
  const titleLabelRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  // Reveal lateral canónico — body + labels en cascada, cada una independiente
  useEffect(() => {
    const cardEl = cardRef.current
    const bodyEl = bodyRef.current
    const clientEl = clientLabelRef.current
    const titleEl = titleLabelRef.current
    if (!cardEl || !bodyEl || !clientEl || !titleEl) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      if (reduced) {
        gsap.set([bodyEl, clientEl, titleEl], { clipPath: 'inset(0 0% 0 0)' })
        return
      }

      gsap.set([bodyEl, clientEl, titleEl], { clipPath: 'inset(0 100% 0 0)' })

      const st = ScrollTrigger.create({
        trigger: cardEl,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(bodyEl, {
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.9,
            ease: LATERAL_EASE,
          })
          gsap.to(clientEl, {
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.6,
            ease: LATERAL_EASE,
            delay: 0.5,
          })
          gsap.to(titleEl, {
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.6,
            ease: LATERAL_EASE,
            delay: 0.65,
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
        }
      : {}

  return (
    <article ref={cardRef} style={gridStyle}>
      <Wrapper
        {...wrapperProps}
        className={`
          relative block overflow-hidden
          ${ASPECT_CLASS[data.aspectRatio]}
          ${data.href ? 'hover:opacity-95' : ''}
        `}
      >
        {/* Body — bg + imagen, con clip-path lateral propio */}
        <div
          ref={bodyRef}
          className={`absolute inset-0 overflow-hidden ${BG_COLOR_CLASS[data.bgColor]}`}
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
        </div>

        {/* Labels — pill de cliente + pill de título, cada una con clip-path
            propio. Mismo lenguaje que las labels del equipo (IdentidadGente). */}
        <div className="absolute bottom-0 left-0 flex flex-col pointer-events-none max-w-[calc(100%-12px)]">
          <div
            ref={clientLabelRef}
            className="bg-warm-light px-[6px] py-[2px] self-start"
          >
            <p className="font-mono text-micro text-fg leading-[1.4] whitespace-nowrap">
              {data.client}
            </p>
          </div>
          <div
            ref={titleLabelRef}
            className="bg-warm-light px-[6px] py-[2px] self-start w-fit max-w-[80%]"
          >
            <p className="font-serif font-light text-[clamp(16px,1.5vw,22px)] text-fg leading-[1.15]">
              {data.title}
            </p>
          </div>
        </div>
      </Wrapper>
    </article>
  )
}
