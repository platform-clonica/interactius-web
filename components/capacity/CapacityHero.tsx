import type { ReactNode } from 'react'

import { CapacityHeroAnim } from './CapacityHeroAnim'

export interface CapacityHeroProps {
  title: string
  lead: ReactNode
  imageSrc?: string
  imageAlt?: string
  imageBottomSrc?: string
  imageBottomAlt?: string
  topOffsetPx?: number
}

export function CapacityHero({
  title,
  lead,
  imageSrc = '/home/hero-poster.webp',
  imageAlt = '',
  imageBottomSrc,
  imageBottomAlt,
  topOffsetPx,
}: CapacityHeroProps) {
  return (
    <CapacityHeroAnim
      title={title}
      lead={lead}
      imageSrc={imageSrc}
      imageAlt={imageAlt}
      imageBottomSrc={imageBottomSrc}
      imageBottomAlt={imageBottomAlt}
      topOffsetPx={topOffsetPx}
    />
  )
}
