import { z } from 'zod'

/**
 * Taxonomía Miradas v2 — fuente única de verdad
 * ─────────────────────────────────────────────────────────────────────────
 * 3 categorías madre × 10 subcategorías. Los slugs aquí son **canónicos**
 * (en español, sin localizar). Para la versión localizada por locale ver
 * `lib/miradas/i18n-routing.ts`.
 */

export const MIRADAS_PARENT_CATEGORIES = [
  'pensamiento-estrategico',
  'diseno-experiencias',
  'transformacion-cultural',
] as const

export type MiradasParentCategory = (typeof MIRADAS_PARENT_CATEGORIES)[number]

export const MIRADAS_SUBCATEGORIES = [
  // pensamiento-estrategico
  'diseno-estrategico',
  'innovacion',
  'futuros',
  'marca',
  // diseno-experiencias
  'diseno-ux-ui',
  'ux-research',
  'clonica',
  // transformacion-cultural
  'ia-aplicada',
  'cultura-organizacional',
  'workshops',
] as const

export type MiradasSubcategory = (typeof MIRADAS_SUBCATEGORIES)[number]

/** Mapeo sub → madre. Cualquier sub válida tiene una madre única. */
export const SUB_TO_PARENT: Record<MiradasSubcategory, MiradasParentCategory> = {
  'diseno-estrategico': 'pensamiento-estrategico',
  innovacion: 'pensamiento-estrategico',
  futuros: 'pensamiento-estrategico',
  marca: 'pensamiento-estrategico',
  'diseno-ux-ui': 'diseno-experiencias',
  'ux-research': 'diseno-experiencias',
  clonica: 'diseno-experiencias',
  'ia-aplicada': 'transformacion-cultural',
  'cultura-organizacional': 'transformacion-cultural',
  workshops: 'transformacion-cultural',
}

/** Subs por madre, en orden de declaración. Útil para listar las hermanas. */
export const SUBS_BY_PARENT: Record<MiradasParentCategory, MiradasSubcategory[]> = {
  'pensamiento-estrategico': ['diseno-estrategico', 'innovacion', 'futuros', 'marca'],
  'diseno-experiencias': ['diseno-ux-ui', 'ux-research', 'clonica'],
  'transformacion-cultural': ['ia-aplicada', 'cultura-organizacional', 'workshops'],
}

/** Display name por defecto (ES). Localizable después en i18n-routing. */
export const PARENT_DISPLAY_ES: Record<MiradasParentCategory, string> = {
  'pensamiento-estrategico': 'Pensamiento Estratégico',
  'diseno-experiencias': 'Diseño de Experiencias',
  'transformacion-cultural': 'Transformación Cultural',
}

export const SUB_DISPLAY_ES: Record<MiradasSubcategory, string> = {
  'diseno-estrategico': 'Diseño estratégico',
  innovacion: 'Innovación',
  futuros: 'Futuros',
  marca: 'Marca',
  'diseno-ux-ui': 'Diseño UX/UI',
  'ux-research': 'UX Research',
  clonica: 'Clónica',
  'ia-aplicada': 'Inteligencia Artificial aplicada',
  'cultura-organizacional': 'Cultura organizacional',
  workshops: 'Workshops',
}

// ─── Frontmatter schema ────────────────────────────────────────────────

const dateRe = /^\d{4}-\d{2}-\d{2}$/
const slugRe = /^[a-zA-Z0-9_.-]+$/
// Path local de imagen: /miradas-assets/<slug>/<filename>.<ext>
// Slug en path debe coincidir con el slug del artículo (validado aparte
// en validateFrontmatterAgainstPath).
const imagePathRe =
  /^\/miradas-assets\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\.(?:webp|jpg|jpeg|png|gif|svg)$/i

