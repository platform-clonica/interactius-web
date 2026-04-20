# Interactius — Web 2026

Nueva web corporativa de Interactius construida con Next.js 15 + TypeScript + Tailwind CSS 3.

Estado actual: **Sprints 1–2 completados.** Shell global + Homepage funcional. Resto de plantillas con stubs.

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

El resto de variables (Hubspot, GSC, Newsletter provider) solo son necesarias en producción / Sprint 3.

### 3. Arrancar en desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 — verás la home en español.

Prueba también:
- http://localhost:3000/ca — home en catalán
- http://localhost:3000/en — home en inglés
- http://localhost:3000/pensamiento-estrategico — stub página capacidad

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
│   │   ├── page.tsx         # Home (las 5 secciones)
│   │   ├── pensamiento-estrategico/page.tsx
│   │   ├── activacion-de-soluciones/page.tsx
│   │   ├── transformacion-cultural/page.tsx
│   │   ├── identidad/page.tsx
│   │   ├── contacto/page.tsx
│   │   ├── newsletter/page.tsx
│   │   ├── testers/page.tsx
│   │   ├── miradas/page.tsx
│   │   └── aviso-legal/page.tsx
│   ├── api/                 # API routes
│   └── globals.css          # CSS vars, reset, reveal primitives
│
├── components/
│   ├── layout/              # Sidebar, Header, MenuOverlay, Footer, PageTransition
│   ├── ui/                  # Button*, Form*, Logo, Wordmark, Checkbox
│   ├── motion/              # useReducedMotion, useScrollDirection, useFocusTrap
│   └── home/                # Hero*, Intro*, Services*, Work*, ClientsMarquee
│
├── lib/
│   ├── i18n/                # config.ts (locales), routing.ts (mapping)
│   ├── seo/                 # metadata.config.ts, schema.ts
│   └── store/               # menu.ts (Zustand)
│
├── messages/                # UI strings por locale × namespace
│   ├── es/ {common, footer, nav, forms, meta, home}.json
│   ├── ca/ {common, footer, nav, forms, meta, home}.json
│   └── en/ {common, footer, nav, forms, meta, home}.json
│
├── content/miradas/         # MDX artículos (Sprint 5)
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
| Contenido editorial | MDX + gray-matter | Sprint 5 |

---

## Qué está implementado (Sprint 1–2)

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
- `ContactHero` reutilizable con imagen fullscreen + panel blanco + reveals A18/A19.
- `ContactForm` polymorphic con 3 variants (contacto/newsletter/testers).
- Validación client-side + server-side con zod (schemas duplicados intencionadamente).
- 3 endpoints API: `/api/contact`, `/api/newsletter`, `/api/testers` — stubs funcionales que validan y loguean; listos para swap con Hubspot/provider cuando haya credenciales.
- Checkbox GDPR obligatorio en los 3 forms, con link a aviso legal.
- Estados `idle | submitting | success | error` con feedback AA (role=status, role=alert).

### No implementado todavía
- Sprint 4 — Capacidades e Identidad (contenido real).
- Sprint 5 — Miradas (MDX).
- Sprint 6 — SEO avanzado, redirects 301, sitemap, aviso legal.

---

## Assets placeholder a reemplazar

| Ruta | Estado | Acción requerida |
|---|---|---|
| `public/favicon.ico` | Placeholder "I" | Reemplazar con favicon real |
| `public/home/hero-poster.webp` | Placeholder gradiente | Reemplazar con poster real 1649×550 WebP |
| `components/ui/Logo.tsx` | Placeholder tipográfico SVG | Reemplazar paths SVG con asset real |
| `components/ui/Wordmark.tsx` | Placeholder tipográfico SVG | Reemplazar paths SVG con asset real |
| OG image (referenciada en metadata) | Placeholder `/og-default.png` | Crear 1200×630 o generar con `app/opengraph-image.tsx` |

---

## Decisiones arquitectónicas relevantes

### i18n — URLs sin prefijo para ES

