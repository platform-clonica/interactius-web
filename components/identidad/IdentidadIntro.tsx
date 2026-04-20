import { getTranslations } from 'next-intl/server'

export async function IdentidadIntro() {
  const t = await getTranslations('identidad')

  return (
    <section className="w-full bg-warm-light" aria-label="Declaración">
      <div className="section-inner flex items-center min-h-screen py-section">
        <div className="grid grid-cols-12 gap-grid-gutter w-full">
          <div className="col-span-12 lg:col-span-10 lg:col-start-1">
            <p className="font-serif font-light text-section text-fg tracking-[-0.02em] leading-[1.2]">
              {t.rich('intro.quote', {
                strong: (chunks) => <span className="font-serif font-normal">{chunks}</span>,
              })}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
