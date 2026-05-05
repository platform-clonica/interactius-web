/**
 * scripts/generate-redirects-v2.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * Genera `config/miradas-redirects.mjs` consolidando 3 capas de redirects:
 *
 *   1. WP legacy  → v2 sub        (URL antigua de WordPress directamente al destino v2)
 *   2. v1 → v2                    (URLs de la migración v1 con cat vieja)
 *   3. Listings de cat vieja      (`/miradas/design/` → sub más afín)
 *
 * Estrategia para evitar chains:
 *   - Los WP→v1 originales tenían destination `/miradas/<old-cat>/<slug>/`.
 *     Se reescribe a `/miradas/<sub-v2>/<slug>/` consultando taxonomy_v1.json.
 *   - Si un redirect WP histórico apunta a un slug que NO está en
 *     taxonomy_v1.json (era placeholder o artículo no migrado), se redirige
 *     a `/miradas/` listing global. Se reportan en una sección "orphan".
 *   - Los redirects no-Miradas (corporate, legacy /blog, etc.) se conservan
 *     intactos.
 *
 * Uso:
 *   node scripts/generate-redirects-v2.mjs
 */

import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const TAXONOMY_JSON = path.join(ROOT, 'scripts', 'taxonomy_v1.json')
// Snapshot del next.config.mjs ANTES de la migración v2 (con los 121
// redirects WP→v1 inline). Se conserva en repo para que el script sea
// idempotente. NO editar a mano — es histórico.
const LEGACY_SNAPSHOT = path.join(ROOT, 'scripts', 'legacy-redirects-snapshot.mjs')
const OUT_FILE = path.join(ROOT, 'config', 'miradas-redirects.mjs')

const LISTING_TARGETS = {
  design: 'diseno-ux-ui',
  'diseno-inclusivo': 'diseno-ux-ui',
  ux: 'diseno-ux-ui',
  research: 'ux-research',
  ia: 'ia-aplicada',
  estrategia: 'innovacion',
  workshops: 'workshops',
}

// ─── Helpers ──────────────────────────────────────────────────────────
function isMiradasOldPath(dest) {
  // /miradas/<old-cat>/<slug>/  o  /miradas/<old-cat>/<slug>
  return /^\/miradas\/(design|diseno-inclusivo|ux|research|ia|estrategia|workshops)\/[^/]+\/?$/.test(
    dest,
  )
}

function parseMiradasOldPath(dest) {
  const m = dest.match(/^\/miradas\/([^/]+)\/([^/]+)\/?$/)
  if (!m) return null
  return { cat: m[1], slug: m[2] }
}

// Extrae redirects existentes del next.config.mjs como objetos {source,destination,permanent}.
function extractExistingRedirects(text) {
  const re =
    /\{\s*source:\s*'([^']+)'\s*,\s*destination:\s*'([^']+)'\s*,\s*permanent:\s*(true|false)\s*\}/g
  const out = []
  let m
  while ((m = re.exec(text)) !== null) {
    out.push({ source: m[1], destination: m[2], permanent: m[3] === 'true' })
  }
  return out
}

