import { HeroTagline } from './HeroTagline'
import { HeroMedia } from './HeroMedia'

interface HeroScrollProps {
  posterSrc?: string
  posterAlt?: string
  videoSrc?: string
}

export function HeroScroll({
  posterSrc = '/home/hero-poster.webp',
  posterAlt = '',
  videoSrc,
}: HeroScrollProps) {
  return (
    <section
      aria-label="Hero"
      className="relative h-screen w-full overflow-hidden bg-warm-light"
    >
      <HeroMedia
        posterSrc={posterSrc}
        posterAlt={posterAlt}
        videoSrc={videoSrc}
      />
      <HeroTagline />
    </section>
  )
}
