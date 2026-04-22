import type { MetadataRoute } from 'next'

import { SITE_CONFIG } from '@/lib/seo/metadata.config'

/* ==========================================================================
   robots.txt
   --------------------------------------------------------------------------
   - Producción (www.interactius.com): allow all + sitemap URL.
   - Staging / preview / local: disallow all (no indexación).

   SITE_CONFIG.isProduction detecta el host canónico mediante
   NEXT_PUBLIC_SITE_URL. Cualquier otro host se trata como no indexable.
   ========================================================================== */

export default function robots(): MetadataRoute.Robots {
  if (!SITE_CONFIG.isProduction) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Evitar indexar las rutas de API
      disallow: ['/api/'],
    },
    sitemap: `${SITE_CONFIG.baseUrl}/sitemap.xml`,
    host: SITE_CONFIG.baseUrl,
  }
}
