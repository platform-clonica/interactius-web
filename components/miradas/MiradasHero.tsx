import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

export async function MiradasHero() {
  const t = await getTranslations('miradas')

  return (
    <section
      className="relative w-full min-h-screen overflow-hidden bg-warm-light"
      aria-label="Cabecera Miradas"
    >
      {/* Banner image — from grid-margin to right edge */}
      <div
        className="absolute right-0 overflow-hidden"
        style={{
          left: 'var(--grid-margin)',
          top: 'clamp(80px, 12vh, 130px)',
          height: 'clamp(280px, 51vh, 550px)',
        }}
      >
        <Image
          src="/miradas/hero-banner.jpg"
          alt="Miradas — reflexiones sobre diseño y estrategia"
          fill
          priority
          sizes="(min-width: 901px) calc(100vw - var(--grid-margin)), 100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Subtitle — bottom of hero */}
      <div className="absolute bottom-0 left-0 right-0 section-inner pb-12 lg:pb-16">
        <p className="font-serif font-light text-section text-fg max-w-[50ch]">
          {t('hero.subtitlePrefix')}{' '}
          <span className="font-normal">{t('hero.subtitleBold')}</span>
          {' '}{t('hero.subtitleSuffix')}
        </p>
      </div>
    </section>
  )
}
