/**
 * scripts/validate-miradas.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * Valida los frontmatters de los artículos Miradas contra el schema Zod.
 * Comprueba (errores → exit 1):
 *   - Frontmatter: campos requeridos, tipos, formato.
 *   - Coherencia path-frontmatter: carpeta = category, parentCategory =
 *     SUB_TO_PARENT[category], filename = slug.
 *   - Image path: si existe, debe seguir el formato /miradas-assets/<slug>/<file>
 *     Y el archivo debe existir realmente en public/.
 *
 * Avisos (no bloquean, exit 0):
 *   - description > 160 car. (se trunca en el SERP).
 *   - author no presente en AuthorAvatar (avatar cae a inicial).
 *   - slug repetido en varias categorías.
 *
 * Uso:
 *   npm run validate:miradas
 *
 * Sale con código 0 si todo pasa, 1 si hay errores.
 */

import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'

const ROOT = process.cwd()
const CONTENT_DIR = path.join(ROOT, 'content', 'miradas')
const PUBLIC_DIR = path.join(ROOT, 'public')

// Longitud recomendada de meta description (SEO): Google trunca ~160 en desktop.
const DESCRIPTION_MAX = 160

// Autores válidos, leídos de components/miradas/AuthorAvatar.tsx (fuente única).
// Un autor fuera de este set degrada a inicial en el avatar (no rompe, warning).
async function loadKnownAuthors() {
  try {
    const src = await fs.readFile(
      path.join(ROOT, 'components', 'miradas', 'AuthorAvatar.tsx'),
      'utf-8',
    )
    const block = src.slice(
      src.indexOf('AUTHOR_PHOTOS'),
      src.indexOf('}', src.indexOf('AUTHOR_PHOTOS')),
    )
    const keys = [...block.matchAll(/['"]?([a-zA-ZÀ-ſ ]+)['"]?\s*:/g)].map((m) =>
      m[1].trim().toLowerCase(),
    )
    const set = new Set()
    for (const k of keys) {
      set.add(k)
      set.add(k.split(' ')[0]) // también el nombre de pila suelto
    }
    return set
  } catch {
    return null // si no se puede leer, se omite el check de autor
  }
}

function normalizeAuthor(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

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

  const knownAuthors = await loadKnownAuthors()

  // --slug=<slug>: acota los AVISOS a ese artículo (los errores se comprueban
  // siempre en todo el contenido). Útil para el alta de un artículo nuevo.
  const slugArg = process.argv
    .slice(2)
    .find((a) => a.startsWith('--slug='))
    ?.slice('--slug='.length)

  let okCount = 0
  let failCount = 0
  const failures = []
  const warnings = [] // { slug, msg }
  const slugToCats = {} // slug (solo ES) → Set(category), para detectar duplicados
  const distBySub = {}
  for (const sub of MIRADAS_SUBCATEGORIES) distBySub[sub] = 0
  const distByParent = {}
  for (const p of MIRADAS_PARENT_CATEGORIES) distByParent[p] = 0

  for (const file of files) {
    const rel = path.relative(ROOT, file)
    const localeSegment = rel.replace(/\\/g, '/').split('/')[2]
    const raw = await fs.readFile(file, 'utf-8')
    const { data } = matter(raw)
    const errors = []

    const parsed = FrontmatterSchema.safeParse(data)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`schema: ${issue.path.join('.')} — ${issue.message}`)
      }
    } else {
      const fm = parsed.data
      errors.push(...pathChecks(fm, file))

      // La imagen referenciada debe existir en public/ (cover roto = 404).
      if (fm.image && !existsSync(path.join(PUBLIC_DIR, fm.image))) {
        errors.push(`image file no existe en public${fm.image}`)
      }

      // Warnings (no rompen el build):
      if (fm.description && fm.description.length > DESCRIPTION_MAX) {
        warnings.push({
          slug: fm.slug,
          msg: `${rel}: description de ${fm.description.length} car. (>${DESCRIPTION_MAX}); se truncará en el SERP`,
        })
      }
      if (knownAuthors && !knownAuthors.has(normalizeAuthor(fm.author))) {
        warnings.push({
          slug: fm.slug,
          msg: `${rel}: author "${fm.author}" no está en AuthorAvatar (avatar caerá a inicial)`,
        })
      }
      // Duplicados de slug entre categorías (solo fuente ES).
      if (localeSegment === 'es') {
        ;(slugToCats[fm.slug] ??= new Set()).add(fm.category)
      }
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

  for (const [slug, cats] of Object.entries(slugToCats)) {
    if (cats.size > 1) {
      warnings.push({
        slug,
        msg: `slug "${slug}" aparece en varias categorías: ${[...cats].join(', ')}`,
      })
    }
  }

  const shownWarnings = slugArg
    ? warnings.filter((w) => w.slug === slugArg)
    : warnings
  if (shownWarnings.length) {
    const scope = slugArg ? ` para "${slugArg}"` : ''
    console.log(`⚠ ${shownWarnings.length} avisos${scope} (no bloquean):`)
    for (const w of shownWarnings) console.log(`  - ${w.msg}`)
    console.log('')
  } else if (slugArg && warnings.length) {
    console.log(`✓ sin avisos para "${slugArg}" (${warnings.length} en total en el repo)\n`)
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
