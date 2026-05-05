# Plan — Auditoría de código, refactor y optimización

## Context

El repo cierra Sprints 1–5 + migración Miradas (HEAD `741fd46`, `main`). Antes de Sprint 6 (Hubspot, GSC, etc.) tiene sentido una auditoría que normalice deuda, deduplique código que ha aparecido durante los sprints, mejore tipos donde el `any` se acumuló por el patrón GSAP+SplitType, y deje un documento de baseline para futuros refactors.

Los 3 scans previos (calidad, rendimiento, a11y/SEO/i18n) confirman que **no hay problemas críticos**: arquitectura es sólida (alias `@/`, sin barrel files, dynamic imports correctos, sitemap+robots+metadata cumpliendo). Lo que hay es **deuda mediana acotada** que merece pasada antes de seguir construyendo.

Decisiones del usuario:
- Una **única branch específica** para todo el trabajo (no una por fase).
- Documentar la auditoría como artefacto del proyecto, no solo aplicar fixes.

## Estrategia

**Branch**: `audit/code-quality-2026-05` desde `main` (`741fd46`).
**Output**: una serie de commits temáticos pequeños + un documento `AUDIT_2026-05.md` en la raíz que sirva de baseline.
**Cierre**: PR a `main` con summary consolidado.

Cada fase es **independientemente verificable** (`npm run type-check && npm run lint` + smoke visual). Si algo se desvía, se para sin bloquear las anteriores.

## Fases

### Fase 0 — Setup

```
git checkout main && git pull
git checkout -b audit/code-quality-2026-05
```

### Fase 1 — Documento baseline (commit 1)

Crear **`AUDIT_2026-05.md`** en la raíz consolidando los hallazgos de los 3 scans previos. Tabla por área (Calidad / Rendimiento / A11y / SEO / i18n). Cada fila: archivo:línea + descripción + estado (`pendiente` / `aplicado en commit X` / `diferido`). El documento queda como referencia viva.

### Fase 2 — Quick wins (commit 2)

Cambios low-risk, sin refactor estructural:

