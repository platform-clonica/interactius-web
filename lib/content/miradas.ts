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
  cover?: string
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
