'use client'

import { useEffect } from 'react'

import { SITE_CONFIG } from '@/lib/seo/metadata.config'
import { useConsentStore } from '@/lib/store/consent'

/**
 * GA4Script — Google Analytics 4 con consentimiento estricto.
 *
 * Estrategia: gtag.js NO se descarga hasta que el usuario acepta la
 * categoría `analytics` en el banner. Si rechaza o no decide, GA no
 * existe en su sesión.
 *
 * Cuándo se monta:
 *  1. SITE_CONFIG.isProduction === true (host canónico).
 *  2. NEXT_PUBLIC_GA4_ID está definida (Measurement ID, formato G-XXXXXXXXXX).
 *  3. analytics consent = true en el store.
 *
 * Implementación: inyección manual en `useEffect` en lugar de `<Script>`
 * de next/script. Razón — `next/script` con strategy=afterInteractive no
 * dispara la carga cuando el componente se monta tarde (post-interactive
 * event), que es exactamente nuestro caso (el componente aparece cuando
 * el usuario clica "Aceptar"). Con inyección manual la carga es inmediata
 * y sin necesidad de recargar la página.
 *
 * El revoking de consent (true → false) dispara hard-reload desde el
 * commit() del store, lo que desinstala gtag/window.dataLayer limpio sin
 * cleanup manual aquí.
 */
export function GA4Script() {
  const analyticsConsent = useConsentStore((s) => s.categories.analytics)
  const isHydrated = useConsentStore((s) => s.isHydrated)

  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID

  useEffect(() => {
    if (!SITE_CONFIG.isProduction) return
    if (!ga4Id) return
    if (!isHydrated) return
    if (!analyticsConsent) return

    // Idempotencia: si ya inyectamos antes (re-mount sin reload), no duplicar.
    if (document.getElementById('ga4-base')) return

    const script = document.createElement('script')
    script.id = 'ga4-base'
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`
    script.async = true
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    /* gtag.js solo interpreta como comando lo que llega al dataLayer como
       objeto `arguments`. Un Array normal lo ignora en silencio, así que
       empujar `args` hacía que `js` y `config` no se ejecutaran nunca y no
       se enviara ni una sola página vista. Verificado contra producción: con
       Array, cero peticiones a /g/collect; con `arguments`, las esperadas.
       De ahí el `arguments` en vez del parámetro rest, y el disable del lint. */
    // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-unused-vars
    function gtag(..._args: unknown[]) { (window.dataLayer as unknown[]).push(arguments) }
    gtag('js', new Date())
    gtag('config', ga4Id, { anonymize_ip: true })
  }, [analyticsConsent, isHydrated, ga4Id])

  return null
}

declare global {
  interface Window {
    dataLayer: unknown[]
  }
}
