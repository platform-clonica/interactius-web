import Image from 'next/image'

import { Link } from '@/lib/i18n/routing'
import type { RouteId } from '@/lib/i18n/routing'

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
  const Wrapper = (data.href ? Link : 'article') as React.ElementType
  const wrapperProps: Record<string, unknown> = data.href
    ? { href: data.href }
    : {}

  const gridStyle: React.CSSProperties | undefined =
    responsive === 'desktop'
      ? {
          gridColumnStart: data.gridStart,
          gridColumnEnd:
            data.gridStart && data.gridSpan
              ? data.gridStart + data.gridSpan
              : undefined,
          marginTop: data.marginTop ? `${data.marginTop}px` : undefined,
        }
      : undefined

  return (
    <article style={gridStyle}>
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

        <span
          className="absolute left-0 top-0 inline-flex items-center
                     bg-surface px-3 py-[6px]
                     font-mono text-card-sm text-fg"
        >
          {data.client}
        </span>

        <div
          className="absolute bottom-0 left-0
                     max-w-[392px] w-full
                     bg-surface p-5 sm:p-6"
        >
          <h3 className="font-serif font-light text-fg text-subtitle leading-none">
            {data.title}
          </h3>
        </div>
      </Wrapper>
    </article>
  )
}
