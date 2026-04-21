import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { Logo } from '@/components/ui/Logo'

interface ContactHeroProps {
  title: string
  /** Can be a string or JSX (e.g. multiple paragraphs with bold last line) */
  copy: ReactNode
  altEmail?: string
  imageSrc?: string
  imageAlt?: string
  children: ReactNode
}

export async function ContactHero({
  title,
  copy,
  altEmail,
  imageSrc = '/contacto/bg.jpg',
  imageAlt = '',
  children,
}: ContactHeroProps) {
  const t = await getTranslations('contacto')

  return (
    <section
      aria-labelledby="contact-hero-title"
      className="relative min-h-screen w-full overflow-hidden"
    >
      {/* Full-screen background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Outer container: vertical centering + right card margin (mirrors sidebar on right) */}
      <div className="relative z-content min-h-screen flex items-center py-section pr-grid-margin">
        {/* Warm-light card — full remaining content width */}
        <div className="w-full bg-warm-light">
          <div className="section-inner py-section">
            <div className="grid grid-cols-12 gap-grid-gutter">

              {/* ── LEFT COLUMN: heading + body copy + alt-email ── */}
              <div className="col-span-12 lg:col-span-5 flex flex-col justify-between gap-10 lg:gap-0">
                <div>
                  <h1
                    id="contact-hero-title"
                    className="font-serif font-normal text-section text-fg"
                  >
                    {title}
                  </h1>
                  <div className="mt-10 font-mono text-body-sm text-fg/80 space-y-5">
                    {copy}
                  </div>
                </div>

                {altEmail && (
                  <p className="font-mono text-micro text-fg/40 lg:mt-auto">
                    {t('altEmailText')}{' '}
                    <a
                      href={`mailto:${altEmail}`}
                      className="underline underline-offset-4 hover:opacity-70"
                    >
                      {altEmail}
                    </a>
                  </p>
                )}
              </div>

              {/* ── RIGHT COLUMN: logo + form ── */}
              <div className="col-span-12 lg:col-start-7 lg:col-span-6 flex flex-col gap-10">
                <Logo
                  variant="wordmark"
                  className="h-[40px] lg:h-[clamp(40px,3.9vw,75px)] w-auto self-start"
                />
                {children}
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
