'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { Link } from '@/lib/i18n/routing'

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
  /** Columna inicial del grid 12 (desktop). Undefined en tablet/mobile. */
  gridStart?: number
  /** Número de columnas que ocupa (desktop). Undefined en tablet/mobile. */
  gridSpan?: number
  /** Offset vertical px para romper el grid regular (desktop). */
  marginTop: number
  /** Opcional Fase 2 — URL de la imagen del proyecto. */
  imageUrl?: string
  /** Opcional Fase 2 — URL del detalle del proyecto. */
  href?: string
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

export function WorkCard({ data, index, responsive = 'desktop' }: WorkCardProps) {
  const ref = useRef<HTMLElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || revealed) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger leve por posición — cada card entra con 80ms de delay
          // respecto a la anterior. Solo aplica a cards que todavía no
          // se han visto (primer viewport).
          setTimeout(() => setRevealed(true), index * 40)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [revealed, index])

  // Props del wrapper — condicional según href existe
  const Wrapper = data.href ? Link : 'article'
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
    <article
      ref={ref}
      style={gridStyle}
      className={`
        reveal-clip-lateral
        ${revealed ? 'is-revealed' : ''}
      `}
    >
      <Wrapper
        {...wrapperProps}
        className={`
          relative block overflow-hidden
          ${BG_COLOR_CLASS[data.bgColor]}
          ${ASPECT_CLASS[data.aspectRatio]}
          ${data.href ? 'transition-opacity duration-fast ease-expo hover:opacity-95' : ''}
        `}
      >
        {/* Imagen opcional — Fase 2 */}
        {data.imageUrl && (
          <Image
            src={data.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1280px) 50vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        )}

        {/* Label cliente — pill blanco top-left */}
        <span
          className="absolute left-0 top-0 inline-flex items-center
                     bg-surface px-3 py-[6px]
                     font-mono text-card-sm text-fg"
        >
          {data.client}
        </span>

        {/* Título proyecto — panel blanco bottom-left */}
        <div
          className="absolute bottom-0 left-0
                     max-w-[392px] w-full
                     bg-surface p-5 sm:p-6"
        >
          <h3 className="font-serif font-light text-fg text-title-sm lg:text-subtitle">
            {data.title}
          </h3>
        </div>
      </Wrapper>
    </article>
  )
}
