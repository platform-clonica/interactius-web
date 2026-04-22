'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

import { ButtonPrimary } from '@/components/ui/ButtonPrimary'

/**
 * Error boundary — se activa cuando una page.tsx lanza una excepción no capturada.
 * IMPORTANTE: debe ser 'use client' (restricción de Next.js App Router).
 *
 * Muestra un mensaje genérico de error con opción de reintentar.
 * Los errores de Suspense boundaries activan el archivo loading.tsx correspondiente.
 */

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations('common')

  useEffect(() => {
    // TODO Sprint 4 — integrar con Sentry o similar cuando esté configurado
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[error boundary]', error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg px-grid-margin">
      <div className="flex flex-col gap-8 max-w-[40ch]">
        {/* Decorative code */}
        <p className="font-mono text-micro text-fg/40">500</p>

        <h1 className="font-serif font-light text-title text-fg leading-none tracking-[-0.02em]">
          {t('error.title')}
        </h1>

        <p className="font-mono text-body-sm text-fg/60 leading-[1.5]">
          {t('error.body')}
        </p>

        <div className="flex gap-4 flex-wrap">
          <ButtonPrimary variant="dark" onClick={reset}>
            {t('error.retry')}
          </ButtonPrimary>
          <ButtonPrimary as="a" href="/" variant="light">
            {t('actions.back')}
          </ButtonPrimary>
        </div>

        {/* Digest for support reference — only in dev */}
        {process.env.NODE_ENV !== 'production' && error.digest && (
          <p className="font-mono text-caption text-fg/30">
            digest: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
