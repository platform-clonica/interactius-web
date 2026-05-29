/**
 * scripts/translate-miradas.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * Genera traducciones IA (CA / EN) de los artículos Miradas usando Claude.
 * Cada traducción se guarda como `{slug}.{locale}.mdx` junto al original.
 *
 * El loader (`lib/content/miradas.ts`) detecta automáticamente esos archivos
 * y la página del artículo emite canonical/hreflang/index correctos. Si no
 * existe traducción para una locale, la URL CA/EN sigue resolviendo pero
 * con `noindex` + canonical a la versión ES (ver Fase 1).
 *
 * Uso:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/translate-miradas.mjs
 *   npm run translate -- --limit=10 --locale=ca
 *   npm run translate -- --slug=biomimesis-y-diseno --force
 *   npm run translate -- --dry-run
 *
 * Opciones:
 *   --locale=<ca|en|all>   Locales a traducir (default: all)
 *   --limit=<N>            Cuántos artículos (default: 30, por publishedAt DESC)
 *   --slug=<slug>          Solo un artículo concreto (ignora --limit)
 *   --dry-run              Lista qué traduciría sin llamar API
 *   --force                Re-traduce aunque ya exista la versión locale
 *   --model=<id>           Override modelo (default: claude-sonnet-4-6)
 */

import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import Anthropic from '@anthropic-ai/sdk'

const ROOT = process.cwd()
const CONTENT_ROOT = path.join(ROOT, 'content', 'miradas')
const SOURCE_LOCALE = 'es'
const TARGET_LOCALES = ['ca', 'en']
const DEFAULT_LIMIT = 30
const DEFAULT_MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 16_000

// ─── CLI args ──────────────────────────────────────────────────────────

function parseArgs() {
  const args = {
    locale: 'all',
    limit: DEFAULT_LIMIT,
    slug: null,
    dryRun: false,
    force: false,
    model: DEFAULT_MODEL,
  }
  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--force') args.force = true
    else if (arg.startsWith('--locale=')) args.locale = arg.slice('--locale='.length)
    else if (arg.startsWith('--limit=')) args.limit = parseInt(arg.slice('--limit='.length), 10)
    else if (arg.startsWith('--slug=')) args.slug = arg.slice('--slug='.length)
    else if (arg.startsWith('--model=')) args.model = arg.slice('--model='.length)
    else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: node scripts/translate-miradas.mjs [--locale=ca|en|all] [--limit=N] [--slug=X] [--dry-run] [--force] [--model=ID]',
      )
      process.exit(0)
    } else {
      console.error(`Unknown arg: ${arg}`)
      process.exit(1)
    }
  }
  if (args.locale !== 'all' && !TARGET_LOCALES.includes(args.locale)) {
    console.error(`Invalid --locale=${args.locale}. Must be ca, en, or all.`)
    process.exit(1)
  }
  return args
}

const args = parseArgs()
const localesToProcess = args.locale === 'all' ? TARGET_LOCALES : [args.locale]

// ─── Anthropic client ─────────────────────────────────────────────────

let client = null
if (!args.dryRun) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY env var is required (or use --dry-run).')
    process.exit(1)
  }
  client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// ─── Discover articles ────────────────────────────────────────────────

/**
 * Lee los MDX fuente desde `content/miradas/es/{cat}/{slug}.mdx`. Las
 * traducciones viven bajo `content/miradas/{ca,en}/{cat}/{slug}.mdx` y NO
 * se descubren aquí.
 */
async function readSourceArticles() {
  const articles = []
  const sourceRoot = path.join(CONTENT_ROOT, SOURCE_LOCALE)
  const cats = await fs.readdir(sourceRoot)
  for (const cat of cats) {
    const catDir = path.join(sourceRoot, cat)
    const stat = await fs.stat(catDir)
    if (!stat.isDirectory()) continue
    const files = await fs.readdir(catDir)
    for (const file of files) {
      if (!file.endsWith('.mdx')) continue
      const slug = file.replace(/\.mdx$/, '')
      const raw = await fs.readFile(path.join(catDir, file), 'utf-8')
      const { data: frontmatter, content } = matter(raw)
      articles.push({ cat, slug, frontmatter, content, filePath: path.join(catDir, file) })
    }
  }
  return articles.sort((a, b) => {
    const da = new Date(a.frontmatter.publishedAt).getTime()
    const db = new Date(b.frontmatter.publishedAt).getTime()
    return db - da // DESC
  })
}

