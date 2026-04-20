import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

export async function IdentidadLiminal() {
  const t = await getTranslations('identidad')

  return (
    <section className="w-full bg-warm-light" aria-labelledby="liminal-title">
      <div className="section-inner pt-section pb-0">
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-span-12 lg:col-span-3">
            <h2
              id="liminal-title"
              className="font-serif font-normal text-section text-fg tracking-[-0.02em] leading-[1.2]"
            >
              {t('liminal.title')}
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-8 lg:col-start-5 mt-8 lg:mt-0">
            <p className="font-mono text-body text-fg leading-[1.5]">
              {t.rich('liminal.body', {
                strong: (chunks) => <strong className="font-semibold">{chunks}</strong>,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom image area with blurred bg + warm-light right panel + quote */}
      <div className="relative mt-section h-[533px] w-full overflow-hidden">
        {/* Blurred background image */}
        <div className="absolute inset-[-8%]" aria-hidden="true">
          <Image
            src="/identidad/liminal-bg.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center blur-[15px]"
          />
        </div>

        {/* Warm-light panel on the right (~right half-ish) */}
        <div
          className="absolute bottom-0 top-0 bg-warm-light"
          style={{
            left: 'calc(50% + 18.4%)',
            right: 0,
          }}
          aria-hidden="true"
        />

        {/* Quote centered within the warm-light panel */}
        <div
          className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-center"
          style={{
            left: 'calc(50% + 18.4%)',
            right: 0,
          }}
        >
          <p className="font-serif font-light text-section text-fg leading-[1.2] tracking-[-0.02em] px-8 max-w-[24ch]">
            {t('liminal.quote')}
          </p>
        </div>
      </div>
    </section>
  )
}
