import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

interface ContactHeroProps {
  title: string
  copy: string
  altEmail?: string
  imageSrc?: string
  imageAlt?: string
  children: ReactNode
}

export async function ContactHero({
  title,
  copy,
  altEmail,
  imageSrc = '/home/hero-poster.webp',
  imageAlt = '',
  children,
}: ContactHeroProps) {
  const t = await getTranslations('contacto')

  return (
    <section
      aria-labelledby="contact-hero-title"
      className="relative min-h-screen w-full overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="relative z-content min-h-screen">
        <div className="section-inner min-h-screen">
          <div className="grid min-h-screen grid-cols-1 items-end lg:grid-cols-12 lg:items-stretch">
            <div
              className="lg:col-span-7 lg:col-start-6
                         flex flex-col justify-center
                         bg-surface p-8 sm:p-12 lg:p-16
                         my-8 lg:my-section"
            >
              <header>
                <h1
                  id="contact-hero-title"
                  className="font-serif text-section font-light text-fg lg:text-title"
                >
                  {title}
                </h1>

                <p className="mt-6 font-mono text-body-sm text-fg/80 lg:text-body">
                  {copy}
                </p>

                {altEmail && (
                  <p className="mt-6 font-mono text-body-sm text-fg/60">
                    {t('altEmailText')}{' '}
                    <a
                      href={`mailto:${altEmail}`}
                      className="text-fg underline underline-offset-4 hover:opacity-70 focus-visible:opacity-70"
                    >
                      {altEmail}
                    </a>
                  </p>
                )}
              </header>

              <div className="mt-12 lg:mt-16">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