export const MiradaFrontmatterSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().min(1, 'description is required'),
  publishedAt: z.string().regex(dateRe, 'publishedAt must be YYYY-MM-DD'),
  modifiedAt: z.string().regex(dateRe, 'modifiedAt must be YYYY-MM-DD').optional(),
  author: z.string().min(1, 'author is required'),
  category: z.enum(MIRADAS_SUBCATEGORIES, {
    errorMap: () => ({
      message: `category must be one of: ${MIRADAS_SUBCATEGORIES.join(', ')}`,
    }),
  }),
  parentCategory: z.enum(MIRADAS_PARENT_CATEGORIES, {
    errorMap: () => ({
      message: `parentCategory must be one of: ${MIRADAS_PARENT_CATEGORIES.join(', ')}`,
    }),
  }),
  slug: z.string().regex(slugRe, 'slug must contain only [a-zA-Z0-9_.-]'),
  image: z
    .string()
    .regex(imagePathRe, 'image must match /miradas-assets/<slug>/<file>.<ext>')
    .optional(),
  tags: z.array(z.string()).optional(),
  // Translation metadata — presente solo en archivos `{slug}.{locale}.mdx`
  // generados por scripts/translate-miradas.mjs. La página del artículo
  // muestra `<AITranslationBanner>` cuando `translatedBy === 'ai'`.
  translatedBy: z.enum(['ai', 'human']).optional(),
  translatedAt: z
    .string()
    .regex(dateRe, 'translatedAt must be YYYY-MM-DD')
    .optional(),
  // Slug localizado para la URL en este locale. Más estricto que `slug`
  // porque va en URL pública: solo [a-z0-9-]. El archivo MDX sigue
  // nombrado con el slug ES (`{slug-es}.{locale}.mdx`) — el localizedSlug
  // se usa solo para el segmento [slug] de la URL final en CA/EN.
  localizedSlug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'localizedSlug must be lowercase [a-z0-9-]')
    .optional(),
})

export type MiradaFrontmatter = z.infer<typeof MiradaFrontmatterSchema>

// ─── Validation against file path ──────────────────────────────────────

export interface ValidationFailure {
  ok: false
  errors: string[]
}
export interface ValidationSuccess {
  ok: true
}
export type ValidationResult = ValidationSuccess | ValidationFailure

/**
 * Valida que el frontmatter sea coherente con la ruta del archivo:
 *   - La carpeta padre del .mdx debe coincidir con `category`.
 *   - `parentCategory` debe ser SUB_TO_PARENT[category].
 *   - El nombre del archivo (sin .mdx) debe coincidir con `slug`.
 *     · ES default: `{slug}.mdx`
 *     · Traducción: `{slug}.{locale}.mdx` (la parte locale se valida aparte
 *       como segmento de 2 letras que matchea Locale).
 *   - Si hay `image`, su slug embebido debe coincidir con `slug`.
 */
export function validateFrontmatterAgainstPath(
  fm: MiradaFrontmatter,
  filePath: string,
): ValidationResult {
  const errors: string[] = []
  const parts = filePath.replace(/\\/g, '/').split('/')
  const folder = parts[parts.length - 2]
  const fileName = parts[parts.length - 1]
  // Soporta tanto `{slug}.mdx` como `{slug}.{locale}.mdx`. Para una
  // traducción esperamos sufijo `.ca` o `.en` antes del `.mdx`.
  const TRANSLATED_LOCALES = ['ca', 'en'] as const
  let baseName = fileName.replace(/\.mdx$/, '')
  for (const loc of TRANSLATED_LOCALES) {
    if (baseName.endsWith(`.${loc}`)) {
      baseName = baseName.slice(0, -(loc.length + 1))
      break
    }
  }

  if (folder !== fm.category) {
    errors.push(
      `folder "${folder}" does not match category "${fm.category}"`,
    )
  }
  const expectedParent = SUB_TO_PARENT[fm.category]
  if (expectedParent !== fm.parentCategory) {
    errors.push(
      `parentCategory "${fm.parentCategory}" does not match expected "${expectedParent}" for category "${fm.category}"`,
    )
  }
  if (baseName !== fm.slug) {
    errors.push(`filename "${baseName}.mdx" does not match slug "${fm.slug}"`)
  }
  if (fm.image) {
    const imgSlugMatch = fm.image.match(/^\/miradas-assets\/([^/]+)\//)
    if (imgSlugMatch && imgSlugMatch[1] !== fm.slug) {
      errors.push(
        `image slug "${imgSlugMatch[1]}" does not match article slug "${fm.slug}"`,
      )
    }
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}
