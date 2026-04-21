# Interactius — Web 2026

Nueva web corporativa de Interactius construida con Next.js 15 + TypeScript + Tailwind CSS 3.

Estado actual: **Sprints 1–5 completados.** Shell global, Homepage, Formularios, Capacidades + Identidad y Miradas (MDX) funcionales.

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

Las variables más relevantes para dev local:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

El resto de variables (Hubspot, GSC, Newsletter provider) solo son necesarias en producción / Sprint 6.

### 3. Arrancar en desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 — verás la home en español.

Prueba también:
- http://localhost:3000/ca — home en catalán
- http://localhost:3000/en — home en inglés
- http://localhost:3000/pensamiento-estrategico — capacidad 1
- http://localhost:3000/identidad — página sobre Interactius
- http://localhost:3000/miradas — listado de artículos
- http://localhost:3000/miradas/design/atomic-design-para-dummies — artículo MDX

### 4. Build de producción

```bash
npm run build
npm run start
```

### 5. Type-check y lint

```bash
npm run type-check   # tsc --noEmit
npm run lint         # eslint
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

---

## Estructura del proyecto

```
interactius-web/
├── app/
│   ├── [locale]/            # Todas las rutas localizadas
│   │   ├── layout.tsx       # RootLayout con i18n, fuentes, SEO
│   │   ├── page.tsx         # Home (5 secciones scroll-driven)
│   │   ├── pensamiento-estrategico/page.tsx
│   │   ├── activacion-de-soluciones/page.tsx
│   │   ├── transformacion-cultural/page.tsx
│   │   ├── identidad/page.tsx
│   │   ├── contacto/page.tsx
│   │   ├── newsletter/page.tsx
│   │   ├── testers/page.tsx
│   │   ├── miradas/
│   │   │   ├── page.tsx             # Listado de artículos
│   │   │   └── [cat]/[slug]/page.tsx # Artículo MDX
│   │   └── aviso-legal/page.tsx
│   ├── api/                 # API routes (contact, newsletter, testers)
│   └── globals.css          # CSS vars, reset, reveal primitives
│
├── components/
│   ├── layout/              # Sidebar, Header, MenuOverlay, Footer, PageTransition
│   ├── ui/                  # Button*, Form*, Logo, Wordmark, Checkbox
│   ├── motion/              # useReducedMotion, useScrollDirection, useFocusTrap
│   ├── home/                # Hero*, Intro*, Services*, Work*, ClientsMarquee
│   ├── capacity/            # CapacityHero, CapacityIntro, CapacityServices, CapacityOthers
│   ├── identidad/           # IdentidadHero, Intro, Valores, Liminal, Metodologia, Gente, JoinUs
│   ├── contact/             # ContactHero, ContactForm
│   └── miradas/             # MiradasGrid, MDXContent
│
├── lib/
│   ├── i18n/                # config.ts (locales), routing.ts (mapping)
│   ├── seo/                 # metadata.config.ts, schema.ts
│   ├── store/               # menu.ts (Zustand)
│   └── content/             # miradas.ts (fs + gray-matter reader)
│
├── content/
│   └── miradas/             # Artículos MDX por categoría
│       ├── design/          # 4 artículos
│       ├── ux/              # 1 artículo
│       ├── research/        # 2 artículos
│       ├── estrategia/      # 1 artículo
│       ├── diseno-inclusivo/ # 1 artículo
│       └── ia/              # 3 artículos
│
├── messages/                # UI strings por locale × namespace
│   ├── es/ {common, footer, nav, forms, meta, home}.json
│   ├── ca/ {common, footer, nav, forms, meta, home}.json
│   └── en/ {common, footer, nav, forms, meta, home}.json
│
├── public/
│   ├── home/hero-poster.webp   # ⚠ PLACEHOLDER — reemplazar con asset real
│   └── favicon.ico             # ⚠ PLACEHOLDER — reemplazar con asset real
│
├── middleware.ts            # Negociación de locale (next-intl)
├── i18n.ts                  # Request config de next-intl
├── next.config.mjs          # Config Next + plugin next-intl
├── tailwind.config.ts       # Sistema de tokens visual completo
├── tsconfig.json
└── package.json
```

---

## Stack técnico

| Área | Librería / API | Versión |
|---|---|---|
| Framework | Next.js App Router | 15.x |
| Tipado | TypeScript | 5.7 |
| Estilos | Tailwind CSS | 3.4 |
| Animación principal | Framer Motion | 11.x |
| Scroll-driven complejo | GSAP + SplitType | 3.12 + 0.3 |
| Internacionalización | next-intl | 3.x |
| Formularios | react-hook-form + zod | 7.54 + 3.24 |
| Estado ligero | Zustand | 5.x |
| Contenido editorial | MDX + gray-matter + @mdx-js/mdx | Sprint 5 ✅ |

---

## Qué está implementado (Sprints 1–5)

### Sprint 1 — Shell global ✅
- Sistema de tokens visual (colores, tipografía, spacing, grid).
- `RootLayout` con i18n, fuentes self-hosted, metadata SEO base, JSON-LD.
- 3 locales operativos (ES default sin prefijo, CA, EN).
- Navegación completa: Sidebar (60px fijo), Header (hide-on-scroll), MenuOverlay (focus-trap, stagger, locale switcher), Footer (reveal clip-path, wordmark, social), PageTransition (wipe warm-light).
- UI primitives: ButtonPrimary (wipe 2-fase), ButtonSecondary (underline wipe), FormField (floating label polymorphic), Checkbox (tick púrpura).
- SEO: metadata helper + schema.org Organization/WebSite/BreadcrumbList/Article.

### Sprint 2 — Homepage ✅
- HeroScroll con 3 fases scroll-driven + clip-path animado + poster LCP-optimized + Ken-Burns.
- HeroTagline con SplitType line-mask reveal.
- IntroScroll con 4 fases + 3 bloques (body / quote / body) + fade-out final.
- ServicesRows con 3 filas de pilares y reveal clip-path lateral.
- WorkGrid masonry 8 cards con offsets + stagger reveal.
- ClientsMarquee CSS puro con 5 filas alternadas.

### Sprint 3 — Formularios transaccionales ✅
- `ContactHero` reutilizable con imagen fullscreen + panel blanco + reveals.
- `ContactForm` polymorphic con 3 variants (contacto/newsletter/testers).
- Validación client-side + server-side con zod.
- 3 endpoints API: `/api/contact`, `/api/newsletter`, `/api/testers` — stubs funcionales listos para Hubspot.
- Checkbox GDPR obligatorio en los 3 forms.
- Estados `idle | submitting | success | error` con feedback accesible.

### Sprint 4 — Capacidades e Identidad ✅
- 4 componentes compartidos: `CapacityHero`, `CapacityIntro`, `CapacityServices`, `CapacityOthers`.
- 3 páginas de capacidad con contenido real extraído de Figma:
  - `/pensamiento-estrategico` — 4 servicios, clientes reales
  - `/activacion-de-soluciones` — 4 servicios incl. Clonica© e Insight Panel©
  - `/transformacion-cultural` — 3 servicios + Manifiesto IA inline
- Página `/identidad` con 7 secciones: Hero, Intro, Valores (×4), Liminal Thinkers, Metodología, Nuestra gente, JoinUs.

### Sprint 5 — Miradas (MDX) ✅
- 12 artículos reales migrados del site actual (`content/miradas/[cat]/[slug].mdx`).
- 6 categorías: `design`, `ux`, `research`, `estrategia`, `diseno-inclusivo`, `ia`.
- `lib/content/miradas.ts` — reader tipado con `fs` + `gray-matter`.
- `MDXContent` — server component que compila MDX con `@mdx-js/mdx` evaluate.
- Listing `/miradas` con grid 3 columnas + stagger reveal.
- Artículo `/miradas/[cat]/[slug]` con layout editorial 8 columnas.
- `generateStaticParams` para prerender en build.
- `LocaleSwitcher` corregido para rutas dinámicas (pasa `{ pathname, params }` en vez del path concreto).

---

## Pendiente (Sprint 6)

- Redirects 301 desde `interactius_redirects_301_FINAL.xlsx` (108 URLs) → `next.config.mjs`
- Sitemap dinámico (`app/sitemap.ts`) incluyendo todas las Miradas
- `robots.txt` diferenciado prod/staging
- Aviso legal con contenido real
- Migración de los 96 artículos restantes de Miradas (se migraron 12 de 108)
- GSC verification tag (`NEXT_PUBLIC_GSC_VERIFICATION`)
- Swap endpoints API → Hubspot/provider real

---

## Assets placeholder a reemplazar

| Ruta | Estado | Acción requerida |
|---|---|---|
| `public/favicon.ico` | Placeholder "I" | Reemplazar con favicon real |
| `public/home/hero-poster.webp` | Placeholder gradiente | Reemplazar con poster real 1649×550 WebP |
| `components/ui/Logo.tsx` | Placeholder tipográfico SVG | Reemplazar paths SVG con asset real |
| `components/ui/Wordmark.tsx` | Placeholder tipográfico SVG | Reemplazar paths SVG con asset real |
| OG image `/og-default.png` | No existe | Crear 1200×630 o usar `app/opengraph-image.tsx` |
| `components/identidad/IdentidadGente.tsx` | 5 placeholders de foto | Reemplazar con fotos reales del equipo |
| `content/miradas/` | 12 de 108 artículos migrados | Migrar los 96 restantes |

---

## Decisiones arquitectónicas relevantes

### i18n — URLs sin prefijo para ES

ES es default sin prefijo (`/contacto`). CA y EN con prefijo (`/ca/contacte`, `/en/contact`). Gestionado con middleware + `next-intl` `localePrefix: 'as-needed'`.

### Slugs de categorías Miradas — idénticos en los 3 idiomas

Decisión consciente para preservar los 108 redirects 301 ya preparados (`interactius_redirects_301_FINAL.xlsx`).

### LocaleSwitcher en rutas dinámicas

En páginas de artículo (`/miradas/[cat]/[slug]`), next-intl necesita recibir `{ pathname: '/miradas/[cat]/[slug]', params: { cat, slug } }` — no el path concreto. El componente detecta si está en una ruta dinámica por la presencia de `cat` + `slug` en `useParams()`.

### MDX rendering — server component

Los artículos se compilan en el servidor con `@mdx-js/mdx` `evaluate`. No usa `next-mdx-remote` (no instalado). Los frontmatter se leen con `gray-matter` en `lib/content/miradas.ts`.

### Reduced-motion

Hook `useReducedMotion` + regla CSS global agresiva. Animaciones JS quedan gated. Animaciones CSS declarativas se neutralizan por `@media (prefers-reduced-motion)`.

### Robots — producción vs. staging

`SITE_CONFIG.isProduction` detecta el host canónico (`www.interactius.com`). En cualquier otro host se activa `robots: noindex, nofollow` automáticamente.

---

## Problemas conocidos / deuda técnica

1. **WorkCard masonry offsets** — interpretación sin Figma. Revisar contra diseño final.
2. **IntroScroll composition** — validar con Figma node 377:2394.
3. **Traducciones CA/EN** — primera pasada. Requiere revisión de hablante nativo.
4. **Social URLs** (LinkedIn, Instagram, YouTube) — confirmar handles reales en `lib/seo/metadata.config.ts`.
5. **GSC verification** — pendiente de pegar código al deploy.
6. **Miradas — 96 artículos pendientes** — solo se migraron los 12 más visitados.
7. **Imágenes en artículos MDX** — sin soporte todavía (el `MDXContent` no mapea `img` a `next/image`).
8. **iPad Pro landscape** (1024×1366) — validar rendimiento del hero scroll-driven.

---

## Contacto del proyecto

Documentación de sistema frontend: `SISTEMA_FRONTEND_INTERACTIUS.md`
Documentación de SEO técnico: `SEO_TECNICO_INTERACTIUS.md`
Direction base: `00__Direccio_n_del_proyecto.pdf`
Arquitectura: `01__Arquitectura_del_sitio.pdf`
Concepto: `Conceptocreativo_El_Entre_Interactius.pdf`
Voz de marca: `Guia_Estilo_Marca_Interactius_v3.pdf`
