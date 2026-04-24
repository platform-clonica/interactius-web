import { getTranslations } from 'next-intl/server'

import { Link } from '@/lib/i18n/routing'
import { ButtonPrimary } from '@/components/ui/ButtonPrimary'

export async function Footer() {
  const t = await getTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer
      role="contentinfo"
      className="relative w-full bg-dark text-pure-white min-h-screen flex flex-col justify-center"
    >
      <div className="section-inner py-section">
        {/* Top grid */}
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-grid-gutter">
          {/* Newsletter CTA */}
          <section
            aria-labelledby="footer-newsletter-title"
            className="lg:col-span-7"
          >
            <h2
              id="footer-newsletter-title"
              className="font-serif text-title-sm font-light text-pure-white"
            >
              {t('newsletter.tagline')}
            </h2>

            <p className="mt-6 font-mono text-body-sm text-pure-white/60">
              {t('newsletter.subtitle')}
            </p>

            <div className="mt-8">
              <ButtonPrimary
                as={Link}
                href="/newsletter"
                variant="outline"
              >
                {t('newsletter.cta')}{' '}
                <span aria-hidden="true">↗</span>
              </ButtonPrimary>
            </div>
          </section>

          {/* Wordmark + dirección + social */}
          <div className="flex flex-col gap-10 lg:col-span-5">
            <div className="flex items-start">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/interactius_w.svg"
                alt="Interactius"
                style={{ height: 'clamp(60px, 7vw, 95px)', width: 'auto' }}
              />
            </div>

            <div className="flex flex-col gap-4 font-mono text-body-sm">
              <address className="not-italic text-pure-white/80">
                <p>Pau Claris, 100 Planta 2</p>
                <p>08009 Barcelona</p>
              </address>

              <ul className="flex flex-col gap-1">
                <li>
                  <a
                    href="tel:+34936243913"
                    className="text-pure-white hover:opacity-60"
                  >
                    Tel. 936 24 39 13
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hola@interactius.com"
                    className="text-pure-white hover:opacity-60"
                  >
                    hola@interactius.com
                  </a>
                </li>
              </ul>
            </div>

            <ul
              className="flex items-center gap-4"
              aria-label={t('social.label')}
            >
              <li>
                <a
                  href="https://www.linkedin.com/company/interactius"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('social.linkedin')}
                  className="inline-flex size-10 items-center justify-center
                             text-pure-white hover:opacity-60"
                >
                  <LinkedInIcon />
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/interactius"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('social.instagram')}
                  className="inline-flex size-10 items-center justify-center
                             text-pure-white hover:opacity-60"
                >
                  <InstagramIcon />
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@interactius"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('social.youtube')}
                  className="inline-flex size-10 items-center justify-center
                             text-pure-white hover:opacity-60"
                >
                  <YouTubeIcon />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-24 grid grid-cols-1 gap-4 border-t border-pure-white/20 pt-8
                     lg:grid-cols-12 lg:gap-grid-gutter"
        >
          <p className="font-mono text-micro text-pure-white/60 lg:col-span-4">
            ©2012–{year} Interactius
          </p>

          <nav
            aria-label={t('legal.label')}
            className="lg:col-span-8"
          >
            <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-micro">
              <li>
                <span
                  aria-disabled="true"
                  className="text-pure-white/40 cursor-not-allowed"
                >
                  {t('legal.privacy')}
                </span>
              </li>
              <li>
                <span
                  aria-disabled="true"
                  className="text-pure-white/40 cursor-not-allowed"
                >
                  {t('legal.cookies')}
                </span>
              </li>
              <li>
                <span
                  aria-disabled="true"
                  className="text-pure-white/40 cursor-not-allowed"
                >
                  {t('legal.terms')}
                </span>
              </li>
              <li>
                <Link
                  href="/aviso-legal"
                  className="text-pure-white/60 hover:text-pure-white focus-visible:text-pure-white"
                >
                  {t('legal.notice')}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M3.6 6.8v9.7H.4V6.8h3.2zM2 .2a1.8 1.8 0 110 3.6 1.8 1.8 0 010-3.6zM19.6 16.5h-3.2v-4.7c0-1.1 0-2.6-1.6-2.6s-1.8 1.2-1.8 2.5v4.8H9.8V6.8h3v1.3h.1a3.3 3.3 0 013-1.6c3.2 0 3.7 2.1 3.7 4.8v5.2z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="2" width="16" height="16" rx="4" />
      <circle cx="10" cy="10" r="3.5" />
      <circle cx="14.5" cy="5.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M19.6 5.8a2.5 2.5 0 00-1.7-1.7C16.4 3.7 10 3.7 10 3.7s-6.4 0-7.9.4A2.5 2.5 0 00.4 5.8C0 7.3 0 10 0 10s0 2.7.4 4.2a2.5 2.5 0 001.7 1.7c1.5.4 7.9.4 7.9.4s6.4 0 7.9-.4a2.5 2.5 0 001.7-1.7c.4-1.5.4-4.2.4-4.2s0-2.7-.4-4.2zM8 13V7l5.2 3L8 13z" />
    </svg>
  )
}
