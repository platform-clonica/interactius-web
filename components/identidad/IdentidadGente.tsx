import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

export async function IdentidadGente() {
  const t = await getTranslations('identidad')

  return (
    <section className="w-full bg-dark overflow-hidden" aria-labelledby="gente-title">
      <div className="section-inner pt-section pb-16">
        <h2
          id="gente-title"
          className="font-serif font-normal text-section text-warm-light"
        >
          {t('gente.title')}
        </h2>

        <p className="mt-16 font-serif font-light text-display text-warm-light text-center mx-auto max-w-[18ch]">
          {t('gente.description')}
        </p>
      </div>

      {/* Team photos row — scattered heights */}
      <div className="relative flex items-end gap-4 px-[var(--grid-margin)] pb-section overflow-x-hidden">
        <div className="relative flex-shrink-0 w-[clamp(160px,15.8vw,303px)] h-[clamp(180px,29vh,317px)] mb-24">
          <Image src="/identidad/team.jpg" alt={t('gente.imageAlt')} fill sizes="16vw"
            className="object-cover grayscale" style={{ objectPosition: '22% 10%' }} />
        </div>
        <div className="relative flex-shrink-0 w-[clamp(160px,15.8vw,303px)] h-[clamp(180px,29vh,317px)] mb-0">
          <Image src="/identidad/team.jpg" alt={t('gente.imageAlt')} fill sizes="16vw"
            className="object-cover grayscale" style={{ objectPosition: '36% 10%' }} />
        </div>
        <div className="relative flex-shrink-0 w-[clamp(160px,15.8vw,303px)] h-[clamp(180px,29vh,317px)] mb-16">
          <Image src="/identidad/team.jpg" alt={t('gente.imageAlt')} fill sizes="16vw"
            className="object-cover grayscale" style={{ objectPosition: '63% 10%' }} />
        </div>
        <div className="relative flex-shrink-0 w-[clamp(160px,15.8vw,303px)] h-[clamp(180px,29vh,317px)] mb-4">
          <Image src="/identidad/team.jpg" alt={t('gente.imageAlt')} fill sizes="16vw"
            className="object-cover grayscale" style={{ objectPosition: '77% 10%' }} />
        </div>
        <div className="relative flex-shrink-0 w-[clamp(160px,15.8vw,303px)] h-[clamp(180px,29vh,317px)] mb-20">
          <Image src="/identidad/team.jpg" alt={t('gente.imageAlt')} fill sizes="16vw"
            className="object-cover grayscale" style={{ objectPosition: '90% 10%' }} />
        </div>
      </div>
    </section>
  )
}
