'use client'

import { useEffect } from 'react'

import './globals.css'

/**
 * Global Error — fallback de último recurso de Next.js. Se activa cuando la
 * excepción ocurre en el ROOT layout (antes de poder cargar el error.tsx
 * del grupo). Renderiza su propio <html>/<body> porque el root layout no
 * está disponible.
 *
 * Sin next-intl provider (el root layout está broken), pero detectamos
 * locale por el primer segmento del path para que el copy SÍ se traduzca.
 * Default → ES.
 */
interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

const ERROR_COPY = {
  es: {
    title: 'Algo ha ido mal',
    body: 'Ha ocurrido un error inesperado. Puedes intentarlo de nuevo o volver al inicio.',
    retry: 'Intentar de nuevo',
    back: 'Volver',
  },
  ca: {
    title: 'Alguna cosa ha anat malament',
    body: "S'ha produït un error inesperat. Pots tornar-ho a intentar o tornar a l'inici.",
    retry: 'Tornar-ho a intentar',
    back: 'Tornar',
  },
  en: {
    title: 'Something went wrong',
    body: 'An unexpected error occurred. You can try again or go back to the homepage.',
    retry: 'Try again',
    back: 'Back',
  },
} as const

type ErrorLocale = keyof typeof ERROR_COPY

function detectLocale(): ErrorLocale {
  if (typeof window === 'undefined') return 'es'
  const first = window.location.pathname.split('/').filter(Boolean)[0]
  return first === 'ca' || first === 'en' ? first : 'es'
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const locale = detectLocale()
  const copy = ERROR_COPY[locale]

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[global error boundary]', error)
    }
  }, [error])

  return (
    <html lang={locale}>
      <body>
        <div className="flex min-h-screen w-full items-center justify-center bg-bg px-grid-margin">
          <div className="flex flex-col gap-8 max-w-[44ch]">
            <p className="font-mono text-body-sm text-fg/40">500</p>

            <h1 className="font-serif font-light text-title text-fg leading-none tracking-[-0.02em]">
              {copy.title}
            </h1>

            <p className="font-mono text-body-sm text-fg leading-[1.6]">
              {copy.body}
            </p>

            <div className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-body-sm text-fg">
              <button
                type="button"
                onClick={reset}
                className="hover-wipe-underline w-fit text-fg"
              >
                {copy.retry}
              </button>
              {/* Full page reload deliberado — al ser global-error el root
                  layout está broken, queremos un nav completo, no SPA. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className="hover-wipe-underline w-fit text-fg">
                {copy.back}
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
