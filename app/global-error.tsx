'use client'

import { useEffect } from 'react'

import './globals.css'

/**
 * Global Error — fallback de último recurso de Next.js. Se activa cuando la
 * excepción ocurre en el ROOT layout (antes de poder cargar el error.tsx
 * del grupo). Renderiza su propio <html>/<body> porque el root layout no
 * está disponible. Sin next-intl: copy hardcoded en español (locale default).
 */
interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[global error boundary]', error)
    }
  }, [error])

  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen w-full items-center justify-center bg-bg px-grid-margin">
          <div className="flex flex-col gap-8 max-w-[44ch]">
            <p className="font-mono text-body-sm text-fg/40">500</p>

            <h1 className="font-serif font-light text-title text-fg leading-none tracking-[-0.02em]">
              Algo ha ido mal
            </h1>

            <p className="font-mono text-body-sm text-fg leading-[1.6]">
              Ha ocurrido un error inesperado. Puedes intentarlo de nuevo o volver al inicio.
            </p>

            <div className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-body-sm text-fg">
              <button
                type="button"
                onClick={reset}
                className="hover-wipe-underline w-fit text-fg"
              >
                Intentar de nuevo
              </button>
              {/* Full page reload deliberado — al ser global-error el root
                  layout está broken, queremos un nav completo, no SPA. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className="hover-wipe-underline w-fit text-fg">
                Volver
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
