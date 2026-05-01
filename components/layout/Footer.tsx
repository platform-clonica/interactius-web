import { getTranslations } from 'next-intl/server'

import { ManagePreferencesButton } from '@/components/consent/ManagePreferencesButton'
import { Link } from '@/lib/i18n/navigation'

import { FooterNewsletterCTA } from './FooterNewsletterCTA'

export async function Footer() {
  const t = await getTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer
      role="contentinfo"
      className="relative flex min-h-screen w-full flex-col bg-dark text-warm-light"
    >
      <div className="section-inner flex flex-1 flex-col py-section">
        {/* TOP — Wordmark right-aligned, 5 últimas columnas (8-12) */}
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-span-12 flex items-start justify-end lg:col-start-8 lg:col-end-13">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/interactius_w.svg"
              alt="Interactius"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        </div>

        {/* NEWSLETTER — alta-izquierda, cols 1-5 */}
        <div className="mt-16 grid grid-cols-12 gap-grid-gutter lg:mt-24">
          <section
            aria-labelledby="footer-newsletter-title"
            className="col-span-12 lg:col-span-5"
          >
            <h2
              id="footer-newsletter-title"
              className="font-serif text-title-sm font-light text-warm-light"
            >
              {t('newsletter.tagline')}
            </h2>

            <p className="mt-8 max-w-md font-mono text-body-sm text-warm-light/60">
              {t('newsletter.subtitle')}
            </p>

            <div className="mt-8">
              <FooterNewsletterCTA label={t('newsletter.cta')} />
            </div>
          </section>
        </div>

        {/* Spacer */}
        <div className="min-h-20 flex-1" />

        {/* ADDRESS + SOCIAL — baja-derecha, cols 8-12 (subgrid 9/3) */}
        <div className="grid grid-cols-12 gap-grid-gutter">
          <div className="col-span-12 grid grid-cols-12 gap-grid-gutter lg:col-span-5 lg:col-start-8">
            <div className="col-span-12 flex flex-col gap-1 font-mono text-body-sm text-warm-light/60 sm:col-span-9">
              <address className="not-italic">
                <p>Pau Claris, 100 Planta 2</p>
                <p>08009 Barcelona</p>
              </address>
              <a
                href="tel:+34936243913"
                className="transition-colors hover:text-warm-light"
              >
                Tel. 936 24 39 13
              </a>
              <a
                href="mailto:hola@interactius.com"
                className="hover-wipe-underline w-fit text-warm-light"
              >
                hola@interactius.com
              </a>
            </div>

            <ul
              aria-label={t('social.label')}
              className="col-span-12 flex flex-col gap-2 font-mono text-body-sm text-warm-light/60 sm:col-span-3 sm:h-full sm:items-end sm:justify-between sm:gap-0"
            >
              <li>
                <a
                  href="https://www.linkedin.com/company/interactius"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('social.linkedin')}
                  className="hover-wipe-underline w-fit text-warm-light"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/interactius"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('social.instagram')}
                  className="hover-wipe-underline w-fit text-warm-light"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@interactius"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('social.youtube')}
                  className="hover-wipe-underline w-fit text-warm-light"
                >
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* BOTTOM — línea full-width + copyright/legal pegados al bottom */}
      <div className="border-t border-warm-light/20">
        <div className="section-inner flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="font-mono text-micro text-warm-light/60">
            ©2012–{year} Interactius
          </p>

          <nav aria-label={t('legal.label')}>
            <ul className="flex flex-wrap gap-x-8 gap-y-2 font-mono text-micro text-warm-light/60">
              <li>
                <span
                  aria-disabled="true"
                  className="cursor-not-allowed underline underline-offset-4"
                >
                  {t('legal.privacy')}
                </span>
              </li>
              <li>
                <span
                  aria-disabled="true"
                  className="cursor-not-allowed underline underline-offset-4"
                >
                  {t('legal.cookies')}
                </span>
              </li>
              <li>
                <span
                  aria-disabled="true"
                  className="cursor-not-allowed underline underline-offset-4"
                >
                  {t('legal.terms')}
                </span>
              </li>
              <li>
                <Link
                  href="/aviso-legal"
                  className="hover-wipe-underline w-fit text-warm-light"
                >
                  {t('legal.notice')}
                </Link>
              </li>
              <li>
                <ManagePreferencesButton />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
