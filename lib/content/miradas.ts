import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import { LOCALES, type Locale } from '@/lib/i18n/config'
import type {
  MiradaFrontmatter as MiradaFrontmatterStrict,
  MiradasParentCategory,
  MiradasSubcategory,
} from '@/lib/miradas/frontmatter.schema'

/**
 * Estructura de directorios:
 *   content/miradas/
 *     es/{cat}/{slug}.mdx      ← fuente (siempre existe)
 *     ca/{cat}/{slug}.mdx      ← traducción CA (opcional, frontmatter.localizedSlug obligatorio si traducido por IA)
 *     en/{cat}/{slug}.mdx      ← traducción EN (idem)
 *
 * El nombre de archivo es invariante en las 3 locales: el slug-ES canónico.
 * La URL pública en CA/EN usa el `localizedSlug` del frontmatter de la
 * traducción (no el nombre del archivo).
 */
const CONTENT_ROOT = path.join(process.cwd(), 'content/miradas')
const DEFAULT_LOCALE: Locale = 'es'

function localeDir(locale: Locale): string {
  return path.join(CONTENT_ROOT, locale)
}

function mdxPath(locale: Locale, cat: string, slugEs: string): string {
  return path.join(localeDir(locale), cat, `${slugEs}.mdx`)
}

/**
 * Frontmatter type used at runtime (loose) — gray-matter returns whatever is
 * in the YAML. Para validación estricta pasar por
 * `MiradaFrontmatterSchema.parse()` en `lib/miradas/frontmatter.schema.ts`.
 *
 * `category` y `parentCategory` se tipan estrictamente para que el resto
 * del codebase tenga autocomplete correcto.
 */
export interface MiradaFrontmatter {
  title: string
  description: string
  publishedAt: string
  modifiedAt?: string
  author: string
  category: MiradasSubcategory
  parentCategory: MiradasParentCategory
  slug: string
  image?: string
  tags?: string[]
  /** Solo en MDX traducidos por `scripts/translate-miradas.mjs`. */
  translatedBy?: 'ai' | 'human'
  translatedAt?: string
  /** Slug localizado para la URL en esa locale. Solo en `{locale}/{cat}/{slug}.mdx` con locale != es. */
  localizedSlug?: string
}

// Re-export para que el resto del codebase no tenga que importar dos veces
export type { MiradasParentCategory, MiradasSubcategory, MiradaFrontmatterStrict }

export interface MiradaMeta extends MiradaFrontmatter {
  slug: string
  cat: string
  /**
   * Slug a usar en la URL para cada locale.
   *  - ES: slug-ES canónico (mismo que `slug`).
   *  - CA/EN: el `localizedSlug` del MDX traducido si existe; sino el slug-ES.
   * Llamadores en listings/grids hacen `articleHref(cat, m.slugByLocale[locale], locale)`.
   */
  slugByLocale: Record<Locale, string>
  /**
   * Title del artículo en cada locale. ES siempre es el del MDX original.
   * CA/EN: el `title` del MDX traducido si existe; sino fallback al ES.
   * Listings y cards hacen `m.titleByLocale[locale]`.
   */
  titleByLocale: Record<Locale, string>
  /** Idem para description. */
  descriptionByLocale: Record<Locale, string>
}

export interface Mirada extends MiradaMeta {
  content: string
}

function readMDXFile(filePath: string): { frontmatter: MiradaFrontmatter; content: string } {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  return { frontmatter: data as MiradaFrontmatter, content }
}

/**
 * Lee los frontmatters de las traducciones (`ca/`, `en/`) si existen y
 * devuelve los 3 mappings que `MiradaMeta` expone: slug, title y description
 * por locale. Un único filesystem read por (cat, slug, locale).
 */
function buildLocalizedMeta(
  cat: string,
  slugEs: string,
  esFrontmatter: MiradaFrontmatter,
): {
  slugByLocale: Record<Locale, string>
  titleByLocale: Record<Locale, string>
  descriptionByLocale: Record<Locale, string>
} {
  const slugByLocale = {} as Record<Locale, string>
  const titleByLocale = {} as Record<Locale, string>
  const descriptionByLocale = {} as Record<Locale, string>
  for (const loc of LOCALES) {
    if (loc === DEFAULT_LOCALE) {
      slugByLocale[loc] = slugEs
      titleByLocale[loc] = esFrontmatter.title
      descriptionByLocale[loc] = esFrontmatter.description
      continue
    }
    const localePath = mdxPath(loc, cat, slugEs)
    if (!fs.existsSync(localePath)) {
      slugByLocale[loc] = slugEs
      titleByLocale[loc] = esFrontmatter.title
      descriptionByLocale[loc] = esFrontmatter.description
      continue
    }
    const { frontmatter } = readMDXFile(localePath)
    slugByLocale[loc] = frontmatter.localizedSlug?.trim() || slugEs
    titleByLocale[loc] = frontmatter.title || esFrontmatter.title
    descriptionByLocale[loc] = frontmatter.description || esFrontmatter.description
  }
  return { slugByLocale, titleByLocale, descriptionByLocale }
}

