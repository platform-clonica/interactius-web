/**
 * rich-text — helpers de renderizado para t.rich() de next-intl.
 *
 * Centraliza las funciones de render más usadas en el proyecto para que
 * un cambio de estilo (ej. el peso del <strong> en textos de identidad)
 * se propague automáticamente a todos los componentes.
 *
 * Uso:
 *   import { richComponents } from '@/lib/i18n/rich-text'
 *
 *   t.rich('hero.body1', richComponents.bold)
 *   t.rich('intro.quote', richComponents.serifEmphasis)
 *
 * Extensión:
 *   Añadir nuevas entradas siguiendo el mismo patrón. Cada entrada es
 *   un objeto { tagName: renderFn } compatible con t.rich().
 */

import type { ReactNode } from 'react'

// Tipo compatible con RichTranslationValues de next-intl
type RichComponents = Record<string, (chunks: ReactNode) => ReactNode>

/* ─── Variantes ──────────────────────────────────────────────── */

/**
 * bold — <strong> con peso semibold.
 * Uso: textos de hero y secciones donde negrita es énfasis tipográfico.
 */
const bold: RichComponents = {
  strong: (chunks) => <strong className="font-semibold">{chunks}</strong>,
}

/**
 * serifEmphasis — <strong> renderizado como serif normal (no bold).
 * Uso: citas y declaraciones donde el énfasis es el contraste de estilo,
 * no el peso. Ej: IdentidadIntro, CapacityIntro.
 */
const serifEmphasis: RichComponents = {
  strong: (chunks) => <span className="font-serif font-normal">{chunks}</span>,
}

/**
 * underlineStyle — <u> con underline offset customizado.
 * Uso: CTAs y textos con subrayado semántico. Ej: MiradasGrid loadMore.
 */
const underlineStyle: RichComponents = {
  u: (chunks) => <span className="underline underline-offset-4">{chunks}</span>,
}

/**
 * boldWord — <strong> renderizado con slashes "/ palabra /" desde el primer
 * paint, dentro de un wrapper nowrap. La animación canónica solo engrosa
 * el trazo del word con `text-stroke 0→0.6px` (regular → semi); los slashes
 * NO se animan, ya están visibles. Render estático = wrap estable a
 * cualquier viewport, sin reflow durante la animación.
 *
 * Uso: CapacityStatement, IdentidadIntro, HomeIntroText, HeroScroll,
 * CapacityHeroSequence, MiradasHero.
 */
const boldWord: RichComponents = {
  strong: (chunks) => (
    <span style={{ whiteSpace: 'nowrap' }}>
      <span aria-hidden="true">{'/ '}</span>
      <span data-word="">{chunks}</span>
      <span aria-hidden="true">{' /'}</span>
    </span>
  ),
}

/* ─── Export ─────────────────────────────────────────────────── */

export const richComponents = {
  bold,
  serifEmphasis,
  underlineStyle,
  boldWord,
} as const
