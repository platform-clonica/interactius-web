import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

const pasoNumbers = ['1', '2', '3'] as const

export async function IdentidadMetodologia() {
  const t = await getTranslations('identidad')

  return (
    <section
      className="relative w-full min-h-screen overflow-hidden"
      aria-labelledby="metodologia-title"
    >
      {/* Background image with dark overlay */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/identidad/metodologia-bg.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-dark/20" />
      </div>

      {/* Super text — overflows left edge */}
      <div className="absolute top-[247px] -translate-y-1/2 left-0 right-0 overflow-hidden pointer-events-none">
        <h2
          id="metodologia-title"
          className="font-serif font-normal text-warm-light leading-[0.7] tracking-[-0.04em] whitespace-nowrap select-none"
          style={{
            fontSize: 'clamp(80px, 11.5vw, 220px)',
            marginLeft: 'calc(var(--grid-margin) - clamp(10px, 3vw, 57px))',
          }}
        >
          {t('metodologia.title')}
        </h2>
      </div>

      {/* Cards */}
      <div className="relative z-content section-inner pb-section" style={{ paddingTop: 'clamp(280px,37.4vh,404px)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-grid-gutter">
          {pasoNumbers.map((num, i) => (
            <div
              key={num}
              className="bg-pure-white flex flex-col items-center justify-center gap-5 p-10 text-center"
              style={{ minHeight: 'clamp(320px,51.1vh,552px)' }}
            >
              <span className="font-mono text-card-sm text-fg leading-[1.5]">
                {num}
              </span>
              <p className="font-serif font-normal text-section text-fg leading-[1.2] tracking-[-0.02em]">
                {t(`metodologia.pasos.${i}.label` as Parameters<typeof t>[0])}
              </p>
              <p className="font-mono text-body-sm text-fg/40 leading-[1.5] max-w-[22ch]">
                {t(`metodologia.pasos.${i}.description` as Parameters<typeof t>[0])}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
