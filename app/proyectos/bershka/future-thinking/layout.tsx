import type { Metadata } from 'next'

import { BERSHKA_Q1 } from '@/lib/data/bershka-digests'
import { ftFontsClass } from '@/lib/fonts/future-thinking'

/* ==========================================================================
   Root layout aislado para la landing de cliente
   --------------------------------------------------------------------------
   Esta ruta vive FUERA de `app/[locale]/` (que es el root layout del sitio),
   por eso necesita su propio `<html>`/`<body>`. No importa `globals.css` ni la
   cromática del sitio: es una landing autocontenida. Next permite múltiples
   root layouts mientras no exista un `app/layout.tsx` compartido.
   ========================================================================== */

export const metadata: Metadata = {
  title: BERSHKA_Q1.metaTitle,
  description: BERSHKA_Q1.metaDescription,
  // Página fuera de índices y sin seguir enlaces.
  robots: { index: false, follow: false },
}

export default function FutureThinkingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={ftFontsClass}>
      <body>{children}</body>
    </html>
  )
}
