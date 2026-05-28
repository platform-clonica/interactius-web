/**
 * scripts/validate-miradas.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * Valida los frontmatters de los artículos Miradas contra el schema Zod.
 * Comprueba:
 *   - Frontmatter: campos requeridos, tipos, formato.
 *   - Coherencia path-frontmatter: carpeta = category, parentCategory =
 *     SUB_TO_PARENT[category], filename = slug.
 *   - Image path: si existe, debe seguir el formato /miradas-assets/<slug>/<file>.
 *
 * Uso:
 *   npm run validate:miradas
 *
 * Sale con código 0 si todo pasa, 1 si hay errores.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'

const ROOT = process.cwd()
const CONTENT_DIR = path.join(ROOT, 'content', 'miradas')

// ─── Constants (espejo de lib/miradas/frontmatter.schema.ts) ──────────
const MIRADAS_PARENT_CATEGORIES = [
  'pensamiento-estrategico',
  'diseno-experiencias',
  'transformacion-cultural',
]

const MIRADAS_SUBCATEGORIES = [
  'diseno-estrategico',
  'innovacion',
  'futuros',
  'marca',
  'diseno-ux-ui',
  'ux-research',
  'clonica',
  'ia-aplicada',
  'cultura-organizacional',
  'workshops',
]

const SUB_TO_PARENT = {
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

const dateRe = /^\d{4}-\d{2}-\d{2}$/
const slugRe = /^[a-zA-Z0-9_.-]+$/
const imagePathRe =
  /^\/miradas-assets\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\.(?:webp|jpg|jpeg|png|gif|svg)$/i

const FrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  publishedAt: z.string().regex(dateRe),
  modifiedAt: z.string().regex(dateRe).optional(),
  author: z.string().min(1),
  category: z.enum(MIRADAS_SUBCATEGORIES),
  parentCategory: z.enum(MIRADAS_PARENT_CATEGORIES),
  slug: z.string().regex(slugRe),
  image: z.string().regex(imagePathRe).optional(),
  tags: z.array(z.string()).optional(),
  // Translation metadata (solo en MDX bajo content/miradas/{ca,en}/).
  translatedBy: z.enum(['ai', 'human']).optional(),
  translatedAt: z.string().regex(dateRe).optional(),
  localizedSlug: z.string().regex(/^[a-z0-9-]+$/).optional(),
})

// ─── Walk + validate ──────────────────────────────────────────────────
async function findMdxFiles(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...(await findMdxFiles(p)))
    else if (e.isFile() && p.endsWith('.mdx')) out.push(p)
  }
  return out
}

function pathChecks(fm, filePath) {
  // Estructura esperada: content/miradas/{locale}/{category}/{slug}.mdx
  const errors = []
  const parts = filePath.replace(/\\/g, '/').split('/')
  const folder = parts[parts.length - 2]
  const localeSegment = parts[parts.length - 3]
  const baseName = parts[parts.length - 1].replace(/\.mdx$/, '')
  const VALID_LOCALES = new Set(['es', 'ca', 'en'])
  if (!VALID_LOCALES.has(localeSegment)) {
    errors.push(
      `locale segment "${localeSegment}" ≠ es/ca/en — path must be content/miradas/{locale}/{cat}/{slug}.mdx`,
    )
  }
  if (folder !== fm.category) {
    errors.push(`folder "${folder}" ≠ category "${fm.category}"`)
  }
  const expectedParent = SUB_TO_PARENT[fm.category]
  if (expectedParent !== fm.parentCategory) {
    errors.push(
      `parentCategory "${fm.parentCategory}" ≠ expected "${expectedParent}" for category "${fm.category}"`,
    )
  }
  if (baseName !== fm.slug) {
    errors.push(`filename "${baseName}.mdx" ≠ slug "${fm.slug}"`)
  }
  if (fm.image) {
    const m = fm.image.match(/^\/miradas-assets\/([^/]+)\//)
    if (m && m[1] !== fm.slug) {
      errors.push(`image slug "${m[1]}" ≠ article slug "${fm.slug}"`)
    }
  }
  return errors
}

async function main() {
  console.log('▸ Validando', CONTENT_DIR, '\n')
  const files = await findMdxFiles(CONTENT_DIR)
  console.log(`✓ ${files.length} archivos .mdx encontrados\n`)

  let okCount = 0
  let failCount = 0
  const failures = []
  const distBySub = {}
  for (const sub of MIRADAS_SUBCATEGORIES) distBySub[sub] = 0
  const distByParent = {}
  for (const p of MIRADAS_PARENT_CATEGORIES) distByParent[p] = 0

  for (const file of files) {
    const rel = path.relative(ROOT, file)
    const raw = await fs.readFile(file, 'utf-8')
    const { data } = matter(raw)
    const errors = []

    const parsed = FrontmatterSchema.safeParse(data)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`schema: ${issue.path.join('.')} — ${issue.message}`)
      }
    } else {
      const pErrs = pathChecks(parsed.data, file)
      errors.push(...pErrs)
    }

    if (errors.length) {
      failCount++
      failures.push({ file: rel, errors })
    } else {
      okCount++
      distBySub[parsed.data.category]++
      distByParent[parsed.data.parentCategory]++
    }
  }

  if (failCount === 0) {
    console.log(`✓ ${okCount}/${files.length} válidos\n`)
    console.log('Distribución por subcategoría:')
    for (const sub of MIRADAS_SUBCATEGORIES) {
      console.log(`  ${sub.padEnd(28)} (${SUB_TO_PARENT[sub].padEnd(26)})  ${distBySub[sub]}`)
    }
    console.log('\nDistribución por madre:')
    for (const p of MIRADAS_PARENT_CATEGORIES) {
      console.log(`  ${p.padEnd(28)} ${distByParent[p]}`)
    }
    console.log('')
    process.exit(0)
  }

  console.log(`✗ ${failCount}/${files.length} con errores:\n`)
  for (const f of failures) {
    console.log(`  ${f.file}`)
    for (const e of f.errors) console.log(`    - ${e}`)
  }
  console.log(`\n${okCount} válidos, ${failCount} con errores`)
  process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
