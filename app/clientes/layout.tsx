import type { Metadata } from 'next'

import '@/app/globals.css'
import { ftFontsClass } from '@/lib/fonts/future-thinking'

/* ==========================================================================
   Zona privada de clientes — root layout
   --------------------------------------------------------------------------
   Vive fuera de `app/[locale]/` (como `app/proyectos/`), así que tiene su
   propio <html>. Título genérico: no se revela qué hay dentro antes del login.
   ========================================================================== */

export const metadata: Metadata = {
  title: 'Interactius · Área de clientes',
  robots: { index: false, follow: false, nocache: true },
  // same-origin: nada de Referer hacia otros sitios, pero los formularios
  // propios conservan su Origin (con no-referrer Chrome envía Origin: null).
  referrer: 'same-origin',
}

export default function ClientesLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={ftFontsClass}>
      <body className="min-h-dvh bg-warm-light text-fg font-[family-name:var(--font-ft-mono)]">
        {children}
      </body>
    </html>
  )
}
