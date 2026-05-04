/**
 * scripts/download-miradas-images.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * Descarga las imágenes del WordPress legacy a public/miradas/<cat>/<slug>/.
 *
 * Cómo funciona:
 * 1. Lee los 125 .mdx de content/miradas/<cat>/<slug>.mdx y extrae los
 *    paths locales que esperan tener imágenes (ej. /miradas/design/foo/x.jpg).
 * 2. Lee el XML del WordPress (interactius_WordPress_*.xml) y extrae
 *    todas las URLs http(s)://interactius.com/wp-content/uploads/.../filename.
 * 3. Empareja por filename. Para cada path local esperado, busca la URL
 *    de WordPress que tenga el mismo filename y la descarga al disco.
 * 4. Reporta éxitos, fallos y huérfanos (paths sin URL upstream).
 *
 * Sin dependencias externas. Solo Node 18+ (fetch nativo).
 *
 * Uso típico desde la raíz del repo:
 *
 *   node scripts/download-miradas-images.mjs \
 *     --content ./content/miradas \
 *     --public  ./public/miradas \
 *     --xml     ./scripts/interactius_WordPress_2026-05-04.xml
 *
 * Flags:
 *   --dry-run        No descarga ni escribe archivos. Solo muestra qué haría.
 *   --concurrency N  Conexiones paralelas (default 8). Bajar a 4 si el WP
 *                    devuelve 429 / bloquea por ratelimit.
 *   --only-cat <cat> Solo procesar una categoría (debug).
 *   --only-slug <s>  Solo procesar un slug (debug).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

// ─── CLI ────────────────────────────────────────────────────────────────
const args = parseArgs(process.argv.slice(2));
const CONTENT_DIR = args.content || './content/miradas';
const PUBLIC_DIR = args.public || './public/miradas';
const XML_PATH = args.xml;
const DRY_RUN = !!args['dry-run'];
const CONCURRENCY = parseInt(args.concurrency || '8', 10);
const RETRIES = 3;
const ONLY_CAT = args['only-cat'] || null;
const ONLY_SLUG = args['only-slug'] || null;

if (!XML_PATH) {
  console.error('✗ Falta --xml <ruta al WXR de WordPress>');
  console.error('  Ejemplo:');
  console.error('    node scripts/download-miradas-images.mjs \\');
  console.error('      --xml ./scripts/interactius_WordPress_2026-05-04.xml');
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

// ─── Recolectar paths locales esperados desde los .mdx ────────────────
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

const SRC_PATTERNS = [
  /<ImageWithCaption[^>]*\ssrc="([^"]+)"/g,
  /<img[^>]*\ssrc="([^"]+)"/g,
  /!\[[^\]]*\]\(([^)\s]+)/g,
  // Frontmatter `image:` — single-line (`image: /miradas/...`)
  /^image:[ \t]+(\/miradas\/\S+)/gm,
  // Frontmatter `image:` — YAML folded multilínea (`image: >-` y valor en línea indentada)
  /^image:[ \t]*[>|][-+]?[ \t]*\r?\n[ \t]+(\/miradas\/\S+)/gm,
];

function extractLocalSrcs(text) {
  const found = new Set();
  for (const re of SRC_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const url = m[1];
      if (url.startsWith('/miradas/')) found.add(url);
    }
  }
  return [...found];
}

function parseLocalPath(url) {
  // /miradas/<cat>/<slug>/<filename>
  const m = url.match(/^\/miradas\/([^/]+)\/([^/]+)\/(.+)$/);
  if (!m) return null;
  return { cat: m[1], slug: m[2], filename: m[3] };
}

// ─── Construir índice de URLs upstream desde el XML ───────────────────
function buildXmlImageIndex(xml) {
  // Extraer todas las URLs http(s)://(www.)?interactius.com/wp-content/uploads/...
  const set = new Set();
  const re = /https?:\/\/(?:www\.)?interactius\.com\/wp-content\/uploads\/[^\s"'<>)\]]+/g;
  const matches = xml.match(re) || [];
  for (const u of matches) set.add(u);

  // Index por filename (último segmento, sin querystring)
  // Si dos URLs comparten filename, las guardamos todas y el caller elige.
  const byFilename = new Map();
  for (const u of set) {
    const clean = u.split('?')[0].split('#')[0];
    let fname = clean.split('/').pop() || '';
    // Sanitizar igual que en migrate-wp-to-mdx (caracteres no permitidos → '-')
    const sanitized = fname.replace(/[^a-zA-Z0-9._-]/g, '-');
    if (!byFilename.has(sanitized)) byFilename.set(sanitized, []);
    byFilename.get(sanitized).push(u);
  }
  return byFilename;
}

// ─── Descarga ─────────────────────────────────────────────────────────
async function downloadOne(url, diskPath) {
  if (existsSync(diskPath)) return { ok: true, cached: true };
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Interactius-Migration/1.0)',
          Accept: 'image/webp,image/avif,image/png,image/jpeg,*/*',
          Referer: 'https://www.interactius.com/',
        },
        redirect: 'follow',
      });
      if (!res.ok) {
        if (attempt < RETRIES) {
          await new Promise((r) => setTimeout(r, 500 * attempt));
          continue;
        }
        return { ok: false, error: `HTTP ${res.status}` };
      }
      const buf = Buffer.from(await res.arrayBuffer());
      await fs.mkdir(path.dirname(diskPath), { recursive: true });
      await fs.writeFile(diskPath, buf);
      return { ok: true, bytes: buf.length };
    } catch (err) {
      if (attempt < RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
        continue;
      }
      return { ok: false, error: err.message };
    }
  }
  return { ok: false, error: 'unknown' };
}

