/**
 * scripts/rewrite-miradas-cover.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * Reescribe el campo `image:` del frontmatter de cada .mdx para que apunte
 * a la PRIMERA imagen del cuerpo (ya en formato local `/miradas/<cat>/<slug>/…`).
 *
 * Pensado para ejecutarse DESPUÉS de `rewrite-miradas-images.mjs`, que ya
 * ha convertido las URLs de WordPress a paths locales.
 *
 * Heurística:
 *   1. En el cuerpo del .mdx busca el primer match (por orden de aparición)
 *      en cualquiera de estos patrones, restringido a paths locales:
 *        - <ImageWithCaption … src="/miradas/…">
 *        - <img … src="/miradas/…">
 *        - ![alt](/miradas/…)
 *   2. Si encuentra uno, reescribe la línea `image: …` del frontmatter con
 *      ese path. Soporta el formato single-line y el folded multilínea
 *      (`image: >-\n  /miradas/…/og.jpg`).
 *   3. Si no hay imagen en el cuerpo, deja el frontmatter intacto y reporta
 *      el archivo como "sin cover".
 *
 * Solo toca el campo `image:`. No modifica nada más.
 *
 * Uso:
 *   node scripts/rewrite-miradas-cover.mjs --content ./content/miradas --dry-run
 *   node scripts/rewrite-miradas-cover.mjs --content ./content/miradas
 *
 * Flags:
 *   --dry-run         No escribe; muestra resumen + muestra de cambios.
 *   --only-cat <c>    Filtra por categoría.
 *   --only-slug <s>   Filtra por slug.
 *   --fallback <p>    Path a usar como cover si el .mdx no tiene ninguna
 *                     imagen en el cuerpo (ej: /miradas/hero-banner.jpg).
 *                     Solo se aplica cuando el campo image actual termina
 *                     en /og.jpg (no sobrescribe covers ya válidos).
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const args = parseArgs(process.argv.slice(2));
const CONTENT_DIR = args.content || './content/miradas';
const DRY_RUN = !!args['dry-run'];
const ONLY_CAT = args['only-cat'] || null;
const ONLY_SLUG = args['only-slug'] || null;
const FALLBACK = args.fallback || null;

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

function splitFrontmatter(text) {
  if (!text.startsWith('---')) return { frontmatter: '', body: text, hasFrontmatter: false };
  const re = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/;
  const m = text.match(re);
  if (!m) return { frontmatter: '', body: text, hasFrontmatter: false };
  return { frontmatter: m[0], body: text.slice(m[0].length), hasFrontmatter: true };
}

// Patrones para localizar el primer src local del cuerpo. La captura debe ser
// el path `/miradas/...`. El orden aquí no importa: tomamos el match con
// menor índice global.
const BODY_SRC_PATTERNS = [
  /<ImageWithCaption[^>]*\ssrc="(\/miradas\/[^"]+)"/g,
  /<img[^>]*\ssrc="(\/miradas\/[^"]+)"/g,
  /!\[[^\]]*\]\((\/miradas\/[^)\s]+)/g,
];

function findFirstBodySrc(body) {
  let best = null; // {index, path}
  for (const re of BODY_SRC_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(body)) !== null) {
      if (best === null || m.index < best.index) {
        best = { index: m.index, path: m[1] };
      }
    }
  }
  return best ? best.path : null;
}

// Devuelve el valor actual del campo image (o null). Soporta single-line,
// quoted y folded multilínea.
function readFrontmatterImage(frontmatter) {
  const mlRe = /^image:[ \t]*[>|][-+]?[ \t]*\r?\n((?:[ \t]+\S.*\r?\n)+)/m;
  const ml = frontmatter.match(mlRe);
  if (ml) {
    return ml[1].split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join('');
  }
  const slRe = /^image:[ \t]+(.+)$/m;
  const sl = frontmatter.match(slRe);
  if (sl) {
    return sl[1].trim().replace(/^['"]|['"]$/g, '');
  }
  return null;
}

// Reescribe la línea/bloque `image:` del frontmatter por una line single
// `image: <newPath>`. Soporta:
//   - single-line:   `image: /miradas/...`
//   - quoted:        `image: '/miradas/...'`
//   - folded multi:  `image: >-\n  /miradas/...`
// Devuelve el nuevo frontmatter o null si no había campo image.
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

async function main() {
  console.log('▸ Configuración');
  console.log(`  content: ${CONTENT_DIR}`);
  console.log(`  dry-run: ${DRY_RUN}`);
  if (ONLY_CAT) console.log(`  only-cat: ${ONLY_CAT}`);
  if (ONLY_SLUG) console.log(`  only-slug: ${ONLY_SLUG}`);
  console.log('');

  const mdxFiles = await findMdxFiles(CONTENT_DIR);
  console.log(`✓ ${mdxFiles.length} archivos .mdx`);

  let updated = 0;
  let fallbackApplied = 0;
  let withoutBodyImage = 0;
  let withoutFrontmatterField = 0;
  const samples = [];
  const noCoverList = [];

  for (const mdx of mdxFiles) {
    const rel = path.relative(CONTENT_DIR, mdx);
    const parts = rel.split(path.sep);
    const cat = parts[0];
    const slug = path.basename(mdx, '.mdx');
    if (ONLY_CAT && cat !== ONLY_CAT) continue;
    if (ONLY_SLUG && slug !== ONLY_SLUG) continue;

    const original = await fs.readFile(mdx, 'utf-8');
    const { frontmatter, body, hasFrontmatter } = splitFrontmatter(original);
    if (!hasFrontmatter) continue;

    const firstSrc = findFirstBodySrc(body);
    let chosen = firstSrc;
    let viaFallback = false;
    if (!chosen) {
      withoutBodyImage++;
      if (FALLBACK) {
        const current = readFrontmatterImage(frontmatter);
        if (current && current.endsWith('/og.jpg')) {
          chosen = FALLBACK;
          viaFallback = true;
        } else {
          noCoverList.push(rel);
          continue;
        }
      } else {
        noCoverList.push(rel);
        continue;
      }
    }

    const newFrontmatter = rewriteFrontmatterImage(frontmatter, chosen);
    if (newFrontmatter === null) {
      withoutFrontmatterField++;
      continue;
    }
    if (newFrontmatter === frontmatter) continue;

    if (viaFallback) fallbackApplied++;
    else updated++;
    if (samples.length < 5) {
      samples.push({ file: rel, after: chosen, viaFallback });
    }

    if (!DRY_RUN) {
      await fs.writeFile(mdx, newFrontmatter + body, 'utf-8');
    }
  }

  console.log('');
  console.log('──── Resumen ────');
  console.log(`  Cover actualizado:        ${updated}`);
  if (FALLBACK) console.log(`  Cover con fallback:       ${fallbackApplied}`);
  console.log(`  Sin imagen en el cuerpo:  ${withoutBodyImage}`);
  console.log(`  Sin campo image en FM:    ${withoutFrontmatterField}`);

  if (samples.length) {
    console.log('\nMuestra de covers asignados:');
    for (const s of samples) {
      console.log(`  ${s.file}`);
      console.log(`    image: ${s.after}${s.viaFallback ? '  (fallback)' : ''}`);
    }
  }

  if (noCoverList.length) {
    console.log(`\nArchivos sin imagen en el cuerpo (cover sin tocar):`);
    for (const f of noCoverList) console.log(`  - ${f}`);
  }

  if (DRY_RUN) console.log('\n(DRY RUN) No se ha escrito nada.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