// ─── Translation prompt ───────────────────────────────────────────────

const LOCALE_LABEL = {
  ca: 'Catalan (Català), as written in Catalonia, Spain. Formal but accessible register.',
  en: 'English (en-GB). Formal but accessible register.',
}

const TRANSLATION_TOOL = {
  name: 'submit_translation',
  description: 'Submit the translated article. All fields are required.',
  input_schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Translated title. Match the source length and tone.',
      },
      description: {
        type: 'string',
        description: 'Translated description (1-2 sentences). Match source length.',
      },
      content: {
        type: 'string',
        description:
          'Translated MDX body. PRESERVE all markdown/MDX syntax EXACTLY: headings, lists, code blocks, links, images, blockquotes, emphasis, JSX components, frontmatter is NOT included here.',
      },
      slug: {
        type: 'string',
        description:
          'URL slug derived from the translated title. Rules: lowercase only, ASCII (strip accents/diacritics), words separated by single hyphens, no punctuation, no stopwords trimming UNLESS needed to stay under 80 chars, target 40-80 chars. Examples: title="El Disseny UX i de producte ha entrat en una nova era: conversa amb Antonio Díaz Cueto" → "el-disseny-ux-i-de-producte-ha-entrat-en-una-nova-era-conversa-antonio-diaz-cueto". Must match regex /^[a-z0-9-]+$/.',
      },
    },
    required: ['title', 'description', 'content', 'slug'],
  },
}

function buildSystem(targetLocale) {
  return `You are translating a professional UX/design article from Spanish to ${LOCALE_LABEL[targetLocale]}.

CRITICAL RULES:
1. Preserve ALL markdown/MDX syntax EXACTLY: headings (#, ##), lists (- *), code blocks (\`\`\`), inline code (\`), links ([text](url)), images (![alt](src)), blockquotes (>), emphasis (* _), JSX components (<Component />).
2. Do NOT translate URLs, filenames, code identifiers, technical terms inside backticks, or text inside \`\`\` blocks.
3. Brand and product names ("Interactius", "Anthropic", "Figma", "Sketch", "Adobe", "BBVA", "Nespresso", company/client names, etc.) stay in the original form.
4. Common UX/design English-loan terms (UX, UI, design system, wireframe, mockup, user research, design thinking, product manager, etc.) typically stay in English in both Catalan and Spanish technical writing — use the form most natural for the target language.
5. Maintain a professional, expert tone aimed at design/UX practitioners. The author of the original article is a domain expert.
6. Do NOT add disclaimers, prefaces, translator's notes, or comments about the translation itself.
7. Translate the title naturally — it can deviate from a literal translation if a more idiomatic version is clearly better in the target language.
8. Generate a URL slug from your translated title following the rules in the slug field description (lowercase ASCII, hyphens, 40-80 chars target). Personal/brand names stay readable (drop diacritics: "Díaz" → "diaz", "Müller" → "muller").
9. Output ONLY via the submit_translation tool. Do not return any prose.`
}

// ─── Translate one article ────────────────────────────────────────────