ES es default sin prefijo (`/contacto`). CA y EN con prefijo (`/ca/contacte`, `/en/contact`). Gestionado con middleware + `next-intl` `localePrefix: 'as-needed'`.

### Slugs de categorías Miradas — idénticos en los 3 idiomas

Decisión consciente para preservar los 108 redirects 301 ya preparados (`interactius_redirects_301.xlsx`).

### Reduced-motion

Hook `useReducedMotion` + regla CSS global agresiva. Animaciones JS quedan gated. Animaciones CSS declarativas se neutralizan por `@media (prefers-reduced-motion)`.

### Scroll-driven vs. IntersectionObserver

Hero e Intro usan scroll-driven (RAF throttle) por su complejidad de clip-path y timing preciso. Services, Work y Footer usan IntersectionObserver one-shot (más ligero, suficiente).

### Robots — producción vs. staging

`SITE_CONFIG.isProduction` detecta el host canónico (`www.interactius.com`). En cualquier otro host se activa `robots: noindex, nofollow` automáticamente. Previene indexación accidental de staging/preview.

---

## Problemas conocidos / deuda técnica

1. **WorkCard masonry offsets** son interpretación sin Figma. Revisar contra el diseño cuando esté accesible.
2. **IntroScroll composition** (col-7 + col-12 + col-6) es interpretación. Validar con Figma node 377:2394.
3. **Traducciones CA/EN** — primera pasada razonable. Requiere revisión de hablante nativo antes de lanzamiento.
4. **Social URLs** (LinkedIn, Instagram, YouTube) son placeholders en `lib/seo/metadata.config.ts` — confirmar handles reales.
5. **GSC verification** — pendiente de pegar código al deploy (`NEXT_PUBLIC_GSC_VERIFICATION`).
6. **Font loading** — IBM Plex via `next/font/google` funciona pero si la red de build falla, falla el build. Considerar self-host con woff2 local si hay problemas.
7. **iPad Pro landscape** (1024×1366) entra en rango desktop y ve el pin scroll-driven. Validar rendimiento en dispositivo real.

---

## Testing manual recomendado (primera sesión)

1. `npm run dev` → abre http://localhost:3000
2. Comprueba que la home renderiza sin errores en consola.
3. Haz scroll → observa el comportamiento del hero (fase 1 apertura → fase 2 fullscreen → fase 3 cierre vertical).
4. Continúa scroll → intro aparece con 4 fases.
5. Continúa → services con 3 filas reveal.
6. Continúa → work grid masonry.
7. Continúa → clients marquee animado.
8. Continúa → footer aparece con reveal vertical.
9. Click en hamburger (sidebar izquierdo) → menu overlay abre con animación.
10. Click en un link del menu → page transition wipe → llega a página stub.
11. Cambia locale desde el menu (ES / CA / EN) → comprueba slugs localizados.
12. Resize a < 900px → sidebar se oculta, hero queda estático, masonry pasa a 2 cols.
13. Resize a < 480px → todo en una columna.
14. Activa `prefers-reduced-motion` en el OS → reload → verifica que animaciones quedan desactivadas, contenido visible.
15. Tab-navigation → verifica focus visible AA, focus trap en menu overlay, skip-link funcional.

---

## Lighthouse esperado en home

Sin optimizaciones adicionales, con assets placeholder:
- **Performance:** 85–95 (LCP depende del poster real).
- **Accessibility:** 95–100.
- **Best Practices:** 100.
- **SEO:** 90–100 (depende de metadata por página).

Tras sustituir assets reales y activar preload crítico:
- **Performance:** >95 target.

---

## Contacto del proyecto

Documentación de sistema frontend: `SISTEMA_FRONTEND_INTERACTIUS.md`
Documentación de SEO técnico: `SEO_TECNICO_INTERACTIUS.md`
Direction base: `00__Direccio_n_del_proyecto.pdf`
Arquitectura: `01__Arquitectura_del_sitio.pdf`
Concepto: `Conceptocreativo_El_Entre_Interactius.pdf`
Voz de marca: `Guia_Estilo_Marca_Interactius_v3.pdf`
