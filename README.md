# Interactius — Web 2026

Web corporativa de Interactius. Next.js 15 + TypeScript + Tailwind CSS 3.

**LIVE en producción desde 2026-05-07** → [https://www.interactius.com](https://www.interactius.com)

Sprints 1–6 completados + operativa post-launch (DNS, GA4 + consent banner, GSC, fix de redirects legacy, i18n exhaustivo, performance fixes).

---

## Arranque rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Para dev local basta con:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Las demás (HubSpot, GA4, GSC) viven en Netlify para producción — ver sección "Operaciones".

### 3. Arrancar en desarrollo

```bash
npm run dev
```

Abre http://localhost:3000.

Smoke rápido:
- http://localhost:3000/ca — home en catalán
- http://localhost:3000/en — home en inglés
- http://localhost:3000/pensamiento-estrategico — capacidad 1
- http://localhost:3000/identidad — sobre Interactius
- http://localhost:3000/miradas — listado de artículos
- http://localhost:3000/miradas/diseno-ux-ui/biomimesis-y-diseno — artículo MDX

### 4. Build de producción

```bash
npm run build
npm run start
```

### 5. Type-check y lint

```bash
npm run type-check
npm run lint
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Arranca servidor de desarrollo con HMR |
| `npm run build` | Build de producción estático/híbrido |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | Ejecuta ESLint con config de Next |
| `npm run type-check` | Valida tipos TypeScript sin emitir |
| `npm run validate:miradas` | Valida los frontmatters MDX contra zod |

---

## Estructura del proyecto

```
interactius-web/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx                                # RootLayout (i18n, fuentes, SEO, GA4Script)
│   │   ├── not-found.tsx                             # 404 i18n
│   │   ├── [...rest]/page.tsx                        # Catch-all → activa not-found localizado
│   │   ├── (main)/                                   # Chrome completo (Sidebar, Header, MenuOverlay, Footer, PageTransition)
│   │   │   ├── page.tsx                              # Home
│   │   │   ├── pensamiento-estrategico/page.tsx
│   │   │   ├── diseno-de-experiencias/page.tsx
│   │   │   ├── transformacion-cultural/page.tsx
│   │   │   ├── identidad/page.tsx
│   │   │   ├── miradas/page.tsx                      # Listing global
│   │   │   ├── miradas/[parentOrSub]/page.tsx        # Listing categoría madre/sub
│   │   │   ├── miradas/[parentOrSub]/[slug]/page.tsx # Detalle artículo
│   │   │   ├── aviso-legal/page.tsx
│   │   │   ├── politica-privacidad/page.tsx
│   │   │   ├── politica-cookies/page.tsx
│   │   │   └── terminos/page.tsx
│   │   └── (contact)/                                # Fullscreen overlay sin chrome
│   │       ├── contacto/page.tsx
│   │       ├── newsletter/page.tsx
│   │       └── testers/page.tsx
│   ├── api/                                          # Form endpoints → HubSpot Forms API
│   │   ├── contact/route.ts
│   │   ├── newsletter/route.ts
│   │   └── testers/route.ts
│   ├── global-error.tsx                              # Fallback root layout broken (i18n inline ES/CA/EN)
│   ├── robots.ts                                     # robots.txt prod-aware
│   ├── sitemap.ts                                    # Sitemap dinámico ~435 URLs
│   └── globals.css                                   # CSS vars, reset, reveal primitives
│
├── components/
│   ├── layout/                                       # Sidebar, Header, MenuOverlay, Footer, PageTransition, PageCurtain
│   ├── ui/                                           # Button*, FormField, Logo, Wordmark, Checkbox, SuperTitleReveal
│   ├── motion/                                       # useReducedMotion, useScrollDirection, useFocusTrap, wrapLinesInMask
│   ├── home/                                         # HeroScroll, HomeIntroText, HomeIntroReveal, ServicesRows, WorkGrid, ClientsMarquee
│   ├── capacity/                                     # CapacityHero, CapacityIntro, CapacityServices, CapacityOthers, CapacityVortex
│   ├── identidad/                                    # IdentidadHero, IdentidadIntro, IdentidadValores, IdentidadLiminal, IdentidadMetodologia, IdentidadGente
│   ├── contact/                                      # ContactHero, ContactForm, ContactOverlay
│   ├── miradas/                                      # MiradasHero, MiradasGrid, MiradasGlobalHome, MiradasParentListing, MiradasSubListing, ArticleCardSimple, AuthorAvatar, Breadcrumb, MDXContent, article/{ShareRow, ArticleNext}
│   ├── analytics/                                    # GA4Script (gated por consent)
│   └── consent/                                      # ConsentBanner, ConsentSettings, ConsentMount, ManagePreferencesButton
│
├── lib/
│   ├── i18n/                                         # config, routing, navigation, formatDate, rich-text
│   ├── seo/                                          # metadata.config.ts, schema.ts
│   ├── store/                                        # menu (Zustand), consent (Zustand), curtain
│   ├── content/                                      # miradas reader (fs + gray-matter)
│   ├── miradas/                                      # frontmatter.schema (zod), i18n-routing (slugs localizados)
│   ├── consent/                                      # types, cookie (serialize/parse + cookie persist)
│   ├── data/                                         # team (datos del equipo)
│   └── hubspot/                                      # submit (POST a Forms Submissions API)
│
├── content/
│   └── miradas/                                      # 125 artículos MDX
│       ├── pensamiento-estrategico/ (×4)             # SUBS: diseno-estrategico (19), innovacion (15), futuros (7), marca (4)
│       ├── diseno-experiencias/ (×3)                 # SUBS: diseno-ux-ui (34), ux-research (18), clonica (8)
│       └── transformacion-cultural/ (×3)             # SUBS: ia-aplicada (13), cultura-organizacional (19), workshops (6)
│
├── config/
│   └── miradas-redirects.mjs                         # 244 redirects 301 desde WP
│
├── messages/                                         # 12 namespaces × 3 locales
│   ├── es/ {common,nav,footer,forms,home,identidad,capacidades,contacto,miradas,legal,consent,meta}.json
│   ├── ca/ idem
│   └── en/ idem
│
├── public/
│   ├── favicon.png                                   # Asset definitivo
│   ├── apple-touch-icon.png                          # 180×180
│   ├── og-default.png                                # 1200×630
│   ├── home/hero-poster.{mp4,webp}                   # Vídeo + poster del hero
│   ├── miradas/                                      # Covers + placeholders
│   └── identidad/fotos-team/                         # 28 fotos del equipo
│
├── middleware.ts                                     # next-intl + 244 redirects + fallback wildcard prefijos legacy
├── i18n/request.ts                                   # Request config de next-intl
├── netlify.toml                                      # Build + env vars + plugin + redirects archivo
├── next.config.mjs                                   # Config Next (transpile gsap, headers seguridad, imágenes)
├── tailwind.config.ts                                # Sistema de tokens visual completo
├── CLAUDE.md                                         # Guidance para Claude Code
└── package.json
```

---

## Stack técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js App Router | 15.x |
| Tipado | TypeScript | 5.7 |
| Estilos | Tailwind CSS | 3.4 |
| Animación principal | Framer Motion | 11.x |
| Scroll-driven complejo | GSAP + ScrollTrigger + SplitType | 3.12 + 0.3 |
| Internacionalización | next-intl | 3.x |
| Formularios | react-hook-form + zod | 7.54 + 3.24 |
| Estado ligero | Zustand | 5.x |
| Contenido editorial | MDX (@mdx-js/mdx evaluate) + gray-matter | — |
| Hosting | Netlify (`@netlify/plugin-nextjs` 5.x) | — |
| Forms backend | HubSpot Forms Submissions API | — |
| Analytics | Google Analytics 4 (gated por consent) | — |
| SSL | Let's Encrypt (auto-gestionado por Netlify) | — |

---

## Operaciones

### Hosting & deploy
- **Netlify** con `@netlify/plugin-nextjs` (configurado en `netlify.toml`, no en dashboard).
- **Auto-deploy** en push a `main` (producción) y a `staging` (pre-producción). Build context aplica env vars por entorno:
  - `production` (branch `main`): `NEXT_PUBLIC_SITE_URL=https://www.interactius.com`.
  - `staging` (branch `staging`): `NEXT_PUBLIC_SITE_URL=https://staging.interactius.com`. `isProduction=false` automático → robots `noindex` + GA4 off + HubSpot stub mode.
  - `deploy-preview` y `branch-deploy`: URLs `*.netlify.app` (robots noindex automático).

### Staging environment
- **URL**: `https://staging.interactius.com`. NO añadir a Google Search Console (queda registrado aunque robots lo bloquee).
- **Branch**: `staging` (autodeploy en Netlify).
- **Flujo de release**: `feature/*` → PR a `staging` → merge → QA en `staging.interactius.com` → PR `staging` → `main` → autodeploy a producción.
- **HubSpot**: stub mode. Las `HUBSPOT_FORM_ID_*` están restringidas a scope "Production" en Netlify UI, así que en staging quedan `undefined` y los endpoints de [app/api/](app/api/) loguean el payload y devuelven `ok: true` sin POST a HubSpot. Verificación: submit en `/contacto` no aparece en HubSpot Marketing → Forms → Submissions.
- **GA4**: deshabilitado automáticamente (`SITE_CONFIG.isProduction === false`).
- **robots**: `Disallow: /` global vía [app/robots.ts](app/robots.ts) + `noindex, nofollow` en `<meta>` vía [lib/seo/metadata.config.ts](lib/seo/metadata.config.ts).
- **Política**: nunca `push --force` ni rebase destructivo sobre `staging`. Si un hotfix tiene que ir directo a `main`, cherry-pick inmediato a `staging` para evitar divergencia.

### DNS
- **Registrar**: Hostytec.
- **Nameservers**: delegados a Netlify DNS (`dns1-4.p07.nsone.net`).
- **Zona DNS** gestionada desde el dashboard de Netlify.
- Apex `interactius.com` → 301 a `www.interactius.com` (Netlify primary).
- Subdominio `legacy.interactius.com` → A `35.214.209.83` (WordPress antiguo en SiteGround, mantenido como backup).
- MX en Google Workspace (correo intacto).

### Env vars en Netlify
| Variable | Scope | Notas |
|---|---|---|
| `HUBSPOT_PORTAL_ID` | Production | Público pero scopeado a prod para activar stub mode en staging |
| `HUBSPOT_FORM_ID_CONTACT` | Production | — |
| `HUBSPOT_FORM_ID_NEWSLETTER` | Production | — |
| `HUBSPOT_FORM_ID_TESTERS` | Production | — |
| `HUBSPOT_ACCESS_TOKEN` | Production | Opcional (forms públicos no lo necesitan) |
| `NEXT_PUBLIC_GA4_ID` | All | Mismo Measurement ID que el WP previo (continuidad histórica). En staging se ignora por `isProduction=false` |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Production | TXT verification |
| `NEXT_PUBLIC_SITE_URL` | — | Definido en `netlify.toml` por context, no aquí |

### Monitoring
- **Netlify dashboard** → Functions logs (5xx en API routes).
- **HubSpot** → Marketing → Forms → Submissions.
- **GA4** → Realtime + Reports.
- **Google Search Console** → Coverage + Core Web Vitals.

---

## Consent + Analytics

- **GA4 con gating estricto**: `gtag.js` NO se descarga hasta que el usuario acepta la categoría `analytics` en el banner ([components/analytics/GA4Script.tsx](components/analytics/GA4Script.tsx)). Si rechaza o no decide, GA no existe en su sesión.
- **Infra** completa en `lib/consent/` + `lib/store/consent.ts` + `components/consent/*`:
  - Banner inferior con 3 acciones (Rechazar / Personalizar / Aceptar) — alineado AEPD.
  - Panel granular con 4 categorías (necessary / preferences / analytics / marketing).
  - Cookie first-party `interactius_consent_v1` (12 meses), versión `v1`.
  - Hard-reload automático cuando se revoca una categoría (limpia globals de gtag).
- **Política de cookies** menciona Google Analytics explícitamente y enlaza el panel de gestión desde el footer ("Gestionar preferencias").

---

## Decisiones arquitectónicas relevantes

### i18n
- ES es default sin prefijo (`/contacto`). CA y EN con prefijo (`/ca/contacte`, `/en/contact`). Gestionado por `next-intl` con `localePrefix: 'as-needed'`.
- UI strings en `messages/{locale}/{namespace}.json`. Server: `getTranslations()`. Client: `useTranslations()`.
- 14 RouteId × 3 locales en `lib/i18n/routing.ts` (`pathnames`).
- **Slugs Miradas (categoría) localizados**: la subcategoría (`[parentOrSub]`) se traduce — ej. `diseno-ux-ui` (ES) / `disseny-ux-ui` (CA) / `ux-ui-design` (EN). Ver `lib/miradas/i18n-routing.ts`.
- **Slugs Miradas (artículo) invariantes**: el segmento `[slug]` se mantiene en ES en las 3 locales — eso es lo que permite que los 244 redirects 301 desde el WP funcionen sin duplicación.

### Redirects legacy WP → Next
- **244 redirects 301** vivían originalmente en `next.config.mjs#redirects()`, pero se movieron a [middleware.ts](middleware.ts) porque Netlify (con `@netlify/plugin-nextjs`) ejecuta el rewrite de next-intl ANTES que los `redirects()` declarativos, dejando los 244 muertos.
- Hoy: lookup O(1) en un Map al inicio del middleware, con normalización de trailing slash y `decodeURIComponent` para caracteres no-ASCII (ñ, etc.).
- **Fallback wildcard** al final del middleware: si el path empieza con un prefijo legacy (`/research/*`, `/design/*`, `/ux/*`, `/ia/*`, `/estrategia/*`, `/workshops/*`, `/diseno-inclusivo/*`, `/user-experience-en/*`) y no hay match exacto en el Map, redirige al sub-listing más probable. Cubre cola larga sin necesidad de mantener slugs uno a uno.
- **PDF antiguo** `/STMDL/Digital-transformation-tools.pdf` → redirect a `/miradas` en `netlify.toml` (el middleware no procesa paths con extensión).

### Active state del menú
- [components/layout/MenuOverlay.tsx](components/layout/MenuOverlay.tsx) marca el item correspondiente a la página actual.
- Primary items (servicios): `font-light` → `font-normal` cuando activos.
- Secondary items: `font-medium` + sin `hover-wipe-underline` cuando activos.
- Herencia de padre: sub-rutas iluminan la raíz. Ej. `/miradas/<sub>/<slug>` → ilumina "Miradas".
- Helper `isItemActive(itemRoute, pathname)` con match exacto para `/` y `startsWith` para el resto.

### MDX
- Artículos compilados server-side con `@mdx-js/mdx#evaluate` desde [components/miradas/MDXContent.tsx](components/miradas/MDXContent.tsx).
- Frontmatter validado con zod en [lib/miradas/frontmatter.schema.ts](lib/miradas/frontmatter.schema.ts). Script `npm run validate:miradas`.
- Imágenes en MDX usan `<img>` plano todavía (deuda: mapear a `next/image`).

### Chrome layout (mix-blend-mode)
- Logo + hamburger en `<aside>` fijo con `mix-blend-mode: difference`. Pipeline: SVG dark → `filter: brightness(0) invert(1)` (pixels blancos) → `mix-blend-mode: difference` invierte → contraste correcto sobre cualquier fondo.
- Detalle en [CLAUDE.md](CLAUDE.md).

### Reduced-motion
- `components/motion/useReducedMotion.ts` + regla CSS global. Animaciones GSAP/Framer gated, animaciones CSS neutralizadas por `@media`.

### Robots — producción vs. staging
- `SITE_CONFIG.isProduction` (en `lib/seo/metadata.config.ts`) detecta el host canónico via `NEXT_PUBLIC_SITE_URL`. Cualquier valor distinto de `https://www.interactius.com` o `https://interactius.com` activa `robots: noindex, nofollow` automáticamente.
- En `staging.interactius.com` esto se traduce en `Disallow: /` global y `<meta name="robots" content="noindex, nofollow">` en todas las páginas, sin código condicional adicional.

---

## Sprint history (apéndice histórico)

### Sprint 1 — Shell global ✅
Sistema de tokens visual, RootLayout con i18n + fuentes + SEO + JSON-LD. Navegación: Sidebar, Header, MenuOverlay, Footer, PageTransition. UI primitives (Button*, FormField, Checkbox). Schema.org Organization/WebSite.

### Sprint 2 — Homepage ✅
HeroScroll scroll-driven 3 fases, HeroTagline line-mask, IntroScroll 4 fases, ServicesRows clip-path lateral, WorkGrid masonry, ClientsMarquee.

### Sprint 3 — Formularios transaccionales ✅
ContactHero reutilizable, ContactForm polymorphic (contacto/newsletter/testers), validación zod client+server, checkbox GDPR, estados accesibles.

### Sprint 4 — Capacidades + Identidad ✅
4 componentes compartidos de Capacity (Hero, Intro, Services, Others). 3 páginas de capacidad con contenido real. Página /identidad con 7 secciones.

### Sprint 5 — Miradas (MDX) ✅
125 artículos migrados a `content/miradas/`. Reader tipado con fs + gray-matter. MDXContent server component. Listing + detalle. `generateStaticParams` para prerender. LocaleSwitcher en rutas dinámicas.

### Sprint 6 — Producción ✅
- HubSpot Forms API integrado en los 3 endpoints.
- 244 redirects 301 desde WP + fallback wildcard para cola larga.
- Sitemap dinámico (435 URLs).
- robots.txt prod-aware.
- 4 docs legales (ES completo, CA/EN pendientes nativo).
- GSC verificado + sitemap submitted. 237 URLs indexadas a 5 días, ascendiendo.
- GA4 con consent gating estricto (Plausible descartado).
- DNS Hostytec → Netlify DNS. SSL Let's Encrypt.
- Performance: 94 desktop tras `prefetch={false}` en LocaleSwitcher + video hero 10.5 MB → 3.6 MB.
- i18n exhaustivo: 30+ strings ES hardcoded migrados a `messages/*`.
- A11y: alt text, focus-visible, aria-label, formatDate locale-aware.
- Active state del menú con herencia padre.

---

## Problemas conocidos / deuda técnica

| # | Item | Impacto |
|---|---|---|
| 1 | Traducción nativa de `legal.json` CA/EN (aviso legal, privacidad, cookies, términos) — texto técnico-legal | UI legal en español en las 3 locales hasta que llegue traductor profesional |
| 2 | Imágenes MDX como `<img>` plano (no `next/image`) | LCP / bandwidth subóptimos en artículos pesados |
| 3 | iPad Pro 12.9" landscape (1024×1366) — sin validación en device físico | Posibles edge cases de canvas/GSAP/mix-blend-mode |
| 4 | iOS Safari real device — sin validación | Idem |
| 5 | 3 vulnerabilidades moderate `npm audit` (next-intl + postcss) | No explotables en este código. Fix requiere bump major de next-intl, lo dejamos hasta sesión dedicada |

---

## Documentación complementaria

- **[CLAUDE.md](CLAUDE.md)** — guidance para Claude Code (convenciones, patrones canónicos).
- **[MIGRATION_TAXONOMY_REPORT.md](MIGRATION_TAXONOMY_REPORT.md)** — informe de la migración de Miradas a taxonomía v2 (snapshot 2026-05-05).
- **[docs/AUDIT_PLAN_2026-05.md](docs/AUDIT_PLAN_2026-05.md)** — plan de auditoría pre-go-live.
