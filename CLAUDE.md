# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev         # Next dev server. Uses 3000 or 3001 if taken.
npm run build       # Production build
npm run start       # Serve production build
npm run lint        # next lint (ESLint)
npm run type-check  # tsc --noEmit
```

No test runner is configured. Verify changes with `npm run type-check && npm run lint` and visually in the browser.

## Stack

Next.js 15 App Router · React 19 · TypeScript 5.7 · Tailwind 3.4 · next-intl 3 · GSAP 3.12 + SplitType 0.3 · Framer Motion 11 · Zustand 5 · react-hook-form + zod · MDX (via `@mdx-js/mdx` evaluate).

## Architecture

### Route groups
`app/[locale]/(main)/` contains the full chrome (Sidebar, Header, MenuOverlay, Footer, PageTransition). `app/[locale]/(contact)/` is a minimal layout without chrome — used for fullscreen overlays (the `/contacto` route). Any new page belongs in `(main)` unless it needs to be chromeless.

### i18n
- ES is default **without URL prefix** (`/contacto`), CA and EN use prefixes (`/ca/contacte`, `/en/contact`). Driven by `localePrefix: 'as-needed'` in `lib/i18n/routing.ts`.
- Slugs per locale are defined by `RouteId` → per-locale pathname. **Never hardcode a localized slug** — always link via `Link` from `@/lib/i18n/routing` with a `RouteId`.
- Miradas slugs split in two layers: the **category segment** (`[parentOrSub]`) is localized per locale — see `lib/miradas/i18n-routing.ts` (`pensamiento-estrategico` / `pensament-estrategic` / `strategic-thinking`). The **article slug** is invariant in ES across all locales, which is what preserves the 244 prepared 301 redirects from the WordPress migration.
- UI strings live in `messages/{locale}/{namespace}.json`. Load with `useTranslations(namespace)` (client) or `getTranslations` (server).
- `LocaleSwitcher` in dynamic routes must receive `{ pathname, params }` — not a concrete path. See `components/layout/LocaleSwitcher.tsx`.

### Content (Miradas)
Articles are MDX files under `content/miradas/{category}/{slug}.mdx`. `lib/content/miradas.ts` reads them with `fs` + `gray-matter`. `components/miradas/MDXContent.tsx` is a **server component** that compiles MDX at request time with `@mdx-js/mdx` evaluate. Images in MDX are not currently mapped to `next/image` — plain `<img>` until someone wires that up.

### Global state
Only `lib/store/menu.ts` (Zustand). It owns the menu overlay open state AND the body scroll-lock. Any place that toggles the menu must go through this store.

### Grid & layout tokens (`app/globals.css`)
CSS variables drive layout:
- `--grid-margin`: `clamp(20px, 12vw - 45px, 128px)` — page-edge padding inside `section-inner`.
- `--grid-gutter`: `clamp(16px, 2.2vw, 32px)` — column gap for the 12-col grid.
- `--grid-max-w: 1440px` — max content width.
- `--sidebar-w: 128px` (≥901px, else 0px) — width of the fixed left chrome column.

Two utilities:
- `.section-inner` — page width container with `grid-margin` padding.
- `.grid-12` — 12-col grid (also available via Tailwind `grid grid-cols-12 gap-grid-gutter`).

### Chrome layout — edge-to-edge + mix-blend-mode
Sections and images occupy the full viewport width starting from `left: 0`. The logo + hamburger live in a fixed `<aside>` (`components/layout/Sidebar.tsx`) with `mix-blend-mode: difference` applied to the aside element (not the children — `position: fixed` forms its own stacking context, so blend mode must be on the outer element to see page pixels behind it).

Render pipeline for both logo and hamburger is identical and MUST stay in sync:
1. Source content is dark (SVG fill `#1C1A17` for the logo; `bg-current` with `text-fg` for the hamburger bars).
2. Wrapping element applies `filter: brightness(0) invert(1)` → pixels become pure white.
3. Aside's `mix-blend-mode: difference` inverts white against whatever is behind → contrast-correct on any background.

Do not switch the hamburger to `bg-white` directly — that path has shown rendering discrepancies vs. the filter path. Keep both elements on the filter path.

The `<aside>` is `pointer-events-none`; individual clickable children re-enable `pointer-events-auto`. This lets the user click page content inside the 128px strip.

### Motion system
All scroll-driven motion uses GSAP + ScrollTrigger, with SplitType for line splitting. Shared helpers:
- `components/motion/useReducedMotion.ts` — `getReducedMotion()`. Every effect hook must early-return a static state when reduced.
- `components/motion/wrapLinesInMask.ts` — wraps each SplitType line in a `<span class="st-mask">` (`overflow: hidden`). This is the canonical "line reveals from behind a clip boundary" effect. Use it on headings; paragraphs typically stay with plain fade+Y.

Canonical patterns (see `/Users/anico/.claude/projects/-Users-anico/memory/` for full notes):

