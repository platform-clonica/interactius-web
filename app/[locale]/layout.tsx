import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Serif, IBM_Plex_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'

import { buildRootMetadata } from '@/lib/seo/metadata.config'
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/seo/schema'
import { LOCALES, type Locale } from '@/lib/i18n/config'

import '../globals.css'

/* ==========================================================================
   Fonts — IBM Plex Serif + IBM Plex Mono via next/font/google
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
   Static params
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
   Metadata
   ========================================================================== */

type LayoutParams = { locale: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<LayoutParams>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale

  if (!LOCALES.includes(locale)) return {}

  return buildRootMetadata(locale)
}

/* ==========================================================================
   RootLayout — shell HTML + i18n provider
   --------------------------------------------------------------------------
   Este layout es compartido por (main) y (contact). Cada grupo tiene su
   propio layout anidado con el chrome apropiado:
     (main)/layout.tsx   → Sidebar, Header, MenuOverlay, Footer, PageTransition
     (contact)/layout.tsx → ContactOverlay (fullscreen, sin chrome)
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

  if (!LOCALES.includes(locale)) notFound()

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
          {/* Skip link — solo relevante en páginas con chrome completo */}
          <a href="#main-content" className="sr-only focus:not-sr-only">
            {t('skipToContent')}
          </a>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

/* ==========================================================================
   Config
   ========================================================================== */

export const dynamicParams = false