async function translateArticle({ frontmatter, content, slug: slugEs }, targetLocale) {
  if (args.dryRun) {
    return {
      title: `[DRY-RUN ${targetLocale}] ${frontmatter.title}`,
      description: frontmatter.description,
      content,
      slug: slugEs,
    }
  }

  const response = await client.messages.create({
    model: args.model,
    max_tokens: MAX_TOKENS,
    system: buildSystem(targetLocale),
    tools: [TRANSLATION_TOOL],
    tool_choice: { type: 'tool', name: 'submit_translation' },
    messages: [
      {
        role: 'user',
        content: `Translate this article to ${targetLocale}.\n\nSource slug (for reference, derive the localized slug from your translated title): ${slugEs}\n\nTitle: ${frontmatter.title}\n\nDescription: ${frontmatter.description}\n\nMDX body:\n\n${content}`,
      },
    ],
  })

  const toolUse = response.content.find((c) => c.type === 'tool_use')
  if (!toolUse) {
    throw new Error(
      `Model did not call submit_translation. Stop reason: ${response.stop_reason}`,
    )
  }
  const {
    title,
    description,
    content: translatedContent,
    slug: translatedSlug,
  } = toolUse.input
  if (!title || !description || !translatedContent || !translatedSlug) {
    throw new Error('Tool input missing required fields.')
  }
  if (!/^[a-z0-9-]+$/.test(translatedSlug)) {
    throw new Error(
      `Translated slug "${translatedSlug}" does not match /^[a-z0-9-]+$/.`,
    )
  }
  return { title, description, content: translatedContent, slug: translatedSlug }
}

// ─── Write translated MDX ─────────────────────────────────────────────

function todayIso() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

async function writeTranslation({ cat, slug, frontmatter }, locale, translated) {
  // El archivo MDX traducido vive en `content/miradas/{locale}/{cat}/{slug}.mdx`.
  // El nombre del archivo es el slug-ES canónico (invariante a través de
  // locales — facilita mapping y validación). El slug-locale para la URL
  // pública va en `localizedSlug` del frontmatter.
  const outDir = path.join(CONTENT_ROOT, locale, cat)
  await fs.mkdir(outDir, { recursive: true })
  const outPath = path.join(outDir, `${slug}.mdx`)
  const newFrontmatter = {
    ...frontmatter,
    title: translated.title,
    description: translated.description,
    translatedBy: 'ai',
    translatedAt: todayIso(),
    localizedSlug: translated.slug,
  }
  const md = matter.stringify(translated.content, newFrontmatter)
  await fs.writeFile(outPath, md, 'utf-8')
  return outPath
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  const all = await readSourceArticles()
  const candidates = args.slug
    ? all.filter((a) => a.slug === args.slug)
    : all.slice(0, args.limit)

  if (candidates.length === 0) {
    console.error(
      args.slug
        ? `No article found with slug "${args.slug}".`
        : 'No source articles found.',
    )
    process.exit(1)
  }

  console.log(
    `Translation plan: ${candidates.length} article(s) × ${localesToProcess.length} locale(s) = ${
      candidates.length * localesToProcess.length
    } translation(s)`,
  )
  console.log(`Model: ${args.model}`)
  console.log(`Dry run: ${args.dryRun}`)
  console.log(`Force: ${args.force}`)
  console.log('')

  const results = { ok: 0, skipped: 0, errors: 0 }

  for (const article of candidates) {
    for (const locale of localesToProcess) {
      const outPath = path.join(
        CONTENT_ROOT,
        locale,
        article.cat,
        `${article.slug}.mdx`,
      )
      const exists = existsSync(outPath)
      if (exists && !args.force) {
        console.log(`SKIP  [${locale}] ${article.cat}/${article.slug} (already translated)`)
        results.skipped++
        continue
      }
      try {
        console.log(`...   [${locale}] ${article.cat}/${article.slug}`)
        const translated = await translateArticle(article, locale)
        if (!args.dryRun) {
          await writeTranslation(article, locale, translated)
        }
        console.log(
          `OK    [${locale}] ${article.cat}/${article.slug} → ${path.relative(ROOT, outPath)}`,
        )
        results.ok++
      } catch (err) {
        console.error(`FAIL  [${locale}] ${article.cat}/${article.slug}: ${err.message}`)
        results.errors++
      }
    }
  }

  console.log('')
  console.log(`Done: ${results.ok} ok, ${results.skipped} skipped, ${results.errors} errors`)
  process.exit(results.errors > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