- **i18n de aria-labels**: 6 strings hardcoded en español → namespace `messages/{locale}/common.json`:
  - [components/home/HeroScroll.tsx:511, 542](components/home/HeroScroll.tsx#L511) — "Cerrar vídeo", "Activar sonido", "Silenciar"
  - [components/contact/ContactOverlay.tsx:50](components/contact/ContactOverlay.tsx#L50) — "Cerrar"
  - [components/miradas/MiradasGrid.tsx:384](components/miradas/MiradasGrid.tsx#L384) — "Cargando más artículos"
  - [components/miradas/article/ArticleNext.tsx:45](components/miradas/article/ArticleNext.tsx#L45) — "Siguiente artículo: …"
  - [components/miradas/article/ShareRow.tsx:74](components/miradas/article/ShareRow.tsx#L74) — "Copiar enlace al portapapeles"
- **Alt descriptivo en cover Miradas**: [app/[locale]/(main)/miradas/[cat]/[slug]/page.tsx:106](app/%5Blocale%5D/%28main%29/miradas/%5Bcat%5D/%5Bslug%5D/page.tsx#L106) — `alt=""` en imagen prominente del artículo. Cambiar a `alt={article.title}` o mantener `alt=""` + `aria-hidden` si se considera decorativa redundante (decisión: usar título).
- **Imágenes decorativas marcadas**: [components/miradas/article/ArticleNext.tsx:64](components/miradas/article/ArticleNext.tsx#L64) sin `aria-hidden` aunque tiene `alt=""`. Añadir `aria-hidden`.

### Fase 3 — Deduplicación de helpers (commit 3)

Tres helpers duplicados en 3 archivos cada uno. Extraer a `lib/`:

- **Nuevo `lib/miradas/format-date.ts`**: una sola `formatDate(dateStr, locale?)` que sustituye las 3 copias de:
  - [components/miradas/MiradasGrid.tsx:28-34](components/miradas/MiradasGrid.tsx#L28-L34)
  - [components/miradas/article/ArticleNext.tsx:24-30](components/miradas/article/ArticleNext.tsx#L24-L30)
  - [app/[locale]/(main)/miradas/[cat]/[slug]/page.tsx](app/%5Blocale%5D/%28main%29/miradas/%5Bcat%5D/%5Bslug%5D/page.tsx) (pendiente confirmar línea)
  Importante: aceptar `locale` como parámetro futuro. La actual hardcodea `'es-ES'` — el helper debería recibirlo o leerlo del context.
- **Nuevo `lib/miradas/cover.ts`**: `PLACEHOLDER_COVERS` + `getCover(article, indexOrSlug)`. Sustituir las 3 implementaciones de cover-fallback. Cuidado con la variante de [ArticleNext.tsx:17-22](components/miradas/article/ArticleNext.tsx#L17-L22) que usa hash del slug; mantener esa variante como `getCoverByHash` y la indexada como `getCoverByIndex`.
- Verificación: cards del listado, detail header, y "siguiente artículo" deben renderizar exactamente igual.

### Fase 4 — Type safety (commit 4)

Eliminar las 9 instancias de `any` localizadas (todas en componentes con GSAP+SplitType):

- **`SplitType[]`**: importar `type SplitType from 'split-type'` y tipar los arrays:
  - [components/identidad/IdentidadValores.tsx:45](components/identidad/IdentidadValores.tsx#L45)
  - [components/identidad/IdentidadLiminal.tsx:51](components/identidad/IdentidadLiminal.tsx#L51)
  - [components/capacity/CapacityHeroSequence.tsx:100](components/capacity/CapacityHeroSequence.tsx#L100)
  - [components/miradas/MiradasHero.tsx:53](components/miradas/MiradasHero.tsx#L53)
- **`gsap.core.Timeline`**: tipar los timelines locales:
  - [components/layout/PageCurtain.tsx:62](components/layout/PageCurtain.tsx#L62) — `let loopTl: any = null`
  - [components/capacity/CapacityStatement.tsx](components/capacity/CapacityStatement.tsx) — `let marqueeTw: any = null`
- **ButtonPrimary/Secondary** ([components/ui/ButtonPrimary.tsx:85](components/ui/ButtonPrimary.tsx#L85)): el `as any` del polymorphic forwarding es el patrón estándar (de docs de React) para `as`-prop. **Mantener**, pero añadir comentario `// polymorphic component: see https://...` para que el revisor no lo elimine.
- **`lib/i18n/navigation.ts:61`**: `const href: any = ...` por internals de next-intl. **Mantener** con comentario justificativo.
- Resultado esperado: 0 `any` "casuales" (los 2 documentados quedan como excepción consciente).

### Fase 5 — Optimización rendering (commit 5)

Cambios pequeños con impacto medible:

- **ISR en Miradas**: añadir `export const revalidate = 3600` en [app/[locale]/(main)/miradas/page.tsx](app/%5Blocale%5D/%28main%29/miradas/page.tsx) (listing) y [app/[locale]/(main)/miradas/[cat]/[slug]/page.tsx](app/%5Blocale%5D/%28main%29/miradas/%5Bcat%5D/%5Bslug%5D/page.tsx) (detalle). El listado se rebuilds 1×/h; los artículos al cambiar el contenido. Cuidado: si se ejecuta `dynamicParams = false` está OK porque los slugs son finitos.
- **OG image dinámica**: crear [app/[locale]/(main)/miradas/[cat]/[slug]/opengraph-image.tsx](app/%5Blocale%5D/%28main%29/miradas/%5Bcat%5D/%5Bslug%5D/opengraph-image.tsx) que use el cover real del artículo (via `getMiradaBySlug` → `image`). Para el resto del site, `app/opengraph-image.tsx` (1200×630, brand). Esto cierra el "OG image — no existe" del README.

### Fase 6 — Cierre (commit 6)

- Actualizar `AUDIT_2026-05.md`: marcar cada hallazgo como `aplicado en commit X` o `diferido` con razón.
- Lista de **diferidos** explícitos (con justificación):
  - **CapacityVortex 757 líneas**: split en hooks/subcomponentes es trabajo de ≥1 día. Coste/beneficio depende de si se va a tocar otra vez. Marcar como deuda técnica.
  - **HeroScroll 617L, ContactForm 569L, IdentidadGente 547L**: mismo argumento.
  - **Console.log en `app/api/contact|newsletter|testers/route.ts`**: son stubs que se reemplazan en Sprint 6 al cablear Hubspot. No tocar.
  - **TODO Sprint 4 — Sentry** ([app/[locale]/(main)/error.tsx](app/%5Blocale%5D/%28main%29/error.tsx)): integración real en Sprint 6.
  - **Validación contraste WCAG AA** en `text-fg/40-60` sobre `bg-warm-light`: requiere herramienta de cálculo manual y/o test runner. Deja una sección "TODO contraste" en `AUDIT_2026-05.md`.

### Cierre

- Push de la branch.
- PR a `main` con título `audit: code quality, refactor y optimización 2026-05` y body que resume cada fase con su commit hash.
- Decisión del usuario: squash o merge plano. (Recomendación: merge plano para preservar la traza de fases en `git log`.)
- Actualizar `README.md` → añadir entrada en sprint history o nueva sección "Auditorías" enlazando `AUDIT_2026-05.md`.

## Archivos críticos

- `AUDIT_2026-05.md` (nuevo, raíz)
- `lib/miradas/format-date.ts` (nuevo)
- `lib/miradas/cover.ts` (nuevo)
- `messages/{es,ca,en}/common.json` (nuevas keys aria-*)
- 4 componentes con `SplitType[]` (Fase 4)
- 2 components con `gsap.core.Timeline` (Fase 4)
- 3 componentes Miradas (Fase 3, sustituyen helpers)
- 1 página Miradas detail (Fase 2 alt)
- 5-6 componentes con aria-labels hardcoded (Fase 2)
- 2 páginas Miradas (Fase 5 revalidate)
- 1-2 archivos `opengraph-image.tsx` (Fase 5)

## Verificación entre fases

Después de cada commit:

1. `npm run type-check && npm run lint` — sin errores nuevos. Los warnings preexistentes de `<img>` en `MDXContent.tsx` siguen, alineado con CLAUDE.md.
2. `npm run dev` y smoke test mínimo:
   - `/` (home)
   - `/pensamiento-estrategico` (cualquier capacidad)
   - `/identidad`
   - `/miradas` (listado)
   - `/miradas/design/atomic-design-para-dummies` (un detalle de artículo)
   - `/contacto`
3. Inspección visual: que el cover, el hero, y el AuthorAvatar carguen como antes.
4. **Fase 5 específico**: tras añadir `revalidate`, hacer `npm run build` y comprobar que las páginas Miradas aparecen en el output como `(static)` o `(ISR)` según corresponde.
5. **Fase 5 OG**: `curl -I http://localhost:3000/miradas/<cat>/<slug>/opengraph-image` debería devolver `image/png`.

## Out of scope (no entra en esta auditoría)

- Sprint 6 work (Hubspot wiring, GSC, newsletter provider, `SITE_CONFIG.isProduction` real).
- Tests automáticos: no hay test runner configurado y montar uno excede el alcance.
- Splitting de componentes >500 líneas (deuda diferida explícita).
- Migración de imágenes en MDX a `next/image` (decisión consciente en CLAUDE.md).