// ─── Main ──────────────────────────────────────────────────────────────
async function main() {
  const taxonomy = JSON.parse(await fs.readFile(TAXONOMY_JSON, 'utf-8'))
  const slugToSub = new Map()
  for (const a of taxonomy.assignments) {
    slugToSub.set(a.slug, a.assigned_sub)
  }
  console.log(`✓ ${slugToSub.size} slugs en taxonomy_v1.json`)

  const configText = await fs.readFile(LEGACY_SNAPSHOT, 'utf-8')
  const existing = extractExistingRedirects(configText)
  console.log(`✓ ${existing.length} redirects existentes en snapshot legacy`)

  const buckets = {
    wp_legacy: [],         // WP slugs reescritos a v2
    wp_legacy_orphan: [],  // WP slugs que no están en taxonomy → /miradas/
    v1_to_v2: [],          // /miradas/<old-cat>/<slug>/ → /miradas/<sub-v2>/<slug>/
    listing_old: [],       // /miradas/<old-cat>/ → /miradas/<sub-target>/
    corporate: [],         // resto sin tocar
  }

  // Helper: normalizar a sin trailing slash (para sources y destinations).
  // Next.js con trailingSlash: false (nuestro caso) normaliza las URLs entrantes
  // a sin slash antes de evaluar redirects, y las internas también las quiere
  // sin slash. Por eso TODOS los redirects (source y destination) usan la
  // forma sin trailing slash. URLs antiguas con `/` final hacen 2 saltos
  // (normalize + redirect) — es el mínimo posible sin cambiar el global
  // trailingSlash. URLs sin `/` hacen 1 salto al destino final.
  const stripTrailing = (p) => (p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p)

  // 1. Reescribir los redirects existentes
  for (const r of existing) {
    if (isMiradasOldPath(r.destination)) {
      const parsed = parseMiradasOldPath(r.destination)
      if (parsed && slugToSub.has(parsed.slug)) {
        const sub = slugToSub.get(parsed.slug)
        buckets.wp_legacy.push({
          source: stripTrailing(r.source),
          destination: `/miradas/${sub}/${parsed.slug}`,
          permanent: true,
        })
      } else {
        buckets.wp_legacy_orphan.push({
          source: stripTrailing(r.source),
          destination: '/miradas',
          permanent: true,
        })
      }
    } else {
      buckets.corporate.push({
        source: stripTrailing(r.source),
        destination: stripTrailing(r.destination),
        permanent: r.permanent,
      })
    }
  }

  // 2. Añadir v1 → v2 (para cada slug en taxonomy donde old_cat ≠ assigned_sub)
  for (const a of taxonomy.assignments) {
    if (a.old_cat === a.assigned_sub) continue
    buckets.v1_to_v2.push({
      source: `/miradas/${a.old_cat}/${a.slug}`,
      destination: `/miradas/${a.assigned_sub}/${a.slug}`,
      permanent: true,
    })
  }

  // 3. Listings viejos → sub afín
  for (const [oldCat, target] of Object.entries(LISTING_TARGETS)) {
    buckets.listing_old.push({
      source: `/miradas/${oldCat}`,
      destination: `/miradas/${target}`,
      permanent: true,
    })
  }

  // ─── Dedupe por source (último gana) ────────────────────────────────
  const seen = new Map()
  const order = ['wp_legacy', 'wp_legacy_orphan', 'v1_to_v2', 'listing_old', 'corporate']
  for (const bucket of order) {
    for (const r of buckets[bucket]) {
      if (!seen.has(r.source)) {
        seen.set(r.source, { ...r, _bucket: bucket })
      }
    }
  }
  const unique = [...seen.values()]

  // Re-bucketize for stats
  const stats = { wp_legacy: 0, wp_legacy_orphan: 0, v1_to_v2: 0, listing_old: 0, corporate: 0 }
  for (const r of unique) stats[r._bucket]++

  // ─── Escribir archivo ──────────────────────────────────────────────
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true })
  const lines = []
  lines.push('/**')
  lines.push(' * config/miradas-redirects.mjs')
  lines.push(' * ─────────────────────────────────────────────────────────────────────')
  lines.push(' * Generado por scripts/generate-redirects-v2.mjs. NO editar a mano: las')
  lines.push(' * modificaciones se sobreescriben en cada regeneración.')
  lines.push(' *')
  lines.push(` * Generado: ${new Date().toISOString()}`)
  lines.push(` * Total: ${unique.length} redirects`)
  lines.push(` *   wp_legacy:        ${stats.wp_legacy}  (WP → v2 directo)`)
  lines.push(` *   wp_legacy_orphan: ${stats.wp_legacy_orphan}  (WP → /miradas/ por slug ausente)`)
  lines.push(` *   v1_to_v2:         ${stats.v1_to_v2}  (cat vieja → sub v2)`)
  lines.push(` *   listing_old:      ${stats.listing_old}  (listing cat vieja → sub afín)`)
  lines.push(` *   corporate:        ${stats.corporate}  (no-miradas, sin tocar)`)
  lines.push(' */')
  lines.push('')
  lines.push('export const miradasRedirects = [')

  // Agrupar por bucket en el output
  for (const bucket of order) {
    const inBucket = unique.filter((r) => r._bucket === bucket)
    if (inBucket.length === 0) continue
    lines.push(`  // ── ${bucket.toUpperCase()} (${inBucket.length}) ──`)
    for (const r of inBucket) {
      lines.push(
        `  { source: '${r.source}', destination: '${r.destination}', permanent: ${r.permanent} },`,
      )
    }
    lines.push('')
  }

  lines.push(']')
  lines.push('')

  await fs.writeFile(OUT_FILE, lines.join('\n'), 'utf-8')

  console.log('')
  console.log('──── Resumen ────')
  console.log(`  wp_legacy:        ${stats.wp_legacy}`)
  console.log(`  wp_legacy_orphan: ${stats.wp_legacy_orphan}`)
  console.log(`  v1_to_v2:         ${stats.v1_to_v2}`)
  console.log(`  listing_old:      ${stats.listing_old}`)
  console.log(`  corporate:        ${stats.corporate}`)
  console.log(`  Total único:      ${unique.length}`)
  console.log(`\n✓ Wrote ${OUT_FILE}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
