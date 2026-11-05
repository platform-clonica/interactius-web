import type { Metadata } from 'next'

import { CAIXABANK_HACK_THE_WALLET } from '@/lib/data/caixabank-digests'
import { ftFontsClass } from '@/lib/fonts/future-thinking'

/* ==========================================================================
   Root layout aislado para la landing de cliente (CaixaBank)
   --------------------------------------------------------------------------
   Misma razón que en `proyectos/bershka/future-thinking/layout.tsx`: la ruta
   vive FUERA de `app/[locale]/`, así que necesita su propio `<html>`/`<body>`.
   Las fuentes se comparten desde `lib/fonts/future-thinking.ts`.
   ========================================================================== */

export const metadata: Metadata = {
  title: CAIXABANK_HACK_THE_WALLET.metaTitle,
  description: CAIXABANK_HACK_THE_WALLET.metaDescription,
  // Página fuera de índices y sin seguir enlaces.
  robots: { index: false, follow: false },
}

export default function HackTheWalletLayout({
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
