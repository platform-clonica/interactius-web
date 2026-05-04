import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const CONTENT_DIR = path.join(process.cwd(), 'content/miradas')

export interface MiradaFrontmatter {
  title: string
  description: string
  publishedAt: string
  author: string
  category: string
  image?: string
  /**
   * Tags del artículo — claves que mapean al namespace i18n
   * `miradas.grid.categories` (las mismas que aparecen como filtros en
   * la home de Miradas). Primer elemento = chip destacado (dark bg).
   */
  tags?: string[]
}

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
    const files = fs.readdirSync(catDir).filter((f) => f.endsWith('.mdx'))

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

export function getMiradaBySlug(cat: string, slug: string): Mirada | null {
  const filePath = path.join(CONTENT_DIR, cat, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  const { frontmatter, content } = readMDXFile(filePath)
  return { ...frontmatter, slug, cat, content }
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