/** Devuelve solo el slugByLocale (compatibilidad con helpers individuales). */
function buildSlugByLocale(cat: string, slugEs: string): Record<Locale, string> {
  const esPath = mdxPath(DEFAULT_LOCALE, cat, slugEs)
  if (!fs.existsSync(esPath)) {
    const out = {} as Record<Locale, string>
    for (const loc of LOCALES) out[loc] = slugEs
    return out
  }
  const { frontmatter } = readMDXFile(esPath)
  return buildLocalizedMeta(cat, slugEs, frontmatter).slugByLocale
}

export function getAllMiradas(): MiradaMeta[] {
  const results: MiradaMeta[] = []

  const esRoot = localeDir(DEFAULT_LOCALE)
  if (!fs.existsSync(esRoot)) return results

  const cats = fs.readdirSync(esRoot).filter((f) =>
    fs.statSync(path.join(esRoot, f)).isDirectory(),
  )

  for (const cat of cats) {
    const catDir = path.join(esRoot, cat)
    const files = fs.readdirSync(catDir).filter((f) => f.endsWith('.mdx'))

    for (const file of files) {
      const slug = file.replace(/\.mdx$/, '')
      const { frontmatter } = readMDXFile(path.join(catDir, file))
      const localized = buildLocalizedMeta(cat, slug, frontmatter)
      results.push({
        ...frontmatter,
        slug,
        cat,
        ...localized,
      })
    }
  }

  return results.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
}

/**
 * Devuelve el artículo para la locale dada usando el **slug-ES canónico**
 * (que es el nombre del archivo MDX en cualquiera de las locales).
 * Si `locale !== 'es'` y existe `{locale}/{cat}/{slug}.mdx`, devuelve esa
 * traducción. Sino, fallback al MDX en castellano (la página se marcará
 * noindex en CA/EN — ver Fase 1 / `hasTranslation`).
 *
 * Para resolver desde un slug-locale (URL pública CA/EN), usar
 * `getMiradaByLocalizedSlug`.
 */
export function getMiradaBySlug(
  cat: string,
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): Mirada | null {
  const esPath = mdxPath(DEFAULT_LOCALE, cat, slug)
  if (!fs.existsSync(esPath)) return null
  const { frontmatter: esFrontmatter } = readMDXFile(esPath)
  const localized = buildLocalizedMeta(cat, slug, esFrontmatter)
  if (locale !== DEFAULT_LOCALE) {
    const localePath = mdxPath(locale, cat, slug)
    if (fs.existsSync(localePath)) {
      const { frontmatter, content } = readMDXFile(localePath)
      return { ...frontmatter, slug, cat, content, ...localized }
    }
  }
  const { frontmatter, content } = readMDXFile(esPath)
  return { ...frontmatter, slug, cat, content, ...localized }
}

/**
 * Resuelve un slug-locale (el que aparece en la URL en CA/EN) al artículo
 * correspondiente. Mira el frontmatter de cada MDX en `{locale}/{cat}/`
 * buscando uno cuyo `localizedSlug` coincida.
 *
 * Devuelve también el slug-ES canónico — útil para llamar a otros helpers
 * que esperan el slug-ES.
 */