// ─── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log('▸ Configuración');
  console.log(`  content: ${CONTENT_DIR}`);
  console.log(`  public:  ${PUBLIC_DIR}`);
  console.log(`  xml:     ${XML_PATH}`);
  console.log(`  dry-run: ${DRY_RUN}`);
  console.log(`  concurrency: ${CONCURRENCY}`);
  if (ONLY_CAT) console.log(`  only-cat: ${ONLY_CAT}`);
  if (ONLY_SLUG) console.log(`  only-slug: ${ONLY_SLUG}`);
  console.log('');

  const mdxFiles = await findMdxFiles(CONTENT_DIR);
  console.log(`✓ ${mdxFiles.length} archivos .mdx`);

  const xmlText = await fs.readFile(XML_PATH, 'utf-8');
  const xmlIndex = buildXmlImageIndex(xmlText);
  console.log(`✓ ${xmlIndex.size} filenames únicos en el XML`);

  // Recolectar tareas
  const tasks = []; // {url, diskPath, expected, ...}
  for (const mdx of mdxFiles) {
    const text = await fs.readFile(mdx, 'utf-8');
    const srcs = extractLocalSrcs(text);
    for (const src of srcs) {
      const meta = parseLocalPath(src);
      if (!meta) continue;
      if (ONLY_CAT && meta.cat !== ONLY_CAT) continue;
      if (ONLY_SLUG && meta.slug !== ONLY_SLUG) continue;

      const candidates = xmlIndex.get(meta.filename) || [];
      const upstream = candidates[0] || null; // primera coincidencia
      const diskPath = path.join(PUBLIC_DIR, meta.cat, meta.slug, meta.filename);
      tasks.push({
        upstream,
        diskPath,
        webPath: src,
        cat: meta.cat,
        slug: meta.slug,
        filename: meta.filename,
        candidates: candidates.length,
      });
    }
  }

  // Deduplicar tareas que apuntan al mismo diskPath
  const byDisk = new Map();
  for (const t of tasks) {
    if (!byDisk.has(t.diskPath)) byDisk.set(t.diskPath, t);
  }
  const unique = [...byDisk.values()];

  const orphans = unique.filter((t) => !t.upstream);
  const downloads = unique.filter((t) => t.upstream);

  console.log(`✓ ${tasks.length} referencias en .mdx (${unique.length} archivos únicos a obtener)`);
  console.log(`  con URL upstream: ${downloads.length}`);
  console.log(`  huérfanos (sin URL en XML): ${orphans.length}`);

  if (orphans.length) {
    console.log('\n⚠ Primeros 10 huérfanos:');
    for (const o of orphans.slice(0, 10)) {
      console.log(`  ${o.cat}/${o.slug}/${o.filename}`);
    }
  }

  if (DRY_RUN) {
    console.log('\n(DRY RUN) No se descargará nada.');
    if (downloads.length) {
      console.log('\nPrimeras 5 descargas que se harían:');
      for (const d of downloads.slice(0, 5)) {
        console.log(`  ${d.upstream}\n    → ${d.diskPath}`);
      }
    }
    return;
  }

  // Descargar con concurrencia limitada
  const results = { ok: 0, cached: 0, fail: 0, bytes: 0, failures: [] };
  let idx = 0;
  async function worker() {
    while (idx < downloads.length) {
      const i = idx++;
      const d = downloads[i];
      const res = await downloadOne(d.upstream, d.diskPath);
      if (res.ok) {
        if (res.cached) results.cached++;
        else { results.ok++; results.bytes += res.bytes || 0; }
      } else {
        results.fail++;
        results.failures.push({ upstream: d.upstream, diskPath: d.diskPath, error: res.error });
        console.error(`  ✗ ${d.upstream}  ${res.error}`);
      }
      if ((i + 1) % 25 === 0 || i + 1 === downloads.length) {
        console.log(
          `  [${i + 1}/${downloads.length}] nuevas: ${results.ok}, en caché: ${results.cached}, fallos: ${results.fail}`,
        );
      }
    }
  }

  console.log(`\nDescargando con concurrencia ${CONCURRENCY}…`);
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log('\n──── Resumen ────');
  console.log(`  Descargadas:  ${results.ok}`);
  console.log(`  En caché:     ${results.cached}`);
  console.log(`  Fallos:       ${results.fail}`);
  console.log(`  Huérfanos:    ${orphans.length}`);
  console.log(`  Bytes nuevos: ${(results.bytes / 1024 / 1024).toFixed(2)} MB`);

  // Reporte JSON
  const report = {
    timestamp: new Date().toISOString(),
    totalReferences: tasks.length,
    uniqueFiles: unique.length,
    downloaded: results.ok,
    cached: results.cached,
    failed: results.fail,
    orphans: orphans.length,
    bytes: results.bytes,
    failuresDetail: results.failures,
    orphansDetail: orphans.map((o) => ({
      filename: o.filename,
      expected: o.diskPath,
      cat: o.cat,
      slug: o.slug,
    })),
  };
  const reportPath = path.join(path.dirname(CONTENT_DIR.replace(/\/$/, '')), 'image-download-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n✓ Reporte: ${reportPath}`);

  if (results.fail > 0) {
    console.error(`\n⚠ ${results.fail} fallos. Revisa el reporte y reintenta:`);
    console.error(`   node scripts/download-miradas-images.mjs --xml ${XML_PATH} --concurrency 4`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
