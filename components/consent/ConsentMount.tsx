'use client'

import { useEffect } from 'react'

import { CONSENT_COOKIE_NAME } from '@/lib/consent/cookie'
import { useConsentStore } from '@/lib/store/consent'

import { ConsentBanner } from './ConsentBanner'
import { ConsentSettings } from './ConsentSettings'

/**
 * ConsentMount — entry-point cliente del sistema de consentimiento.
 *
 * Hidrata el store leyendo `document.cookie` y monta los dos componentes
 * de UI. Puntoo único de inserción en (main) y (contact) layouts.
 *
 * Cuando hay cookie con la versión actual del contrato → status='set' →
 * banner no aparece. Cuando no hay cookie o la versión cambió → status=
 * 'pending' → banner aparece.
 */
export function ConsentMount() {
  const hydrate = useConsentStore((s) => s.hydrateFromCookie)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const raw =
      document.cookie
        .split('; ')
        .find((c) => c.startsWith(`${CONSENT_COOKIE_NAME}=`))
        ?.split('=')[1] ?? null
    hydrate(raw)
  }, [hydrate])

  return (
    <>
      <ConsentBanner />
      <ConsentSettings />
    </>
  )
}
