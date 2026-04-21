import Image from 'next/image'

interface HeroMediaProps {
  posterSrc: string
  posterAlt: string
  videoSrc?: string
}

export function HeroMedia({ posterSrc, posterAlt, videoSrc }: HeroMediaProps) {
  return (
    <div
      className="pointer-events-none absolute bottom-0 -z-[1] overflow-hidden"
      style={{
        left: 'var(--grid-margin)',
        right: 0,
        height: 'clamp(200px, 45vh, 550px)',
      }}
      aria-hidden="true"
    >
      <Image
        src={posterSrc}
        alt={posterAlt}
        fill
        priority
        fetchPriority="high"
        sizes="(min-width: 901px) calc(86vw - 60px), 100vw"
        className="object-cover object-center"
      />

      {videoSrc && (
        <video
          src={videoSrc}
          muted
          loop
          playsInline
          autoPlay
          poster={posterSrc}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  )
}
