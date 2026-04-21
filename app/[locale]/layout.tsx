import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Serif, IBM_Plex_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MenuOverlay } from '@/components/layout/MenuOverlay'
import { Footer } from '@/components/layout/Footer'
import { PageTransition } from '@/components/layout/PageTransition'

import { getTranslations } from 'next-intl/server'

import { buildRootMetadata } from '@/lib/seo/metadata.config'
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/seo/schema'
import { LOCALES, type Locale } from '@/lib/i18n/config'

import '../globals.css'

/* ==========================================================================
   Fonts — IBM Plex Serif + IBM Plex Mono via next/font/google
   - Self-hosted, zero-FOUT gracias a display:swap + preload.
   - Variables CSS expuestas en <html className> → consumidas por
     tailwind.config.ts fontFamily.serif / fontFamily.mono.
   ========================================================================== */

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-ibm-plex-serif',
  display: 'swap',
  preload: true,
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
  preload: true,
})

/* ==========================================================================
   Static params — pre-renderiza las 3 locales en build
   ========================================================================== */

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

/* ==========================================================================
   Viewport
   ========================================================================== */

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f2ed' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1a17' },
  ],
  colorScheme: 'light',
}

/* ==========================================================================
   Metadata — se genera por locale. Cada page.tsx sobrescribe lo específico.
   ========================================================================== */

type LayoutParams = { locale: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<LayoutParams>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale

  if (!LOCALES.includes(locale)) {
    return {}
  }

  return buildRootMetadata(locale)
}

/* ==========================================================================
   RootLayout
   ========================================================================== */

interface RootLayoutProps {
  children: React.ReactNode
  params: Promise<LayoutParams>
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale

  // Hard-validate locale — middleware debería prevenir esto, pero por seguridad.
  if (!LOCALES.includes(locale)) {
    notFound()
  }

  // next-intl: mensajes cargados server-side, serializados al cliente.
  const messages = await getMessages()
  const t = await getTranslations('common')

  const organizationSchema = buildOrganizationSchema(locale)
  const webSiteSchema = buildWebSiteSchema(locale)

  return (
    <html
      lang={locale}
      className={`${ibmPlexSerif.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Structured data — JSON-LD Organization + WebSite. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/* Skip link para accesibilidad AA */}
          <a href="#main-content" className="sr-only focus:not-sr-only">
            {t('skipToContent')}
          </a>

          <Sidebar />
          <Header />
          <MenuOverlay />

          <PageTransition>
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
          </PageTransition>

          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

/* ==========================================================================
   Config Next.js App Router
   ========================================================================== */

// Fuerza render dinámico solo cuando la locale cambia; las páginas hijas
// siguen siendo static/SSG por defecto.
export const dynamicParams = false
