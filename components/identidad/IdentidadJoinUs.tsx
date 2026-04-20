import { getTranslations } from 'next-intl/server'

export async function IdentidadJoinUs() {
  const t = await getTranslations('identidad')

  return (
    <section className="w-full bg-dark" aria-label="Únete al equipo">
      <div className="section-inner py-section flex items-center justify-center min-h-[540px]">
        <div className="text-center flex flex-col gap-0">
          <p className="font-serif font-normal text-section text-warm-light tracking-[-0.02em] leading-[1.2]">
            {t('joinUs.cta')}
          </p>
          <a
            href={`mailto:${t('joinUs.email')}`}
            className="font-serif font-normal text-section text-warm-light tracking-[-0.02em] leading-[1.2] underline hover:opacity-70"
          >
            {t('joinUs.email')}
          </a>
        </div>
      </div>
    </section>
  )
}
