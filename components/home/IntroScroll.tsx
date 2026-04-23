import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

export async function IntroScroll() {
  const t = await getTranslations('home')

  return (
    <section aria-label={t('intro.ariaLabel')} className="relative w-full bg-bg">

      {/* Texto 1 — lado derecho */}
      <div className="section-inner pt-28 lg:pt-32">
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <div className="flex flex-col gap-6 font-mono text-body-sm text-fg max-w-[34ch]">
              <p>{t('intro.p1')}</p>
              <p className="font-semibold">{t('intro.p2')}</p>
              <p>{t('intro.p3')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Imagen grande con cuadrado blanco + quote superpuesto */}
      <div
        className="relative mt-12 w-full overflow-hidden"
        style={{ height: 'clamp(280px, 57vh, 613px)' }}
      >
        {/* Imagen con blur suave */}
        <div className="absolute blur-[15px]" style={{ inset: '-20px' }}>
          <Image
            src="/home/intro-image.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            aria-hidden
          />
        </div>

        {/* Cuadrado blanco — esquina inferior derecha */}
        <div
          className="absolute bottom-0 right-0 bg-surface flex items-center p-8 lg:p-12"
          style={{
            width: 'clamp(220px, 35vw, 533px)',
            height: 'clamp(220px, 35vw, 533px)',
          }}
        >
          <p className="font-serif font-light text-section text-fg leading-tight tracking-tight">
            {t('intro.quote')}
          </p>
        </div>
      </div>

      {/* Imagen pequeña — lado derecho, solapando */}
      <div className="flex justify-end">
        <div
          className="relative overflow-hidden"
          style={{
            width: 'clamp(180px, 28vw, 400px)',
            height: 'clamp(180px, 28vw, 400px)',
          }}
        >
          <Image
            src="/home/intro-image.jpg"
            alt=""
            fill
            sizes="(min-width: 901px) 28vw, 60vw"
            className="object-cover"
            aria-hidden
          />
        </div>
      </div>

      {/* Texto 2 — lado izquierdo */}
      <div className="section-inner py-20 lg:py-28">
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-span-12 lg:col-span-4 lg:col-start-2">
            <p className="font-mono text-body-sm text-fg max-w-[32ch]">
              {t('intro.p4')}
            </p>
          </div>
        </div>
      </div>

    </section>
  )
}
