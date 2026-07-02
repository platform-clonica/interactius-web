import type { Metadata } from 'next'
import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Serif,
} from 'next/font/google'

/* ==========================================================================
   Root layout aislado para la landing de cliente
   --------------------------------------------------------------------------
   Esta ruta vive FUERA de `app/[locale]/` (que es el root layout del sitio),
   por eso necesita su propio `<html>`/`<body>`. No importa `globals.css` ni la
   cromática del sitio: es una landing autocontenida. Next permite múltiples
   root layouts mientras no exista un `app/layout.tsx` compartido.
   ========================================================================== */

const mono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  variable: '--font-ft-mono',
  display: 'swap',
})

const serif = IBM_Plex_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400'],
  variable: '--font-ft-serif',
  display: 'swap',
})

const sans = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  variable: '--font-ft-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Future Thinking — Resultados Q1 · Interactius',
  description: 'Informe de resultados Q1 para Bershka. Acceso restringido.',
  // Página protegida: fuera de índices y sin seguir enlaces.
  robots: { index: false, follow: false },
}

export default function FutureThinkingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${mono.variable} ${serif.variable} ${sans.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
