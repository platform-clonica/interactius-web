'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

/**
 * Error boundary del route group (contact). Si una page de /contacto,
 * /newsletter o /testers lanza una excepción, este file la captura. Mismo
 * patrón canónico que (main)/error.tsx.
 */
interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ContactErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations('common')

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[contact error boundary]', error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg px-grid-margin">
      <div className="flex flex-col gap-8 max-w-[44ch]">
        <p className="font-mono text-body-sm text-fg/40">500</p>

        <h1 className="font-serif font-light text-title text-fg leading-none tracking-[-0.02em]">
          {t('error.title')}
        </h1>

        <p className="font-mono text-body-sm text-fg leading-[1.6]">
          {t('error.body')}
        </p>

        <div className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-body-sm text-fg">
          <button
            type="button"
            onClick={reset}
            className="hover-wipe-underline w-fit text-fg"
          >
            {t('error.retry')}
          </button>
          <Link href="/" className="hover-wipe-underline w-fit text-fg">
            {t('actions.back')}
          </Link>
        </div>
      </div>
    </div>
  )
}