export function getMiradaByLocalizedSlug(
  cat: string,
  localizedSlug: string,
  locale: Locale,
): { mirada: Mirada; slugEs: string } | null {
  if (locale === DEFAULT_LOCALE) {
    // En ES el slug de URL es el slug-ES — equivalente a getMiradaBySlug.
    const m = getMiradaBySlug(cat, localizedSlug, locale)
    return m ? { mirada: m, slugEs: localizedSlug } : null
  }
  const catDir = path.join(localeDir(locale), cat)
  if (!fs.existsSync(catDir)) return null
  const files = fs.readdirSync(catDir).filter((f) => f.endsWith('.mdx'))
  for (const file of files) {
    const localePath = path.join(catDir, file)
    const { frontmatter, content } = readMDXFile(localePath)
    if (frontmatter.localizedSlug === localizedSlug) {
      const slugEs = file.replace(/\.mdx$/, '')
      const esPath = mdxPath(DEFAULT_LOCALE, cat, slugEs)
      if (!fs.existsSync(esPath)) return null
      const { frontmatter: esFrontmatter } = readMDXFile(esPath)
      const localized = buildLocalizedMeta(cat, slugEs, esFrontmatter)
      return {
        mirada: { ...frontmatter, slug: slugEs, cat, content, ...localized },
        slugEs,
      }
    }
  }
  return null
}

/**
 * Busca un `localizedSlug` en CUALQUIER locale traducida. Útil para detectar
 * URLs cruzadas locale × slug (ej. usuario click LocaleSwitcher desde
 * `/ca/mirades/X/{slug-ca}` hacia EN → emite `/en/thoughts/X/{slug-ca}`,
 * que es inválida porque el slug-ca no corresponde a una traducción EN).
 *
 * Devuelve el slug-ES canónico para que el caller emita 308 al slug correcto
 * de la locale actual usando `slugByLocale[currentLocale]`.
 */
export function getMiradaByLocalizedSlugAnyLocale(
  cat: string,
  localizedSlug: string,
): { slugEs: string; slugByLocale: Record<Locale, string> } | null {
  for (const loc of LOCALES) {
    if (loc === DEFAULT_LOCALE) continue
    const catDir = path.join(localeDir(loc), cat)
    if (!fs.existsSync(catDir)) continue
    const files = fs.readdirSync(catDir).filter((f) => f.endsWith('.mdx'))
    for (const file of files) {
      const { frontmatter } = readMDXFile(path.join(catDir, file))
      if (frontmatter.localizedSlug === localizedSlug) {
        const slugEs = file.replace(/\.mdx$/, '')
        const slugByLocale = buildSlugByLocale(cat, slugEs)
        return { slugEs, slugByLocale }
      }
    }
  }
  return null
}

/**
 * `true` si existe un MDX para esa locale específica. La locale ES siempre
 * cuenta como traducida (es la fuente). El resto solo si existe el archivo
 * `{locale}/{cat}/{slug}.mdx`.
 *
 * Caller usa esto para decidir si emitir noindex en CA/EN y si incluir la
 * URL en el sitemap de esa locale.
 */
export function hasTranslation(
  cat: string,
  slug: string,
  locale: Locale,
): boolean {
  if (locale === DEFAULT_LOCALE) return true
  return fs.existsSync(mdxPath(locale, cat, slug))
}

export function getMiradasByCategory(cat: string): MiradaMeta[] {
  return getAllMiradas().filter((m) => m.cat === cat)
}

export function getAllSlugs(): { cat: string; slug: string }[] {
  return getAllMiradas().map(({ cat, slug }) => ({ cat, slug }))
}

export function getCategories(): string[] {
  return [...new Set(getAllMiradas().map((m) => m.cat))]
}

/* ==========================================================================
   Helpers — tiempo de lectura + siguiente artículo
   ========================================================================== */

/** Estima minutos de lectura: palabras / 200 wpm (mínimo 1). */
export function calculateReadingTime(content: string): number {
  const text = content
    .replace(/```[\s\S]*?```/g, ' ') // strip code blocks
    .replace(/[#*_`>[\](){}-]/g, ' ') // strip markdown markers
    .replace(/\s+/g, ' ')
    .trim()
  const words = text ? text.split(' ').length : 0
  return Math.max(1, Math.round(words / 200))
}

/** Hash simple para deterministic "random" sin Math.random() (estable en SSG). */
function hashCode(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return h
}

/**
 * Sugiere el siguiente artículo: random determinístico de la misma categoría
 * (excluyendo el actual). Si no hay otros en la misma categoría, cae a un
 * random determinístico de cualquier categoría.
 */
export function getNextArticle(cat: string, slug: string): MiradaMeta | null {
  const all = getAllMiradas()
  const sameCat = all.filter((a) => a.cat === cat && a.slug !== slug)
  const pool = sameCat.length > 0 ? sameCat : all.filter((a) => a.slug !== slug)
  if (pool.length === 0) return null
  const idx = Math.abs(hashCode(`${cat}/${slug}`)) % pool.length
  return pool[idx]
}
