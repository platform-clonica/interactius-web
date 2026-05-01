'use client'

import { useTranslations } from 'next-intl'

import { useConsentStore } from '@/lib/store/consent'

/**
 * ManagePreferencesButton — link en footer que abre el modal de
 * preferencias de cookies. Cumple el requisito AEPD de retirada del
 * consentimiento tan fácil como darlo desde cualquier página.
 *
 * Estilo idéntico al resto de links del bottom-bar (mismo `text-micro`,
 * `hover-wipe-underline`).
 */
export function ManagePreferencesButton() {
  const t = useTranslations('footer.legal')
  const openSettings = useConsentStore((s) => s.openSettings)

  return (
    <button
      type="button"
      onClick={openSettings}
      className="hover-wipe-underline w-fit text-warm-light"
    >
      {t('managePreferences')}
    </button>
  )
}
