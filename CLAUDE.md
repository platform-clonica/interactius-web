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
- Miradas category slugs are intentionally identical across locales to preserve the 108 prepared 301 redirects.
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

API routes under `app/api/` (contact, newsletter, testers) are **stubs** — client + server zod validation is wired, but the endpoints log only. Wire to Hubspot or the chosen provider in Sprint 6.

## Conventions

- Server components by default. Client components only when they need state, effects, or browser APIs (`useTranslations`, `useRef`, `gsap`, etc.). Components using GSAP + SplitType import them **dynamically** inside a `useEffect` to keep them out of the SSR bundle.
- Dark color is `text-fg` (`#1C1A17`), warm background is `bg-warm-light` (`#F5F2ED`), contrast dark bg is `bg-dark`. Never hardcode hex.
- For 12-col grid positioning, `col-start-2` is the canonical text-content start on the identidad page (established as the reference for the rest of the site). Images go edge-to-edge; text starts at col 2.

## Deploy

Netlify (`netlify.toml`). Build config via `@netlify/plugin-nextjs`. `SITE_CONFIG.isProduction` in `lib/seo/metadata.config.ts` decides canonical host and whether robots is `noindex`.

## Notes on README

`README.md` holds the sprint-by-sprint implementation history and the placeholder-asset checklist. Treat it as historical context — do not edit it to reflect day-to-day work. Active state and open questions belong in memory (`~/.claude/projects/-Users-anico/memory/`) or the conversation.
