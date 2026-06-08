/**
 * scripts/generate-root-slug-redirects.mjs
 * ─────────────────────────────────────────────────────────────────────
 * Genera `config/root-slug-redirects.mjs`: redirects 301 de los slugs de
 * artículo servidos por WordPress A NIVEL RAÍZ (sin segmento de categoría)
 * hacia su URL canónica `/miradas/<cat>/<slug>`.
 *
 * Por qué: WP exponía cada post como `/<slug>/` (y también como
 * `/YYYY/MM/DD/<slug>/`). Esas URLs no llevan categoría, así que ni el
 * REDIRECT_MAP ni el LEGACY_PREFIX_FALLBACK del middleware las recogían →
 * 404 (verificado en producción, mayo 2026).
 *
 * Fuente de verdad: el árbol de contenido ES en disco
 * (`content/miradas/es/<cat>/<slug>.mdx`). El nombre del directorio ES = la
 * subcategoría canónica; el nombre de fichero = el slug-ES (invariante).
 *
 * Uso: node scripts/generate-root-slug-redirects.mjs
 * NO editar el output a mano: se regenera con este script.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const ES_DIR = path.join(ROOT, 'content/miradas/es')
const OUT = path.join(ROOT, 'config/root-slug-redirects.mjs')

// Rutas top-level reservadas (los 3 locales). Defensivo: un slug de artículo
// jamás debería coincidir, pero excluimos por si acaso para no secuestrar una
// página real con un redirect.
const RESERVED = new Set([
  '', 'miradas', 'mirades', 'thoughts',
  'pensamiento-estrategico', 'pensament-estrategic', 'strategic-thinking',
  'diseno-de-experiencias', 'disseny-d-experiencies', 'experience-design',
  'transformacion-cultural', 'transformacio-cultural', 'cultural-transformation',
  'identidad', 'identitat', 'identity',
  'contacto', 'contacte', 'contact',
  'newsletter', 'testers',
  'aviso-legal', 'avis-legal', 'legal-notice',
  'politica-privacidad', 'politica-privacitat', 'privacy-policy',
  'politica-cookies', 'cookies-policy',
  'terminos', 'termes', 'terms',
])

async function main() {
  const cats = await fs.readdir(ES_DIR, { withFileTypes: true })
  const entries = []
  const seen = new Set()

  for (const cat of cats) {
    if (!cat.isDirectory()) continue
    const files = await fs.readdir(path.join(ES_DIR, cat.name))
    for (const file of files) {
      if (!file.endsWith('.mdx')) continue
      const slug = file.replace(/\.mdx$/, '')
      if (RESERVED.has(slug)) {
        console.warn(`⚠ slug reservado, omitido: ${slug}`)
        continue
      }
      if (seen.has(slug)) {
        console.warn(`⚠ slug duplicado entre categorías, omitido: ${slug}`)
        continue
      }
      seen.add(slug)
      entries.push({
        source: `/${slug}`,
        destination: `/miradas/${cat.name}/${slug}`,
      })
    }
  }

  entries.sort((a, b) => a.source.localeCompare(b.source))

  const body = entries
    .map((e) => `  { source: '${e.source}', destination: '${e.destination}' },`)
    .join('\n')

  const out = `/**
 * config/root-slug-redirects.mjs
 * ─────────────────────────────────────────────────────────────────────
 * Generado por scripts/generate-root-slug-redirects.mjs. NO editar a mano.
 *
 * Redirects 301 de slugs WP a nivel raíz (\`/<slug>\`) → \`/miradas/<cat>/<slug>\`.
 * Total: ${entries.length} entradas.
 */

export const rootSlugRedirects = [
${body}
]
`

  await fs.writeFile(OUT, out, 'utf8')
  console.log(`✓ ${entries.length} root-slug redirects → ${path.relative(ROOT, OUT)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
