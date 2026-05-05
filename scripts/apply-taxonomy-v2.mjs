/**
 * scripts/apply-taxonomy-v2.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * Aplica `scripts/taxonomy_v1.json` al disco:
 *   1. Reescribe el frontmatter de cada .mdx (category, parentCategory).
 *   2. Reescribe paths de imágenes en frontmatter + body:
 *        /miradas/<old-cat>/<slug>/<file>  →  /miradas-assets/<slug>/<file>
 *   3. Mueve `content/miradas/<old-cat>/<slug>.mdx`
 *      a `content/miradas/<assigned_sub>/<slug>.mdx`.
 *   4. Mueve `public/miradas/<old-cat>/<slug>/*`
 *      a `public/miradas-assets/<slug>/*`.
 *   5. Borra carpetas vacías de content/miradas/<old-cat>/ y public/miradas/<old-cat>/.
 *
 * Idempotente: si un .mdx ya está en su sub destino, lo deja.
 *
 * Uso:
 *   node scripts/apply-taxonomy-v2.mjs --dry-run
 *   node scripts/apply-taxonomy-v2.mjs
 *
 * Flags:
 *   --dry-run   No escribe nada al disco.
 *   --json <p>  Path al taxonomy json (default scripts/taxonomy_v1.json).
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { existsSync } from 'node:fs'

const args = parseArgs(process.argv.slice(2))
const ROOT = process.cwd()
const TAXONOMY_JSON = args.json || path.join(ROOT, 'scripts', 'taxonomy_v1.json')
const CONTENT_DIR = path.join(ROOT, 'content', 'miradas')
const PUBLIC_OLD = path.join(ROOT, 'public', 'miradas')
const PUBLIC_NEW = path.join(ROOT, 'public', 'miradas-assets')
const DRY_RUN = !!args['dry-run']

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const k = a.slice(2)
      const next = argv[i + 1]
      if (!next || next.startsWith('--')) out[k] = true
      else { out[k] = next; i++ }
    }
  }
  return out
}

// ─── Frontmatter helpers ──────────────────────────────────────────────
function splitFrontmatter(text) {
  const m = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/)
  if (!m) return null
  return { fm: m[0], fmInner: m[1], body: text.slice(m[0].length) }
}

function setOrInsertField(fm, key, value, afterKey) {
  // Try replace existing line
  const lineRe = new RegExp(`^${key}:[ \\t]+.+$`, 'm')
  if (lineRe.test(fm)) {
    return fm.replace(lineRe, `${key}: ${value}`)
  }
  // Insert after `afterKey` line
  const afterRe = new RegExp(`(^${afterKey}:[ \\t]+.+$)`, 'm')
  if (afterRe.test(fm)) {
    return fm.replace(afterRe, `$1\n${key}: ${value}`)
  }
  // Insert at top (after first --- if multilínea)
  return fm.replace(/^---\s*\r?\n/, `---\n${key}: ${value}\n`)
}

// ─── Image path rewrite (frontmatter + body) ──────────────────────────
const OLD_PATH_RE = /\/miradas\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/g

function rewritePaths(text) {
  return text.replace(OLD_PATH_RE, (_match, _oldCat, slug, file) => {
    return `/miradas-assets/${slug}/${file}`
  })
}

// ─── Move file with mkdir -p ──────────────────────────────────────────
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function moveFile(src, dst) {
  if (DRY_RUN) return
  await ensureDir(path.dirname(dst))
  await fs.rename(src, dst)
}

// ─── Move directory (slug folder under public) ────────────────────────
async function moveSlugAssetsDir(slug, oldCat) {
  const srcDir = path.join(PUBLIC_OLD, oldCat, slug)
  const dstDir = path.join(PUBLIC_NEW, slug)

  if (!existsSync(srcDir)) return { moved: 0, skipped: 0 }

  if (DRY_RUN) {
    const files = await fs.readdir(srcDir)
    return { moved: files.length, skipped: 0 }
  }

  await ensureDir(dstDir)
  const entries = await fs.readdir(srcDir, { withFileTypes: true })
  let moved = 0, skipped = 0
  for (const e of entries) {
    const srcFile = path.join(srcDir, e.name)
    const dstFile = path.join(dstDir, e.name)
    if (existsSync(dstFile)) {
      skipped++
      continue
    }
    await fs.rename(srcFile, dstFile)
    moved++
  }
  // Try to remove empty source dir
  try {
    const remaining = await fs.readdir(srcDir)
    if (remaining.length === 0) await fs.rmdir(srcDir)
  } catch {}
  return { moved, skipped }
}

// ─── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log('▸ apply-taxonomy-v2')
  console.log(`  json:    ${TAXONOMY_JSON}`)
  console.log(`  dry-run: ${DRY_RUN}\n`)

  const tax = JSON.parse(await fs.readFile(TAXONOMY_JSON, 'utf-8'))
  console.log(`✓ Cargadas ${tax.assignments.length} asignaciones\n`)

  let moved = 0
  let alreadyMigrated = 0
  let imagesMoved = 0
  let imagesSkipped = 0
  const errors = []

  for (const a of tax.assignments) {
    const oldMdx = path.join(CONTENT_DIR, a.old_cat, `${a.slug}.mdx`)
    const newMdx = path.join(CONTENT_DIR, a.assigned_sub, `${a.slug}.mdx`)

    // If already at new location, skip
    if (a.old_cat === a.assigned_sub && existsSync(oldMdx)) {
      // Slug might be same path. We still need to verify frontmatter is updated.
    }

    if (existsSync(newMdx) && !existsSync(oldMdx)) {
      alreadyMigrated++
      continue
    }
    if (!existsSync(oldMdx)) {
      errors.push(`Missing source: ${oldMdx}`)
      continue
    }

    // Read, rewrite, write at NEW path
    const original = await fs.readFile(oldMdx, 'utf-8')
    const split = splitFrontmatter(original)
    if (!split) {
      errors.push(`No frontmatter: ${oldMdx}`)
      continue
    }

    let { fm, body } = split

    // 1. Update frontmatter
    fm = setOrInsertField(fm, 'category', a.assigned_sub, 'slug')
    fm = setOrInsertField(fm, 'parentCategory', a.assigned_parent, 'category')

    // 2. Rewrite image paths (in frontmatter + body)
    fm = rewritePaths(fm)
    body = rewritePaths(body)

    const updated = fm + body

    // 3. Move file
    if (oldMdx !== newMdx) {
      await ensureDir(path.dirname(newMdx))
      if (DRY_RUN) {
        // pretend
      } else {
        await fs.writeFile(newMdx, updated, 'utf-8')
        await fs.unlink(oldMdx)
      }
      moved++
    } else {
      // Same path (old_cat === assigned_sub); just rewrite in place
      if (!DRY_RUN) {
        await fs.writeFile(oldMdx, updated, 'utf-8')
      }
      moved++
    }

    // 4. Move public/miradas/<old-cat>/<slug>/* → public/miradas-assets/<slug>/*
    const r = await moveSlugAssetsDir(a.slug, a.old_cat)
    imagesMoved += r.moved
    imagesSkipped += r.skipped
  }

  // 5. Borrar carpetas vacías de content/miradas/<old-cat>/ y public/miradas/<old-cat>/
  const oldContentCats = ['design', 'diseno-inclusivo', 'estrategia', 'ia', 'research', 'ux', 'workshops']
  let removedDirs = 0
  for (const cat of oldContentCats) {
    const dir = path.join(CONTENT_DIR, cat)
    if (!existsSync(dir)) continue
    try {
      const entries = await fs.readdir(dir)
      if (entries.length === 0) {
        if (!DRY_RUN) await fs.rmdir(dir)
        removedDirs++
      } else {
        errors.push(`Carpeta no vacía, dejada: ${dir} (${entries.length} archivos)`)
      }
    } catch (err) {
      errors.push(`Error rmdir ${dir}: ${err.message}`)
    }
  }
  for (const cat of oldContentCats) {
    const dir = path.join(PUBLIC_OLD, cat)
    if (!existsSync(dir)) continue
    try {
      const entries = await fs.readdir(dir)
      if (entries.length === 0) {
        if (!DRY_RUN) await fs.rmdir(dir)
        removedDirs++
      } else {
        errors.push(`Carpeta public no vacía, dejada: ${dir} (${entries.length} entries)`)
      }
    } catch (err) {
      errors.push(`Error rmdir ${dir}: ${err.message}`)
    }
  }

  console.log('──── Resumen ────')
  console.log(`  .mdx procesados:        ${moved}`)
  console.log(`  .mdx ya migrados:       ${alreadyMigrated}`)
  console.log(`  Imágenes movidas:       ${imagesMoved}`)
  console.log(`  Imágenes ya en destino: ${imagesSkipped}`)
  console.log(`  Carpetas viejas borradas: ${removedDirs}`)
  if (errors.length) {
    console.log(`\n  ⚠ ${errors.length} avisos:`)
    for (const e of errors.slice(0, 10)) console.log(`    - ${e}`)
  }
  if (DRY_RUN) console.log('\n(DRY RUN) No se ha tocado el disco.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
