'use client'

import Script from 'next/script'

import { SITE_CONFIG } from '@/lib/seo/metadata.config'
import { useConsentStore } from '@/lib/store/consent'

/**
 * GA4Script — Google Analytics 4 con consentimiento estricto.
 *
 * Estrategia: gtag.js NO se descarga hasta que el usuario acepta la
 * categoría `analytics` en el banner. Si rechaza o no decide, GA no
 * existe en absoluto en su sesión.
 *
 * Cuándo se monta:
 *  1. SITE_CONFIG.isProduction === true (host canónico).
 *  2. NEXT_PUBLIC_GA4_ID está definida (Measurement ID, formato G-XXXXXXXXXX).
 *  3. analytics consent = true en el store.
 *
 * El revoking de consent (true → false) dispara hard-reload desde el
 * commit() del store, lo que desinstala gtag/window.dataLayer limpio sin
 * que tengamos que hacer cleanup manual aquí.
 *
 * Los IDs `gtag-base` y `gtag-init` permiten a Next/Script deduplicar si
 * el componente se re-monta.
 */
export function GA4Script() {
  const analyticsConsent = useConsentStore((s) => s.categories.analytics)
  const isHydrated = useConsentStore((s) => s.isHydrated)

  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID

  if (!SITE_CONFIG.isProduction) return null
  if (!ga4Id) return null
  if (!isHydrated) return null
  if (!analyticsConsent) return null

  return (
    <>
      <Script
        id="gtag-base"
        src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${ga4Id}', { anonymize_ip: true });
        `}
      </Script>
    </>
  )
}
