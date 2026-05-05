/**
 * scripts/taxonomize-miradas.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * Algoritmo de taxonomización para la migración Miradas v1 → v2.
 *
 * Asigna cada uno de los .mdx en `content/miradas/<old-cat>/<slug>.mdx` a una
 * de las 11 subcategorías nuevas según un sistema de scoring por keywords
 * sobre title / description / tags / body (primeros 2500 chars).
 *
 * Reglas:
 *   - Pesos por campo y tier (strong/medium/weak): ver WEIGHTS.
 *   - Bonus +1.5 si la `old_cat` actual del artículo está en la lista
 *     `old_cats` de la sub.
 *   - Top1 gana. Si `top1.score - top2.score < 1.5` → requires_review.
 *   - Si `top1.score === 0` → fallback por old_cat (primera sub que la incluya).
 *
 * Output:
 *   - scripts/taxonomy_v1.json    Asignaciones completas para procesos posteriores.
 *   - scripts/taxonomy_review.md  Reporte humano para revisión.
 *
 * Uso: `node scripts/taxonomize-miradas.mjs`
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'content', 'miradas');
const OUT_JSON = path.join(ROOT, 'scripts', 'taxonomy_v1.json');
const OUT_MD = path.join(ROOT, 'scripts', 'taxonomy_review.md');

// ─── Taxonomía ────────────────────────────────────────────────────────
const TAXONOMY = {
  'pensamiento-estrategico': { name: 'Pensamiento Estratégico', subs: {
    'diseno-estrategico': 'Diseño estratégico',
    'innovacion':         'Innovación',
    'futuros':            'Futuros',
    'marca':              'Marca',
  }},
  'diseno-experiencias': { name: 'Diseño de Experiencias', subs: {
    'diseno-ux-ui':   'Diseño UX/UI',
    'ux-research':    'UX Research',
    'clonica':        'Clónica',
  }},
  'transformacion-cultural': { name: 'Transformación Cultural', subs: {
    'ia-aplicada':              'Inteligencia Artificial aplicada',
    'cultura-organizacional':   'Cultura organizacional',
    'workshops':                'Workshops',
  }},
};

const RULES = {
  'diseno-estrategico': {
    strong: ['diseño estratégico', 'design strategy', 'estrategia de diseño', 'strategic design', 'service design strategy'],
    medium: ['estratégico', 'strategy', 'pensamiento estratégico'],
    weak:   ['decisiones', 'criterio'],
    old_cats: ['estrategia'],
  },
  'innovacion': {
    strong: ['innovación', 'innovation', 'innolab', 'product discovery', 'discovery research'],
    medium: ['discovery', 'behavior segments', 'opportunity', 'opportunities'],
    weak:   ['oportunidades', 'creatividad', 'tendencias', 'innovate'],
    old_cats: ['estrategia'],
  },
  'futuros': {
    strong: ['prospectiva', 'foresight', 'futuros', 'speculative design', 'sostenibilidad', 'sustainability', 'green ux', 'diseño circular', 'circular design'],
    medium: ['anticipar', 'escenarios', 'incertidumbre', 'futurología', 'futurology', 'verde', 'green', 'sostenible'],
    weak:   ['cambio', 'futuro'],
    old_cats: [],
  },
  'marca': {
    strong: ['branding', 'naming', 'identidad de marca', 'brand strategy', 'rebrand', 'ux branding'],
    medium: ['logo', 'identidad', 'marca'],
    weak:   ['posicionamiento', 'storytelling'],
    old_cats: [],
  },
  'diseno-ux-ui': {
    // Eliminadas 'design'/'diseño'/'ux' como medium/weak: arrastraban casi todo a esta sub.
    // Solo keywords específicas de UI / producto / sistemas de diseño.
    strong: ['ux/ui', 'ui design', 'product design', 'producto digital', 'product designer', 'diseño de productos digitales', 'sistemas de diseño', 'design system', 'design systems', 'atomic design'],
    medium: ['interfaz', 'figma', 'aida model', 'wcag', 'accesibilidad', 'inclusivo', 'mockup', 'sketch', 'wireframe', 'wireframes', 'prototipado', 'componentes', 'design ops', 'designops', 'microinteracciones', 'microinteraction', 'dark patterns', 'motion design', 'product designer'],
    weak:   ['prototipo'],
    old_cats: ['design', 'diseno-inclusivo'],
  },
  'ux-research': {
    strong: ['ux research', 'ux researcher', 'user research', 'investigación con usuarios', 'walkthrough', 'evaluación heurística', 'heuristic evaluation'],
    medium: ['usability', 'usabilidad', 'card sorting', 'entrevistas', 'journey map', 'heurística', 'discovery research', 'arquetipos', 'user personas', 'user persona', 'personas'],
    weak:   ['insights', 'observación', 'método', 'metodología'],
    old_cats: ['research'],
  },
  'clonica': {
    strong: ['clónica', 'clonica', 'usuarios sintéticos', 'usuario sintético', 'synthetic users', 'synthetic user', 'sintéticos', 'sintético'],
    medium: ['ia + research', 'ai users'],
    weak:   [],
    old_cats: [],
  },
  'ia-aplicada': {
    strong: ['inteligencia artificial', 'artificial intelligence', ' ia ', 'ia aplicada', ' ai ', 'gpt', 'midjourney', 'anthropic', 'claude', 'llm', 'vibe coding'],
    medium: ['machine learning', 'generative', 'generativa'],
    weak:   ['automatización', 'modelo'],
    old_cats: ['ia'],
  },
  'cultura-organizacional': {
    strong: ['cultura organizacional', 'cambio cultural', 'transformación cultural', 'gestión del cambio', 'change management', 'mujeres en ux', 'diversidad', 'meetup', 'eventos ux', 'salud mental', 'liderar un equipo'],
    medium: ['cultura', 'organización', 'equipo', 'liderazgo', 'comunidad', 'team', 'mujeres', 'inclusión'],
    weak:   ['cambio'],
    old_cats: [],
  },
  'workshops': {
    // 'lego' como strong por seguridad (haystack se normaliza, así "LEGO® Serious Play" → "lego serious play")
    strong: ['workshop', 'bootcamp', 'taller', 'lego serious play', ' lego ', 'design thinking con'],
    medium: ['formación', 'training', 'learning by doing', 'design thinking', 'facilitación'],
    weak:   ['curso', 'sesión'],
    old_cats: ['workshops'],
  },
};

// Sub → parent (derivado de TAXONOMY)
const SUB_TO_PARENT = {};
for (const [parentSlug, parent] of Object.entries(TAXONOMY)) {
  for (const subSlug of Object.keys(parent.subs)) {
    SUB_TO_PARENT[subSlug] = parentSlug;
  }
}

const WEIGHTS = {
  title:       { strong: 5,   medium: 2,   weak: 1   },
  description: { strong: 2,   medium: 1,   weak: 0.5 },
  tags:        { strong: 3,   medium: 2,   weak: 1   },
  body:        { strong: 0.5, medium: 0.3, weak: 0.2 },
};

const REVIEW_THRESHOLD = 1.5;
const BODY_HEAD_LEN = 2500;
const OLD_CAT_BONUS = 1.5;

// ─── Frontmatter parsing (regex, sin deps externas) ────────────────────
function splitFrontmatter(text) {
  const m = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!m) return null;
  return { fm: m[1], body: text.slice(m[0].length) };
}

function getScalar(fm, key) {
  const re = new RegExp('^' + key + ':[ \\t]+(.+)$', 'm');
  const m = fm.match(re);
  if (!m) return null;
  let val = m[1].trim();
  if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
    val = val.slice(1, -1);
  }
  return val;
}

function getMaybeFolded(fm, key) {
  // YAML folded multilínea: `key: >-\n  línea1\n  línea2`
  const foldedRe = new RegExp(
    '^' + key + ':[ \\t]*[>|][-+]?[ \\t]*\\r?\\n((?:[ \\t]+\\S.*(?:\\r?\\n|$))+)',
    'm',
  );
  const fold = fm.match(foldedRe);
  if (fold) {
    return fold[1].split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join(' ');
  }
  return getScalar(fm, key);
}

function getList(fm, key) {
  // Inline: `key: [a, b]`
  const inlineRe = new RegExp('^' + key + ':[ \\t]+\\[(.*)\\]\\s*$', 'm');
  const inline = fm.match(inlineRe);
  if (inline) {
    return inline[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  }
  // Block list:
  //   key:
  //     - a
  //     - b
  const lines = fm.split(/\r?\n/);
  const idx = lines.findIndex((l) => new RegExp('^' + key + ':\\s*$').test(l));
  if (idx === -1) return [];
  const items = [];
  for (let i = idx + 1; i < lines.length; i++) {
    const l = lines[i];
    const m = l.match(/^[ \t]+-\s*(.*)$/);
    if (m) items.push(m[1].trim().replace(/^['"]|['"]$/g, ''));
    else if (/^\S/.test(l)) break;
  }
  return items;
}

// ─── Scoring ──────────────────────────────────────────────────────────
// Normaliza el texto para matching: lowercase + reemplaza caracteres no
// alfanuméricos (incluyendo ®, /, comillas, signos) por espacio y colapsa
// espacios múltiples. NO trimmea: preserva espacios bordeantes para que
// keywords como ' ia ' o ' ai ' (con padding intencional) sigan funcionando
// como word-boundaries.
function normalizeForMatch(s) {
  return s
    .toLowerCase()
    .replace(/[^a-záéíóúñüàèìòùç0-9 ]/g, ' ')
    .replace(/  +/g, ' ');
}

function hasKeyword(haystack, keyword) {
  const hay = ' ' + normalizeForMatch(haystack).trim() + ' ';
  const kw = normalizeForMatch(keyword);
  return hay.includes(kw);
}

function scoreSub(subSlug, article) {
  const rule = RULES[subSlug];
  if (!rule) return 0;

  let score = 0;
  for (const field of ['title', 'description', 'tags', 'body']) {
    const haystack = field === 'tags' ? (article.tags || []).join(' ') : (article[field] || '');
    if (!haystack) continue;
    for (const tier of ['strong', 'medium', 'weak']) {
      const keywords = rule[tier] || [];
      const w = WEIGHTS[field][tier];
      for (const kw of keywords) {
        if (hasKeyword(haystack, kw)) score += w;
      }
    }
  }

  if ((rule.old_cats || []).includes(article.old_cat)) {
    score += OLD_CAT_BONUS;
  }

  return Math.round(score * 100) / 100;
}

// ─── Walk articles ─────────────────────────────────────────────────────
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

async function loadArticle(mdxPath) {
  const text = await fs.readFile(mdxPath, 'utf-8');
  const split = splitFrontmatter(text);
  if (!split) return null;
  const { fm, body } = split;
  const rel = path.relative(CONTENT_DIR, mdxPath);
  const parts = rel.split(path.sep);
  const old_cat = parts[0];
  const slug = path.basename(mdxPath, '.mdx');

  return {
    file: rel,
    old_cat,
    slug,
    title: getScalar(fm, 'title') || '',
    description: getMaybeFolded(fm, 'description') || '',
    tags: getList(fm, 'tags'),
    category: getScalar(fm, 'category') || old_cat,
    body: body.slice(0, BODY_HEAD_LEN),
  };
}

// ─── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log('▸ Cargando .mdx desde', CONTENT_DIR);
  const files = await findMdxFiles(CONTENT_DIR);
  console.log(`✓ ${files.length} archivos encontrados`);

  const articles = [];
  for (const f of files) {
    const a = await loadArticle(f);
    if (a) articles.push(a);
  }
  console.log(`✓ ${articles.length} artículos parseados`);

  // Score
  const results = articles.map((a) => {
    const scores = {};
    for (const subSlug of Object.keys(SUB_TO_PARENT)) {
      scores[subSlug] = scoreSub(subSlug, a);
    }
    const ranked = Object.entries(scores).sort((x, y) => y[1] - x[1]);
    const [top1Sub, top1Score] = ranked[0];
    const [top2Sub, top2Score] = ranked[1] || [null, 0];
    const [top3Sub, top3Score] = ranked[2] || [null, 0];

    let assignedSub;
    let usedFallback = false;
    let requires_review = false;

    if (top1Score === 0) {
      const candidates = Object.entries(RULES)
        .filter(([_, rule]) => (rule.old_cats || []).includes(a.old_cat))
        .map(([sub]) => sub);
      assignedSub = candidates[0] || top1Sub;
      usedFallback = true;
      requires_review = true;
    } else {
      assignedSub = top1Sub;
      if (top1Score - top2Score < REVIEW_THRESHOLD) {
        requires_review = true;
      }
    }

    return {
      ...a,
      assigned_sub: assignedSub,
      assigned_parent: SUB_TO_PARENT[assignedSub],
      top1: { sub: top1Sub, score: top1Score },
      top2: { sub: top2Sub, score: top2Score },
      top3: { sub: top3Sub, score: top3Score },
      delta: Math.round((top1Score - top2Score) * 100) / 100,
      requires_review,
      used_fallback: usedFallback,
      scores,
    };
  });

  // Distribución
  const distBySub = {};
  const distByParent = {};
  for (const sub of Object.keys(SUB_TO_PARENT)) distBySub[sub] = 0;
  for (const parent of Object.keys(TAXONOMY)) distByParent[parent] = 0;
  for (const r of results) {
    distBySub[r.assigned_sub]++;
    distByParent[r.assigned_parent]++;
  }

  const requiresReview = results.filter((r) => r.requires_review);
  const fallbacks = results.filter((r) => r.used_fallback);
  const divergent = results.filter((r) => {
    const ruleOldCats = RULES[r.assigned_sub]?.old_cats || [];
    return !ruleOldCats.includes(r.old_cat);
  });

  // JSON output
  const out = {
    generated_at: new Date().toISOString(),
    total: results.length,
    distribution_by_sub: distBySub,
    distribution_by_parent: distByParent,
    requires_review_count: requiresReview.length,
    used_fallback_count: fallbacks.length,
    divergent_count: divergent.length,
    assignments: results.map((r) => ({
      file: r.file,
      slug: r.slug,
      old_cat: r.old_cat,
      old_category_field: r.category,
      assigned_sub: r.assigned_sub,
      assigned_parent: r.assigned_parent,
      top1: r.top1,
      top2: r.top2,
      top3: r.top3,
      delta: r.delta,
      requires_review: r.requires_review,
      used_fallback: r.used_fallback,
    })),
  };
  await fs.writeFile(OUT_JSON, JSON.stringify(out, null, 2), 'utf-8');
  console.log(`✓ Wrote ${OUT_JSON}`);

  // Markdown output
  const md = renderMarkdown(out, results, requiresReview, divergent, fallbacks);
  await fs.writeFile(OUT_MD, md, 'utf-8');
  console.log(`✓ Wrote ${OUT_MD}`);

  // Console summary
  console.log('\n──── Resumen distribución ────');
  for (const sub of Object.keys(SUB_TO_PARENT)) {
    const parent = SUB_TO_PARENT[sub];
    console.log(`  ${sub.padEnd(28)} (${parent.padEnd(26)})  ${distBySub[sub]}`);
  }
  console.log('');
  console.log(`  Requieren revisión:    ${requiresReview.length}`);
  console.log(`  Fallbacks por old_cat: ${fallbacks.length}`);
  console.log(`  Divergentes:           ${divergent.length}`);
}

function renderMarkdown(summary, results, requiresReview, divergent, fallbacks) {
  const lines = [];
  lines.push('# Taxonomy v1 — review report');
  lines.push('');
  lines.push(`**Generado**: ${summary.generated_at}`);
  lines.push(`**Total artículos**: ${summary.total}`);
  lines.push(`**Requieren revisión** (delta top1−top2 < ${REVIEW_THRESHOLD}): ${summary.requires_review_count}`);
  lines.push(`**Fallbacks por old_cat** (top1 = 0): ${summary.used_fallback_count}`);
  lines.push(`**Divergentes** (sub asignada no incluye old_cat): ${summary.divergent_count}`);
  lines.push('');

  lines.push('## Distribución por subcategoría');
  lines.push('');
  lines.push('| Sub | Madre | Count |');
  lines.push('|---|---|---|');
  const subsOrdered = Object.keys(SUB_TO_PARENT).sort((a, b) => {
    const pa = SUB_TO_PARENT[a];
    const pb = SUB_TO_PARENT[b];
    if (pa !== pb) return pa.localeCompare(pb);
    return summary.distribution_by_sub[b] - summary.distribution_by_sub[a];
  });
  for (const sub of subsOrdered) {
    lines.push(`| \`${sub}\` | \`${SUB_TO_PARENT[sub]}\` | ${summary.distribution_by_sub[sub]} |`);
  }
  lines.push('');

  lines.push('## Distribución por categoría madre');
  lines.push('');
  lines.push('| Madre | Count |');
  lines.push('|---|---|');
  for (const p of Object.keys(TAXONOMY)) {
    lines.push(`| \`${p}\` | ${summary.distribution_by_parent[p]} |`);
  }
  lines.push('');

  lines.push(`## Artículos que requieren revisión humana (${requiresReview.length})`);
  lines.push('');
  lines.push(`Diferencia top1 − top2 < ${REVIEW_THRESHOLD}, o fallback aplicado por falta de keywords. Revisar y confirmar/cambiar.`);
  lines.push('');
  for (const r of requiresReview) {
    lines.push(`### \`${r.file}\``);
    lines.push(`- **title**: ${r.title}`);
    lines.push(`- **old_cat**: \`${r.old_cat}\``);
    lines.push(`- **asignada**: \`${r.assigned_sub}\` (${SUB_TO_PARENT[r.assigned_sub]})${r.used_fallback ? ' _← fallback_' : ''}`);
    lines.push(`- **top1**: \`${r.top1.sub}\` — ${r.top1.score}`);
    lines.push(`- **top2**: \`${r.top2.sub}\` — ${r.top2.score} _(delta ${r.delta.toFixed(2)})_`);
    if (r.top3.sub) lines.push(`- **top3**: \`${r.top3.sub}\` — ${r.top3.score}`);
    lines.push('');
  }

  if (fallbacks.length > 0) {
    lines.push(`## Fallbacks por old_cat (top1 score = 0) — ${fallbacks.length}`);
    lines.push('');
    lines.push('Sin keywords detectadas; asignados por la lista `old_cats` de las reglas.');
    lines.push('');
    lines.push('| Slug | Old cat | Sub asignada |');
    lines.push('|---|---|---|');
    for (const r of fallbacks) {
      lines.push(`| \`${r.slug}\` | \`${r.old_cat}\` | \`${r.assigned_sub}\` |`);
    }
    lines.push('');
  }

  if (divergent.length > 0) {
    lines.push(`## Asignaciones divergentes del natural mapping (${divergent.length})`);
    lines.push('');
    lines.push('La sub asignada **no incluye** la `old_cat` en sus `old_cats`. Las keywords arrastraron el artículo a otra temática. Revisar si tiene sentido.');
    lines.push('');
    lines.push('| Slug | Old cat | Sub asignada | Score |');
    lines.push('|---|---|---|---|');
    for (const r of divergent) {
      lines.push(`| \`${r.slug}\` | \`${r.old_cat}\` | \`${r.assigned_sub}\` | ${r.top1.score.toFixed(1)} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
