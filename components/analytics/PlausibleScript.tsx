import Script from 'next/script'

import { SITE_CONFIG } from '@/lib/seo/metadata.config'

/**
 * PlausibleScript — analytics anónimo, sin cookies, GDPR-friendly.
 *
 * Solo se monta en el host canónico de producción (gracias a
 * SITE_CONFIG.isProduction). En dev, staging y deploy-previews queda fuera
 * para no contaminar las métricas reales.
 *
 * data-domain debe coincidir con el dominio dado de alta en plausible.io.
 * El proxy 'plausible.io/js/script.js' es la URL oficial; si en el futuro
 * lo bloquean adblockers de forma generalizada, valorar el proxy propio
 * documentado en https://plausible.io/docs/proxy/introduction.
 */
export function PlausibleScript() {
  if (!SITE_CONFIG.isProduction) return null

  return (
    <Script
      defer
      data-domain="interactius.com"
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  )
}
