import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

import type { Locale } from '@/lib/i18n/config'
import type {
  MiradaFrontmatter as MiradaFrontmatterStrict,
  MiradasParentCategory,
  MiradasSubcategory,
} from '@/lib/miradas/frontmatter.schema'

const CONTENT_DIR = path.join(process.cwd(), 'content/miradas')

/**
 * Locales no-default tienen archivos MDX traducidos como `{slug}.{locale}.mdx`.
 * Si no existe traducción, se sirve el ES (el path sigue resolviendo) pero la
 * página se marca noindex + canonical a la versión ES. Sin traducción = sin
 * indexación CA/EN.
 */
const DEFAULT_LOCALE: Locale = 'es'

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
}

// Re-export para que el resto del codebase no tenga que importar dos veces
export type { MiradasParentCategory, MiradasSubcategory, MiradaFrontmatterStrict }

export interface MiradaMeta extends MiradaFrontmatter {
  slug: string
  cat: string
}

export interface Mirada extends MiradaMeta {
  content: string
}

function readMDXFile(filePath: string): { frontmatter: MiradaFrontmatter; content: string } {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  return { frontmatter: data as MiradaFrontmatter, content }
}

export function getAllMiradas(): MiradaMeta[] {
  const results: MiradaMeta[] = []

  if (!fs.existsSync(CONTENT_DIR)) return results

  const cats = fs.readdirSync(CONTENT_DIR).filter((f) =>
    fs.statSync(path.join(CONTENT_DIR, f)).isDirectory(),
  )

  for (const cat of cats) {
    const catDir = path.join(CONTENT_DIR, cat)
    // Lista solo MDX en castellano (la "fuente"). Las traducciones viven
    // como `{slug}.{locale}.mdx` junto al original y NO deben aparecer
    // como artículos independientes en el listado.
    const files = fs
      .readdirSync(catDir)
      .filter((f) => f.endsWith('.mdx') && !/\.(?:ca|en)\.mdx$/.test(f))

    for (const file of files) {
      const slug = file.replace(/\.mdx$/, '')
      const { frontmatter } = readMDXFile(path.join(catDir, file))
      results.push({ ...frontmatter, slug, cat })
    }
  }

  return results.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
}

/**
 * Devuelve el artículo para la locale dada. Si `locale !== 'es'` y existe un
 * archivo `{slug}.{locale}.mdx`, se devuelve esa traducción. Sino, fallback al
 * MDX en castellano (la página debe marcarse noindex en ese caso — ver
 * `hasTranslation`).
 */
export function getMiradaBySlug(
  cat: string,
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): Mirada | null {
  if (locale !== DEFAULT_LOCALE) {
    const localePath = path.join(CONTENT_DIR, cat, `${slug}.${locale}.mdx`)
    if (fs.existsSync(localePath)) {
      const { frontmatter, content } = readMDXFile(localePath)
      return { ...frontmatter, slug, cat, content }
    }
  }
  const filePath = path.join(CONTENT_DIR, cat, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  const { frontmatter, content } = readMDXFile(filePath)
  return { ...frontmatter, slug, cat, content }
}

/**
 * `true` si existe un MDX para esa locale específica. La locale ES siempre
 * cuenta como traducida (es la fuente). El resto solo si existe el archivo
 * `{slug}.{locale}.mdx`.
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
  const localePath = path.join(CONTENT_DIR, cat, `${slug}.${locale}.mdx`)
  return fs.existsSync(localePath)
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
