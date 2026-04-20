import Image from 'next/image'

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
    <section
      aria-labelledby="capacity-hero-title"
      className="relative min-h-screen w-full overflow-hidden"
    >
      <div className="hidden lg:block absolute top-0 right-0 h-full w-[42%]">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="42vw"
          className="object-cover"
          priority
        />
      </div>

      <div className="relative z-content section-inner">
        <div className="pt-32 pb-section lg:pt-40 lg:max-w-[55%]">
          <h1
            id="capacity-hero-title"
            className="font-serif font-light text-fg text-title lg:text-display"
          >
            {title}
          </h1>
          <p className="mt-8 max-w-[44ch] font-mono text-body-sm text-fg/70 lg:text-body">
            {lead}
          </p>
        </div>
      </div>
    </section>
  )
}
