// app/[locale]/layout.tsx
// RootLayout con todo el aparato SEO técnico configurado
// Next.js App Router + i18n con [locale]

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import {
  baseMetadata,
  SITE_CONFIG,
} from '@/lib/metadata.config'
import {
  organizationSchema,
  websiteSchema,
  schemaToScript,
} from '@/lib/schema'

// ─── Tipografía ───────────────────────────────────────────────────────────────
// ⚠ PENDIENTE: reemplazar con la tipografía definitiva del sistema visual de Figma
const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-sans',
  display:  'swap',
})

// ─── i18n ─────────────────────────────────────────────────────────────────────
const locales = ['es', 'ca', 'en'] as const
type Locale = typeof locales[number]

// ─── Metadatos base exportados ────────────────────────────────────────────────
export const metadata: Metadata = baseMetadata

// ─── hreflang alternates por locale ──────────────────────────────────────────
export async function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: Locale }
}) {
  const { locale } = params

  if (!locales.includes(locale)) notFound()

  const lang = locale === 'es' ? 'es' : locale === 'ca' ? 'ca' : 'en'

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* Schema.org — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaToScript(organizationSchema) }}
        />
        {/* Schema.org — WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaToScript(websiteSchema) }}
        />
        {/* Preconnect a dominios externos relevantes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Open Graph locale alternates */}
        {locales
          .filter(l => l !== locale)
          .map(l => (
            <meta
              key={l}
              property="og:locale:alternate"
              content={
                l === 'es' ? 'es_ES' : l === 'ca' ? 'ca_ES' : 'en_GB'
              }
            />
          ))}
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}

// ─── Ejemplo de uso en una página de capacidad ────────────────────────────────
//
// app/[locale]/pensamiento-estrategico/page.tsx
//
// import { buildPageMetadata } from '@/lib/metadata.config'
// import { buildBreadcrumbSchema, schemaToScript } from '@/lib/schema'
//
// export async function generateMetadata({ params }): Promise<Metadata> {
//   const locale = params.locale ?? 'es'
//   return buildPageMetadata('pensamiento', '/pensamiento-estrategico', locale)
// }
//
// export default function PensamientoEstrategico() {
//   const breadcrumb = buildBreadcrumbSchema([
//     { name: 'Inicio', url: 'https://www.interactius.com' },
//     { name: 'Pensamiento estratégico', url: 'https://www.interactius.com/pensamiento-estrategico' },
//   ])
//   return (
//     <>
//       <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaToScript(breadcrumb) }} />
//       {/* contenido de la página */}
//     </>
//   )
// }
