import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

export async function IdentidadHero() {
  const t = await getTranslations('identidad')

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-warm-light" aria-label="Hero">
      {/* Right image — from ~58% to right edge, full height */}
      <div
        className="absolute top-0 bottom-0 right-0 hidden lg:block"
        style={{ left: '58.2%' }}
      >
        <Image
          src="/identidad/hero-right.jpg"
          alt={t('hero.imageAlt')}
          fill
          priority
          sizes="42vw"
          className="object-cover object-center"
        />
      </div>

      <div className="relative z-content section-inner">
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-12 pt-[calc(80px+18vh)] pb-20 lg:pb-32">
            <h1 className="font-serif font-light text-display text-fg leading-none tracking-[-0.02em]">
              {t('hero.title')}
            </h1>
            <div className="flex flex-col gap-6 font-mono text-body text-fg">
              <p>
                {t.rich('hero.body1', {
                  strong: (chunks) => <strong className="font-semibold">{chunks}</strong>,
                })}
              </p>
              <p>
                {t.rich('hero.body2', {
                  strong: (chunks) => <strong className="font-semibold">{chunks}</strong>,
                })}
              </p>
              <p>
                {t.rich('hero.body3', {
                  strong: (chunks) => <strong className="font-semibold">{chunks}</strong>,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile image */}
      <div className="relative w-full aspect-[3/2] lg:hidden overflow-hidden">
        <Image
          src="/identidad/hero-right.jpg"
          alt={t('hero.imageAlt')}
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
    </section>
  )
}
