'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Sin render hasta hidratar (evita flash) y solo si hay decisión pendiente.
  if (!mounted || !isHydrated || status !== 'pending' || isSettingsOpen) return null

  return createPortal(
    <div
      role="region"
      aria-label={t('title')}
      aria-live="polite"
      style={{ zIndex: 9000 }}
      className="fixed inset-x-0 bottom-0 border-t border-warm-light/20 bg-dark text-warm-light"
    >
      <div className="section-inner grid grid-cols-1 gap-6 py-6 lg:grid-cols-12 lg:items-center lg:gap-grid-gutter">
        <p className="font-mono text-body-sm text-warm-light lg:col-span-7">
          {t('body')}
        </p>

        <div className="flex flex-nowrap items-center justify-end gap-x-6 lg:col-span-5">
          <button
            type="button"
            onClick={rejectAll}
            className="hover-wipe-underline w-fit whitespace-nowrap font-mono text-body-sm text-warm-light"
          >
            {t('rejectAll')}
          </button>
          <button
            type="button"
            onClick={openSettings}
            className="hover-wipe-underline w-fit whitespace-nowrap font-mono text-body-sm text-warm-light"
          >
            {t('customize')}
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="hover-wipe-underline w-fit whitespace-nowrap font-mono text-body-sm text-warm-light"
          >
            {t('acceptAll')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
