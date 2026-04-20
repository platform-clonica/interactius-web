import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

const valorImages = [
  '/identidad/valores-01.jpg',
  '/identidad/valores-02.jpg',
  '/identidad/valores-03.jpg',
  '/identidad/valores-04.jpg',
]

export async function IdentidadValores() {
  const t = await getTranslations('identidad')

  return (
    <section className="w-full bg-warm-light" aria-label="Valores">
      {valorImages.map((img, i) => (
        <div key={i} className="relative flex min-h-screen">
          {/* Left: image from left edge, ~42% of viewport */}
          <div className="hidden lg:block w-[42%] flex-shrink-0 relative overflow-hidden">
            <Image
              src={img}
              alt=""
              fill
              sizes="42vw"
              className="object-cover object-center"
            />
          </div>

          {/* Mobile image */}
          <div className="absolute top-0 left-0 right-0 aspect-[4/3] lg:hidden overflow-hidden">
            <Image
              src={img}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>

          {/* Right: text content */}
          <div className="flex-1 flex items-center">
            <div
              className="w-full py-[calc(100vw*0.42+2rem)] lg:py-0 px-[var(--grid-margin)] lg:px-[clamp(32px,3vw,64px)]"
            >
              <div className="flex flex-col gap-6 max-w-[42ch]">
                <h3 className="font-serif font-light text-title-sm text-fg leading-[1.2]">
                  {t(`valores.${i}.title` as Parameters<typeof t>[0])}
                </h3>
                <div className="flex flex-col gap-6 font-mono text-body text-fg">
                  <p>{t(`valores.${i}.body` as Parameters<typeof t>[0])}</p>
                  <p className="font-semibold">{t(`valores.${i}.closing` as Parameters<typeof t>[0])}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
