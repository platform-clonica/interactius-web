'use client'

import { useTranslations } from 'next-intl'

import { useConsentStore } from '@/lib/store/consent'

/**
 * ConsentBanner — aviso de cookies en primera visita.
 *
 * Bottom-fixed full-width. Aparece solo si el store está hidratado y el
 * status es 'pending'. AEPD: tres acciones equiparables — Rechazar todo,
 * Personalizar, Aceptar todo. Tab order: izquierda (Rechazar) → centro
 * (Personalizar) → derecha (Aceptar).
 */
export function ConsentBanner() {
  const t = useTranslations('consent.banner')
  const status = useConsentStore((s) => s.status)
  const isHydrated = useConsentStore((s) => s.isHydrated)
  const isSettingsOpen = useConsentStore((s) => s.isSettingsOpen)
  const acceptAll = useConsentStore((s) => s.acceptAll)
  const rejectAll = useConsentStore((s) => s.rejectAll)
  const openSettings = useConsentStore((s) => s.openSettings)

  // Sin render hasta hidratar (evita flash) y solo si hay decisión pendiente.
  if (!isHydrated || status !== 'pending' || isSettingsOpen) return null

  return (
    <div
      role="region"
      aria-label={t('title')}
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-consent-banner border-t border-warm-light/20 bg-dark text-warm-light"
    >
      <div className="section-inner flex flex-col gap-6 py-6 lg:flex-row lg:items-center lg:justify-between lg:gap-grid-gutter">
        <p className="font-mono text-body-sm text-warm-light/80 lg:max-w-2xl">
          {t('body')}
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:flex-nowrap lg:gap-x-4">
          <button
            type="button"
            onClick={rejectAll}
            className="inline-flex items-center justify-center border border-warm-light bg-transparent px-5 py-2 font-mono text-body-sm text-warm-light transition-colors duration-fast ease-expo hover:bg-warm-light hover:text-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-light"
          >
            {t('rejectAll')}
          </button>

          <button
            type="button"
            onClick={openSettings}
            className="hover-wipe-underline w-fit font-mono text-body-sm text-warm-light"
          >
            {t('customize')}
          </button>

          <button
            type="button"
            onClick={acceptAll}
            className="inline-flex items-center justify-center bg-warm-light px-5 py-2 font-mono text-body-sm text-dark transition-colors duration-fast ease-expo hover:bg-transparent hover:text-warm-light hover:outline hover:outline-1 hover:outline-warm-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-light"
          >
            {t('acceptAll')}
          </button>
        </div>
      </div>
    </div>
  )
}