| Pattern | Rule |
|---|---|
| Lateral motion easing | Always `cubic-bezier(.16,1,.3,1)` (matches `--ease` and Tailwind `ease-expo`). Never `power3.*` or `power2.*` for X-axis. |
| Image reveal | Default entrance is `clip-path: inset(0 100% 0 0)` → `inset(0 0% 0 0)`, duration 0.6–0.9s, easing as above. Trigger typical: `start: 'top 85%'`, `once: true`. |
| Line-mask reveal | Headings only — body paragraphs keep fade+Y. Apply with `wrapLinesInMask(splitType.lines)` immediately after `new SplitType(...)`. |
| Bold-word effect | `<span data-word>` + animated `-webkit-text-stroke` 0→0.6px + simultaneous slashes (`/ word /`) fading in. Implementation canonical in `IdentidadIntro.tsx`. |

### Forms
`components/ui/ButtonPrimary.tsx` and `components/ui/FormField.tsx` are polymorphic (`as` prop). The `<Link>` used in chrome is `@/lib/i18n/routing`'s wrapped version, not the raw `next/link`.

API routes under `app/api/` (contact, newsletter, testers) POST to the **HubSpot Forms Submissions API** (`api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formId}`). Form IDs come from env vars (`HUBSPOT_FORM_ID_*`). No Authorization header — public forms don't require it. HubSpot returns 200 even when fields are rejected silently, so monitor via Marketing → Forms → Submissions in the HubSpot dashboard.

## Conventions

- Server components by default. Client components only when they need state, effects, or browser APIs (`useTranslations`, `useRef`, `gsap`, etc.). Components using GSAP + SplitType import them **dynamically** inside a `useEffect` to keep them out of the SSR bundle.
- Dark color is `text-fg` (`#1C1A17`), warm background is `bg-warm-light` (`#F5F2ED`), contrast dark bg is `bg-dark`. Never hardcode hex.
- For 12-col grid positioning, `col-start-2` is the canonical text-content start on the identidad page (established as the reference for the rest of the site). Images go edge-to-edge; text starts at col 2.

### Locale-aware utilities
- `lib/i18n/formatDate.ts` — formats dates per locale (`es-ES` / `ca-ES` / `en-GB`). Single source of truth for any date rendered in the UI.
- `components/layout/MenuOverlay.tsx` — active state with parent inheritance. `usePathname()` from next-intl + helper `isItemActive(itemRoute, pathname)`. Sub-routes highlight the root (e.g. `/miradas/<sub>/<slug>` highlights "Miradas"). Adds `aria-current="page"` to the active Link.

### Legacy redirects
- 244 redirects 301 from the WP migration live in `middleware.ts` (NOT in `next.config.mjs`). They're loaded from `config/miradas-redirects.mjs`. Why here: on Netlify, the next-intl rewrite runs before the plugin's `redirects()`, so they were broken in production. The middleware does O(1) Map lookup at the top, normalizing trailing slash and `decodeURIComponent` for non-ASCII (ñ, etc.) before matching.
- Wildcard fallback at the end of the middleware: any path starting with a legacy prefix (`/research/*`, `/design/*`, `/ux/*`, `/ia/*`, `/estrategia/*`, `/workshops/*`, `/diseno-inclusivo/*`, `/user-experience-en/*`) and missing exact match goes to the most likely sub-listing. Covers WP long-tail without per-slug maintenance.
- The PDF `/STMDL/Digital-transformation-tools.pdf` is redirected from `netlify.toml` (the middleware excludes paths with extensions via matcher).

### Consent + Analytics
- `lib/consent/*` + `lib/store/consent.ts` + `components/consent/*` — full AEPD-compliant cookie consent system (4 categories, bottom banner, granular panel, first-party cookie `interactius_consent_v1`).
- `components/analytics/GA4Script.tsx` — strict gating. `gtag.js` is NOT downloaded until the user accepts the `analytics` category. Revoking triggers a hard-reload (cleaning gtag globals) via the consent store's `commit()`.

## Deploy

Netlify (`netlify.toml`). Build config via `@netlify/plugin-nextjs`. `SITE_CONFIG.isProduction` in `lib/seo/metadata.config.ts` decides canonical host and whether robots is `noindex`.

Four deploy contexts in `netlify.toml`:
- `production` (branch `main`) → `https://www.interactius.com`
- `staging` (branch `staging`) → `https://staging.interactius.com` — pre-producción. `isProduction=false` por host, así que `noindex` y GA4 off automáticos. `HUBSPOT_FORM_ID_*` están a scope "Production" en Netlify UI → en staging quedan undefined → handlers de `app/api/*` entran en stub mode (logs, sin POST a HubSpot).
- `deploy-preview` (PRs) → URL efímera `deploy-preview-N--interactius.netlify.app`.
- `branch-deploy` (otros branches habilitados) → `branch-deploy--interactius.netlify.app`.

Flujo de release: `feature/*` → PR a `staging` → merge → QA en `staging.interactius.com` → PR `staging` → `main` → autodeploy a producción. NO hacer hotfixes directos a `main` sin cherry-pickear a `staging`.

## Operations

Site is **LIVE** at `https://www.interactius.com` since 2026-05-07. Netlify auto-deploys on push to `main`. DNS managed by Netlify DNS (Hostytec is only the registrar). SSL Let's Encrypt auto-renew. Form submissions go to HubSpot. Analytics: GA4 with strict consent gating. GSC verified, sitemap submitted (~435 URLs). See `README.md` § Operations for env vars and monitoring entry points.

## Notes on README

`README.md` holds the current state of the project (stack, structure, operations, sprint history, decisions, known issues). Keep it in sync when arch changes; the sprint history section at the bottom is historical and shouldn't be rewritten retroactively.
