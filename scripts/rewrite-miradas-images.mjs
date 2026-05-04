/**
 * scripts/rewrite-miradas-images.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * Reescribe las URLs remotas de WordPress en los .mdx de Miradas a paths
 * locales `/miradas/<cat>/<slug>/<filename-sanitizado>`.
 *
 * Es el paso PREVIO a `download-miradas-images.mjs`. Ese script asume que
 * los .mdx ya tienen rutas locales — éste las prepara.
 *
 * Cómo funciona:
 *   1. Recorre `content/miradas/<cat>/<slug>.mdx`.
 *   2. En cada archivo busca URLs `https?://(www.)?interactius.com/wp-content/uploads/…`
 *      en cualquier posición del cuerpo (no toca el frontmatter, que ya está
 *      en formato local).
 *   3. Por cada URL: toma el último segmento del path (sin querystring/hash)
 *      y aplica el mismo sanitize que el download script:
 *      `[^a-zA-Z0-9._-] → '-'`. Reemplaza la URL por
 *      `/miradas/<cat>/<slug>/<filename-sanitizado>`.
 *   4. Sobrescribe el .mdx (a menos que `--dry-run`).
 *
 * Uso:
 *   node scripts/rewrite-miradas-images.mjs \
 *     --content ./content/miradas \
 *     --dry-run
 *
 *   node scripts/rewrite-miradas-images.mjs --content ./content/miradas
 *
 * Flags:
 *   --dry-run   No escribe; solo muestra resumen y muestra de cambios.
 *   --only-cat <cat>   Solo procesa una categoría (debug).
 *   --only-slug <s>    Solo procesa un slug (debug).
 */

import fs from 'node:fs/promises';
import path from 'node:path';

// ─── CLI ────────────────────────────────────────────────────────────────
const args = parseArgs(process.argv.slice(2));
const CONTENT_DIR = args.content || './content/miradas';
const DRY_RUN = !!args['dry-run'];
const ONLY_CAT = args['only-cat'] || null;
const ONLY_SLUG = args['only-slug'] || null;

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) out[k] = true;
      else { out[k] = next; i++; }
    }
  }
  return out;
}

// ─── Helpers ───────────────────────────────────────────────────────────
async function findMdxFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await findMdxFiles(p)));
    else if (e.isFile() && p.endsWith('.mdx')) out.push(p);
  }
  return out;
}

const WP_URL_RE = /https?:\/\/(?:www\.)?interactius\.com\/wp-content\/uploads\/[^\s"'<>)\]]+/g;

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-');
}

function urlToFilename(url) {
  const clean = url.split('?')[0].split('#')[0];
  const last = clean.split('/').pop() || '';
  return sanitizeFilename(last);
}

// Separa frontmatter del cuerpo. Devuelve { frontmatter, body, hasFrontmatter }.
// El frontmatter es el bloque inicial entre `---\n` y `\n---\n`.
function splitFrontmatter(text) {
  if (!text.startsWith('---')) {
    return { frontmatter: '', body: text, hasFrontmatter: false };
  }
  // Buscar el siguiente `---` que cierre el frontmatter (en línea propia).
  const re = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/;
  const m = text.match(re);
  if (!m) return { frontmatter: '', body: text, hasFrontmatter: false };
  const fmEnd = m[0].length;
  return {
    frontmatter: text.slice(0, fmEnd),
    body: text.slice(fmEnd),
    hasFrontmatter: true,
  };
}

// ─── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log('▸ Configuración');
  console.log(`  content: ${CONTENT_DIR}`);
  console.log(`  dry-run: ${DRY_RUN}`);
  if (ONLY_CAT) console.log(`  only-cat: ${ONLY_CAT}`);
  if (ONLY_SLUG) console.log(`  only-slug: ${ONLY_SLUG}`);
  console.log('');

  const mdxFiles = await findMdxFiles(CONTENT_DIR);
  console.log(`✓ ${mdxFiles.length} archivos .mdx`);

  let filesChanged = 0;
  let urlsRewritten = 0;
  let filesSkippedFilter = 0;
  let filesNoMatches = 0;
  const samples = []; // {file, before, after}
  const filesWithoutCat = [];

  for (const mdx of mdxFiles) {
    const rel = path.relative(CONTENT_DIR, mdx);
    const parts = rel.split(path.sep);
    if (parts.length < 2) {
      filesWithoutCat.push(rel);
      continue;
    }
    const cat = parts[0];
    const slug = path.basename(mdx, '.mdx');

    if (ONLY_CAT && cat !== ONLY_CAT) { filesSkippedFilter++; continue; }
    if (ONLY_SLUG && slug !== ONLY_SLUG) { filesSkippedFilter++; continue; }

    const original = await fs.readFile(mdx, 'utf-8');
    const { frontmatter, body, hasFrontmatter } = splitFrontmatter(original);

    let count = 0;
    const newBody = body.replace(WP_URL_RE, (url) => {
      const fname = urlToFilename(url);
      if (!fname) return url;
      count++;
      const localPath = `/miradas/${cat}/${slug}/${fname}`;
      if (samples.length < 5) samples.push({ file: rel, before: url, after: localPath });
      return localPath;
    });

    if (count === 0) { filesNoMatches++; continue; }

    const newText = hasFrontmatter ? frontmatter + newBody : newBody;
    if (newText === original) { filesNoMatches++; continue; }

    filesChanged++;
    urlsRewritten += count;

    if (!DRY_RUN) {
      await fs.writeFile(mdx, newText, 'utf-8');
    }
  }

  console.log('');
  console.log('──── Resumen ────');
  console.log(`  Archivos cambiados:   ${filesChanged}`);
  console.log(`  URLs reescritas:      ${urlsRewritten}`);
  console.log(`  Sin coincidencias:    ${filesNoMatches}`);
  if (filesSkippedFilter) console.log(`  Filtrados:            ${filesSkippedFilter}`);
  if (filesWithoutCat.length) {
    console.log(`  Sin categoría (raros):${filesWithoutCat.length}`);
    for (const f of filesWithoutCat.slice(0, 5)) console.log(`    - ${f}`);
  }

  if (samples.length) {
    console.log('\nMuestra de reescrituras:');
    for (const s of samples) {
      console.log(`  ${s.file}`);
      console.log(`    - ${s.before}`);
      console.log(`    + ${s.after}`);
    }
  }

  if (DRY_RUN) {
    console.log('\n(DRY RUN) No se ha escrito nada.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
