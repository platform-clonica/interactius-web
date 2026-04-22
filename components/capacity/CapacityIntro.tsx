import { CapacityIntroAnim } from './CapacityIntroAnim'

export interface CapacityIntroProps {
  statement: string
  clients?: string
  imageSrc?: string
  imageAlt?: string
}

export function CapacityIntro({
  statement,
  clients,
  imageSrc = '/home/hero-poster.webp',
  imageAlt = '',
}: CapacityIntroProps) {
  return (
    <CapacityIntroAnim
      statement={statement}
      clients={clients}
      imageSrc={imageSrc}
      imageAlt={imageAlt}
    />
  )
}
