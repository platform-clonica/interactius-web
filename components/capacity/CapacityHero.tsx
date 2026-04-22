import { CapacityHeroAnim } from './CapacityHeroAnim'

export interface CapacityHeroProps {
  title: string
  lead: string
  imageSrc?: string
  imageAlt?: string
}

export function CapacityHero({
  title,
  lead,
  imageSrc = '/home/hero-poster.webp',
  imageAlt = '',
}: CapacityHeroProps) {
  return (
    <CapacityHeroAnim
      title={title}
      lead={lead}
      imageSrc={imageSrc}
      imageAlt={imageAlt}
    />
  )
}
