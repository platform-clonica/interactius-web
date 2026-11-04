/**
 * lib/data/dossiers.ts
 * ─────────────────────────────────────────────────────────────────────
 * Registro único de dossiers. Un dossier recopila en una página lo que
 * hemos publicado sobre un tema en varios canales.
 *
 * POR QUÉ ESTE ARCHIVO EXISTE
 * El primer dossier se publicó el 2/11/2026 y dos días después seguía sin
 * aparecer en `llms.txt`, que es el índice que leen ChatGPT, Claude o
 * Perplexity. El motivo era que cada consumidor tenía su propia lista: la
 * banda de Miradas sabía qué dossiers hay y el generador de `llms.txt` no.
 * Justo la página hecha para decirnos expertos en un tema era la que
 * faltaba donde más se nota.
 *
 * A partir de aquí la lista vive solo aquí. Quien necesite saber qué
 * dossiers existen la importa. Añadir uno nuevo es añadir una entrada.
 */

import type { Locale } from '@/lib/i18n/config'

/** Rutas de dossier registradas en `lib/i18n/routing.ts`. */
export type DossierRouteId = '/miradas/comercio-agentico'

export interface Dossier {
  /** Coincide con el `id` del JSON de `miradas.dossiers.items`. */
  id: string
  /** `undefined` mientras el dossier es solo un anuncio. */
  routeId?: DossierRouteId
  /** Título y resumen por idioma, para índices que no pasan por next-intl. */
  copy: Record<Locale, { title: string; description: string }>
}

export const DOSSIERS: readonly Dossier[] = [
  {
    id: 'comercio-agentico',
    routeId: '/miradas/comercio-agentico',
    copy: {
      es: {
        title: 'Comercio agéntico',
        description:
          'Dossier sobre comercio agéntico: qué cambia cuando un agente de IA busca, compara y compra, y qué tiene que decidir una organización antes de que el cambio la alcance. Reúne tres artículos, cuatro análisis y datos de NielsenIQ, Mastercard, Gartner y Adobe.',
      },
      ca: {
        title: 'Comerç agèntic',
        description:
          "Dossier sobre comerç agèntic: què canvia quan un agent d'IA busca, compara i compra, i què ha de decidir una organització abans que el canvi l'atrapi. Aplega tres articles, quatre anàlisis i dades de NielsenIQ, Mastercard, Gartner i Adobe.",
      },
      en: {
        title: 'Agentic commerce',
        description:
          'A dossier on agentic commerce: what changes when an AI agent searches, compares and buys, and what an organisation has to decide before the change catches up with it. Gathers three articles, four analyses and data from NielsenIQ, Mastercard, Gartner and Adobe.',
      },
    },
  },
  {
    id: 'organizaciones-aumentadas',
    // Sin `routeId`: anunciado, todavía no publicado. Quien lo consuma debe
    // tratar la ausencia de ruta como "no enlazable".
    copy: {
      es: { title: 'Organizaciones aumentadas', description: '' },
      ca: { title: 'Organitzacions augmentades', description: '' },
      en: { title: 'Augmented organisations', description: '' },
    },
  },
]

/** Solo los que tienen página. Lo que no esté publicado no se enlaza. */
export const DOSSIERS_PUBLICADOS = DOSSIERS.filter(
  (d): d is Dossier & { routeId: DossierRouteId } => Boolean(d.routeId),
)
