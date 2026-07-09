import type { MetadataRoute } from 'next'

import { SITE_CONFIG } from '@/lib/seo/metadata.config'

/* ==========================================================================
   robots.txt
   --------------------------------------------------------------------------
   - Producción (www.interactius.com): allow all + sitemap URL.
   - Staging / preview / local: disallow all (no indexación).

   SITE_CONFIG.isProduction detecta el host canónico mediante
   NEXT_PUBLIC_SITE_URL. Cualquier otro host se trata como no indexable.

   Política de crawlers IA: "todo abierto". Además del comodín `*`, se
   declaran explícitamente los agentes de motores de respuesta/citación
   (ChatGPT/Perplexity/Claude/Gemini/Apple…) y los de entrenamiento
   (GPTBot/CCBot/anthropic-ai). Declararlos por nombre es una señal
   intencional (evita que un default conservador de un tercero nos excluya)
   y deja el punto de control listo para bloquear alguno en el futuro sin
   tocar la estructura. Todos comparten la misma política que `*`:
   `Allow: /`, `Disallow: /api/`.
   ========================================================================== */

/**
 * User-agents de IA que permitimos explícitamente. Dos familias:
 *  - Respuesta/citación en tiempo real (nos citan en respuestas al usuario).
 *  - Entrenamiento de modelos (rastrean corpus para training).
 * Mantener ordenado; añadir/quitar aquí ajusta la política sin más cambios.
 */
const AI_USER_AGENTS: string[] = [
  // OpenAI — búsqueda/citación, acción de usuario y entrenamiento
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  // Anthropic (Claude) — búsqueda/citación, acción de usuario y entrenamiento
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  // Perplexity — indexación y acción de usuario
  'PerplexityBot',
  'Perplexity-User',
  // Google / Apple — opt-in de features generativas (AI Overviews, Siri…)
  'Google-Extended',
  'Applebot-Extended',
  // Otros motores de respuesta / rastreadores IA
  'DuckAssistBot',
  'Amazonbot',
  'Bytespider',
  'meta-externalagent',
  'cohere-ai',
  'CCBot',
]

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
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Evitar indexar las rutas de API
        disallow: ['/api/'],
      },
      {
        // Misma política para todos los agentes de IA, declarada por nombre.
        userAgent: AI_USER_AGENTS,
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${SITE_CONFIG.baseUrl}/sitemap.xml`,
    host: SITE_CONFIG.baseUrl,
  }
}
