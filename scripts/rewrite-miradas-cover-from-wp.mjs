/**
 * scripts/rewrite-miradas-cover-from-wp.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * Reescribe el campo `image:` del frontmatter de cada `.mdx` para que apunte
 * a la **featured image original de WordPress** del post correspondiente.
 *
 * Sin dependencias externas: parsea el WXR como texto.
 *
 * Flujo:
 *   1. Lee el WXR. Por cada <item>:
 *      - tipo `post` → captura <wp:post_name> (= slug) y el valor de
 *        <wp:meta_value> cuyo <wp:meta_key> es `_thumbnail_id`.
 *      - tipo `attachment` → captura <wp:post_id> y <wp:attachment_url>.
 *   2. Construye:
 *      - postNameToThumbId: Map<slug, post_id>
 *      - attachIdToUrl: Map<post_id, url>
 *   3. Para cada `content/miradas/<cat>/<slug>.mdx`, resuelve
 *      slug → thumb_id → attachment_url. Si la cadena se completa, reescribe
 *      el `image:` del frontmatter con la ruta local sanitizada
 *      `/miradas/<cat>/<slug>/<filename>`. Si falla cualquier paso, se
 *      reporta y NO se toca el .mdx (su cover actual se queda).
 *
 * Uso típico:
 *   node scripts/rewrite-miradas-cover-from-wp.mjs \
 *     --xml ./scripts/interactius.WordPress.2026-05-04.xml \
 *     --dry-run
 *
 * Flags:
 *   --xml <ruta>      WXR de WordPress (obligatorio)
 *   --content <dir>   ./content/miradas por defecto
 *   --dry-run         Solo reporta, no escribe
 *   --only-cat <c>    Filtra por categoría
 *   --only-slug <s>   Filtra por slug
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const args = parseArgs(process.argv.slice(2));
const XML_PATH = args.xml;
const CONTENT_DIR = args.content || './content/miradas';
const DRY_RUN = !!args['dry-run'];
const ONLY_CAT = args['only-cat'] || null;
const ONLY_SLUG = args['only-slug'] || null;

if (!XML_PATH) {
  console.error('✗ Falta --xml <ruta al WXR de WordPress>');
  process.exit(1);
}

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

// ─── XML helpers (regex-only, no XML parser) ──────────────────────────
function readTag(item, tag) {
  // Devuelve el contenido (sin CDATA) de la primera ocurrencia de <tag>...</tag>.
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
  const m = item.match(re);
  if (!m) return null;
  return stripCdata(m[1]).trim();
}

function stripCdata(s) {
  const m = s.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return m ? m[1] : s;
}

function readThumbnailId(item) {
  // Busca un <wp:postmeta> cuyo meta_key sea `_thumbnail_id` y devuelve su meta_value.
  const re = /<wp:postmeta>([\s\S]*?)<\/wp:postmeta>/g;
  let m;
  while ((m = re.exec(item)) !== null) {
    const block = m[1];
    const key = readTag(block, 'wp:meta_key');
    if (key === '_thumbnail_id') {
      const val = readTag(block, 'wp:meta_value');
      if (val && /^\d+$/.test(val)) return val;
    }
  }
  return null;
}

// ─── Frontmatter helpers (idénticos a rewrite-miradas-cover.mjs) ──────
function splitFrontmatter(text) {
  if (!text.startsWith('---')) return { frontmatter: '', body: text, hasFrontmatter: false };
  const re = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/;
  const m = text.match(re);
  if (!m) return { frontmatter: '', body: text, hasFrontmatter: false };
  return { frontmatter: m[0], body: text.slice(m[0].length), hasFrontmatter: true };
}

function rewriteFrontmatterImage(frontmatter, newPath) {
  const mlRe = /^image:[ \t]*[>|][-+]?[ \t]*\r?\n(?:[ \t]+\S.*\r?\n)+/m;
  if (mlRe.test(frontmatter)) {
    return frontmatter.replace(mlRe, `image: ${newPath}\n`);
  }
  const slRe = /^image:[ \t]+.+$/m;
  if (slRe.test(frontmatter)) {
    return frontmatter.replace(slRe, `image: ${newPath}`);
  }
  return null;
}

// ─── Filename sanitize (idéntico a los otros scripts) ─────────────────
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-');
}

function urlToFilename(url) {
  const clean = url.split('?')[0].split('#')[0];
  const last = clean.split('/').pop() || '';
  return sanitizeFilename(last);
}

// ─── Walk MDX files ───────────────────────────────────────────────────
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

// ─── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log('▸ Configuración');
  console.log(`  xml:      ${XML_PATH}`);
  console.log(`  content:  ${CONTENT_DIR}`);
  console.log(`  dry-run:  ${DRY_RUN}`);
  if (ONLY_CAT) console.log(`  only-cat: ${ONLY_CAT}`);
  if (ONLY_SLUG) console.log(`  only-slug: ${ONLY_SLUG}`);
  console.log('');

  // Parse XML
  const xml = await fs.readFile(XML_PATH, 'utf-8');

  // Split items y clasificar
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  const postNameToThumbId = new Map();
  const attachIdToUrl = new Map();

  let postsScanned = 0;
  let attachmentsScanned = 0;

  let im;
  while ((im = itemRe.exec(xml)) !== null) {
    const item = im[1];
    const postType = readTag(item, 'wp:post_type');

    if (postType === 'post') {
      postsScanned++;
      const postName = readTag(item, 'wp:post_name');
      const thumbId = readThumbnailId(item);
      if (postName && thumbId) {
        postNameToThumbId.set(postName, thumbId);
      }
    } else if (postType === 'attachment') {
      attachmentsScanned++;
      const postId = readTag(item, 'wp:post_id');
      const url = readTag(item, 'wp:attachment_url');
      if (postId && url) {
        attachIdToUrl.set(postId, url);
      }
    }
  }

  console.log(`✓ Posts escaneados: ${postsScanned}`);
  console.log(`✓ Attachments escaneados: ${attachmentsScanned}`);
  console.log(`✓ Posts con _thumbnail_id: ${postNameToThumbId.size}`);
  console.log(`✓ Attachments con URL: ${attachIdToUrl.size}`);
  console.log('');

  // Walk .mdx
  const mdxFiles = await findMdxFiles(CONTENT_DIR);
  console.log(`✓ ${mdxFiles.length} archivos .mdx`);

  let updated = 0;
  let noThumbnail = 0;
  let slugNotInXml = 0;
  let thumbIdWithoutAttachment = 0;
  let noFrontmatterField = 0;
  const samples = [];
  const missingSlugList = [];
  const missingThumbList = [];

  for (const mdx of mdxFiles) {
    const rel = path.relative(CONTENT_DIR, mdx);
    const parts = rel.split(path.sep);
    if (parts.length < 2) continue;
    const cat = parts[0];
    const slug = path.basename(mdx, '.mdx');

    if (ONLY_CAT && cat !== ONLY_CAT) continue;
    if (ONLY_SLUG && slug !== ONLY_SLUG) continue;

    const thumbId = postNameToThumbId.get(slug);
    if (!thumbId) {
      // Distinguir "slug no está en el XML como post" vs "está pero sin _thumbnail_id"
      // Para esto, pasada extra rápida (poco frecuente, con set de slugs vistos):
      // (Optimización: pre-construir el set de post_names. Lo hacemos directamente.)
      slugNotInXml++; // se ajusta abajo si lo encontramos como post sin thumb
      missingSlugList.push(rel);
      continue;
    }

    const url = attachIdToUrl.get(thumbId);
    if (!url) {
      thumbIdWithoutAttachment++;
      continue;
    }

    const filename = urlToFilename(url);
    if (!filename) {
      thumbIdWithoutAttachment++;
      continue;
    }
    const newImagePath = `/miradas/${cat}/${slug}/${filename}`;

    const original = await fs.readFile(mdx, 'utf-8');
    const { frontmatter, body, hasFrontmatter } = splitFrontmatter(original);
    if (!hasFrontmatter) continue;

    const newFrontmatter = rewriteFrontmatterImage(frontmatter, newImagePath);
    if (newFrontmatter === null) {
      noFrontmatterField++;
      continue;
    }
    if (newFrontmatter === frontmatter) continue;

    updated++;
    if (samples.length < 5) samples.push({ file: rel, url, newImagePath });

    if (!DRY_RUN) {
      await fs.writeFile(mdx, newFrontmatter + body, 'utf-8');
    }
  }

  // Pasada para distinguir "slug no presente" de "presente pero sin thumb"
  // Construimos el set ahora (mejor para reporte):
  const allPostSlugs = new Set();
  itemRe.lastIndex = 0;
  while ((im = itemRe.exec(xml)) !== null) {
    const item = im[1];
    const postType = readTag(item, 'wp:post_type');
    if (postType === 'post') {
      const postName = readTag(item, 'wp:post_name');
      if (postName) allPostSlugs.add(postName);
    }
  }
  // Recalcular noThumbnail vs slugNotInXml
  let realSlugNotInXml = 0;
  let realNoThumbnail = 0;
  const realMissingSlugs = [];
  const realNoThumbSlugs = [];
  for (const rel of missingSlugList) {
    const slug = path.basename(rel, '.mdx');
    if (allPostSlugs.has(slug)) {
      realNoThumbnail++;
      realNoThumbSlugs.push(rel);
    } else {
      realSlugNotInXml++;
      realMissingSlugs.push(rel);
    }
  }
  noThumbnail = realNoThumbnail;
  slugNotInXml = realSlugNotInXml;

  console.log('');
  console.log('──── Resumen ────');
  console.log(`  Cover actualizado:               ${updated}`);
  console.log(`  Slug en XML pero sin _thumb:     ${noThumbnail}`);
  console.log(`  Slug NO encontrado en XML:       ${slugNotInXml}`);
  console.log(`  _thumb sin attachment válido:    ${thumbIdWithoutAttachment}`);
  console.log(`  Sin campo image en frontmatter:  ${noFrontmatterField}`);

  if (samples.length) {
    console.log('\nMuestra de reescrituras:');
    for (const s of samples) {
      console.log(`  ${s.file}`);
      console.log(`    upstream: ${s.url}`);
      console.log(`    image:    ${s.newImagePath}`);
    }
  }

  if (realNoThumbSlugs.length) {
    console.log(`\nSlugs en XML pero sin _thumbnail_id (${realNoThumbSlugs.length}, primeros 10):`);
    for (const r of realNoThumbSlugs.slice(0, 10)) console.log(`  - ${r}`);
  }
  if (realMissingSlugs.length) {
    console.log(`\nSlugs no presentes en el XML (${realMissingSlugs.length}, primeros 10):`);
    for (const r of realMissingSlugs.slice(0, 10)) console.log(`  - ${r}`);
  }

  if (DRY_RUN) console.log('\n(DRY RUN) No se ha escrito nada.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
