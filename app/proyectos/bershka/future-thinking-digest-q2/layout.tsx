import type { Metadata } from 'next'

import { BERSHKA_Q2 } from '@/lib/data/bershka-digests'
import { ftFontsClass } from '@/lib/fonts/future-thinking'

/* ==========================================================================
   Root layout aislado para la landing de cliente (Q2)
   --------------------------------------------------------------------------
   Misma razón que en `future-thinking/layout.tsx`: la ruta vive FUERA de
   `app/[locale]/`, así que necesita su propio `<html>`/`<body>`. Las fuentes
   se comparten desde `lib/fonts/future-thinking.ts`.
   ========================================================================== */

export const metadata: Metadata = {
  title: BERSHKA_Q2.metaTitle,
  description: BERSHKA_Q2.metaDescription,
  // Página fuera de índices y sin seguir enlaces.
  robots: { index: false, follow: false },
}

export default function FutureThinkingQ2Layout({
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
