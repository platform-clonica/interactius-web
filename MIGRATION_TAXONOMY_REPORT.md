# Migración Miradas → Taxonomía v2

**Branch**: `feat/miradas-taxonomy-v2`
**Fecha**: 2026-05-05
**Total artículos**: 125

## Resumen ejecutivo

| Métrica | Valor |
|---------|-------|
| Artículos migrados | 125 |
| Categorías madre | 3 |
| Subcategorías | 10 (`user-testing` eliminada por estar vacía editorialmente) |
| Asignaciones por algoritmo | 125 (100% cobertura) |
| Requieren revisión humana | 42 (33%) |
| Redirects 301 generados | 244 |
| URLs en sitemap | 435 |
| Build estático | OK |
| Frontmatters válidos contra Zod | 125 / 125 |

## 1. Distribución final por subcategoría

| Madre | Sub | N |
|-------|-----|---|
| **Pensamiento Estratégico (39)** | `diseno-estrategico` | 19 |
| | `innovacion` | 13 |
| | `futuros` | 5 |
| | `marca` | 2 |
| **Diseño de Experiencias (54)** | `diseno-ux-ui` | 32 |
| | `ux-research` | 16 |
| | `clonica` | 6 |
| **Transformación Cultural (32)** | `ia-aplicada` | 11 |
| | `cultura-organizacional` | 17 |
| | `workshops` | 4 |
| **Total** | | **125** |

Reparto por madre: 31% / 43% / 26%.

## 2. Algoritmo de asignación (resumen)

Reglas de scoring sobre `title` (5/2/1), `description` (2/1/0.5), `tags` (3/2/1) y primeros 2500 chars del body (0.5/0.3/0.2), con bonus +1.5 si la `old_cat` del artículo está en la lista `old_cats` de la sub. Top1 gana; si `top1 − top2 < 1.5` el artículo se marca como **`requires_review`**.

Output del algoritmo:
- 0 fallbacks por old_cat (todos los artículos puntuaron en al menos una sub).
- 67 asignaciones donde la sub no incluye la `old_cat` natural (esperable tras una reorganización taxonómica real — ej. artículos de `research/` que tratan de IA y van a `ia-aplicada`).
- 42 marcados `requires_review`.

Detalle completo en [`scripts/taxonomy_v1.json`](scripts/taxonomy_v1.json) y [`scripts/taxonomy_review.md`](scripts/taxonomy_review.md).

## 3. Artículos que requieren revisión humana (42)

Diferencia top1 − top2 < 1.5 → la asignación es ambigua y necesita criterio editorial. **No se han hecho overrides manuales en esta migración**: todos quedan con la sub propuesta por el algoritmo. Si tras revisar quieres mover alguno, edita el `category:` y `parentCategory:` de su `.mdx` y re-ejecuta `npm run validate:miradas` para confirmar coherencia.

| Slug | Old cat | Sub asignada | Top1 | Top2 sub | Top2 | Δ |
|---|---|---|---|---|---|---|
| `8-tips-para-dise-ar-para-voz-y-sus-limitaciones-7d74dacef8ee` | `design` | `diseno-ux-ui` | 1.8 | `workshops` | 0.5 | 1.3 |
| `arquitectura-de-la-informacion-entender-y-reorganizar` | `design` | `diseno-ux-ui` | 4 | `workshops` | 3.3 | 0.7 |
| `biomimesis-y-diseno` | `design` | `diseno-ux-ui` | 2 | `futuros` | 0.7 | 1.3 |
| `de-disenador-grafico-a-service-design-manager-en-pepsico` | `design` | `cultura-organizacional` | 2.8 | `diseno-ux-ui` | 1.5 | 1.3 |
| `de-ux-designer-a-emprendedor` | `design` | `diseno-ux-ui` | 1.5 | `cultura-organizacional` | 0.3 | 1.2 |
| `del-designops-a-la-accesibilidad-y-la-ia-conversacion-con-raul-luque-ibm` | `design` | `diseno-ux-ui` | 8.1 | `ia-aplicada` | 8 | 0.1 |
| `designer-cual-es-tu-drama` | `design` | `cultura-organizacional` | 2.3 | `innovacion` | 1.7 | 0.6 |
| `diseno-y-desarrollo-5-consejos-para-colaborar-sin-sufrir-en-el-intento` | `design` | `diseno-estrategico` | 2.2 | `diseno-ux-ui` | 2 | 0.2 |
| `innovacion-y-ux-research-en-lidl-plus` | `design` | `innovacion` | 6.2 | `ux-research` | 5.8 | 0.4 |
| `la-ia-en-el-diseno-ux-ui-y-el-papel-del-disenador-en-el-proceso-de-diseno` | `design` | `diseno-ux-ui` | 9.3 | `ia-aplicada` | 8.7 | 0.6 |
| `manifiesto-rebel-el-archivo-vivo-de-voces-que-piden-un-diseno-mas-humano` | `design` | `cultura-organizacional` | 1.6 | `diseno-ux-ui` | 1.5 | 0.1 |
| `mobile-first-la-clave-71497be8f0` | `design` | `diseno-ux-ui` | 1.7 | `ux-research` | 0.3 | 1.4 |
| `playfulness-ux-disenar-sistemas-ludico-interactivos` | `design` | `diseno-ux-ui` | 1.5 | `innovacion` | 1 | 0.5 |
| `quien-disena-a-quien-reflexiones-sobre-ux-automatismos-y-el-futuro-del-diseno` | `design` | `diseno-ux-ui` | 2 | `futuros` | 1.4 | 0.6 |
| `situated-play-design-2` | `design` | `diseno-estrategico` | 2 | `clonica` | 2 | 0 |
| `ux-research-diseno-estrategico-global` | `design` | `diseno-ux-ui` | 4.5 | `diseno-estrategico` | 3.8 | 0.7 |
| `behavioral-insights` | `estrategia` | `innovacion` | 4.7 | `diseno-estrategico` | 3.5 | 1.2 |
| `la-transformaci-n-digital-para-la-supervivencia-de-las-empresas-a388c3201c95` | `estrategia` | `diseno-estrategico` | 3.5 | `workshops` | 2.5 | 1 |
| `mkt4-el-futuro-es-figital` | `estrategia` | `futuros` | 4.7 | `diseno-estrategico` | 3.5 | 1.2 |
| `nuestro-decalogo-ecommerce-b2b` | `estrategia` | `diseno-estrategico` | 3.5 | `marca` | 2.3 | 1.2 |
| `planning-poker` | `estrategia` | `diseno-estrategico` | 1.5 | `innovacion` | 1.5 | 0 |
| `que-es-la-economia-del-diseno-donde-impacta-y-como-podemos-medir-el-roi` | `estrategia` | `futuros` | 3 | `innovacion` | 2.2 | 0.8 |
| `de-compras-con-tu-subconsciente` | `research` | `diseno-estrategico` | 2.2 | `ux-research` | 1.5 | 0.7 |
| `entrenar-el-ojo-en-la-cultura-digital-ae9debee1673` | `research` | `cultura-organizacional` | 2.8 | `ux-research` | 1.8 | 1 |
| `explorar-antes-de-despegar-el-discovery-como-brujula-en-la-complejidad-digital-de-air-europa` | `research` | `innovacion` | 4 | `diseno-ux-ui` | 3.5 | 0.5 |
| `mas-alla-del-diseno-bonito-volver-al-proposito` | `research` | `ux-research` | 4.5 | `ia-aplicada` | 3.3 | 1.2 |
| `nada-es-original-el-poder-del-benchmarking` | `research` | `diseno-estrategico` | 2 | `clonica` | 2 | 0 |
| `pensar-y-disenar-experiencias-con-actitud-zeta` | `research` | `diseno-estrategico` | 2 | `ux-research` | 2 | 0 |
| `trabajar-con-productos-digitales-cuando-tienes-mas-de-40-anos` | `research` | `ux-research` | 2.5 | `clonica` | 2 | 0.5 |
| `un-storyboard-heroico-327be6b2c945` | `research` | `ux-research` | 1.9 | `cultura-organizacional` | 0.6 | 1.3 |
| `3-temas-sobre-ux-que-vas-a-necesitar-recuperar-este-2023` | `ux` | `innovacion` | 1.2 | `diseno-ux-ui` | 1.1 | 0.1 |
| `buscando-el-match-entre-administracion-publica-y-ux` | `ux` | `cultura-organizacional` | 3.1 | `diseno-estrategico` | 2 | 1.1 |
| `del-problema-al-poder-del-storytelling-lecciones-de-chema-miranda` | `ux` | `diseno-estrategico` | 2 | `cultura-organizacional` | 1.2 | 0.8 |
| `diseno-ux-como-servicio` | `ux` | `cultura-organizacional` | 1.1 | `ux-research` | 0.6 | 0.5 |
| `el-diseno-ux-en-el-metaverso` | `ux` | `diseno-estrategico` | 2 | `innovacion` | 1.5 | 0.5 |
| `el-sindrome-de-la-hoja-en-blanco` | `ux` | `innovacion` | 1 | `workshops` | 0.3 | 0.7 |
| `hip-hop-origenes-y-user-experience` | `ux` | `cultura-organizacional` | 1 | `ux-research` | 0.8 | 0.2 |
| `innovacion-en-el-sector-cultural-como-una-estrategia-digital-y-la-ux-ayudan-a-conectar-con-la-audiencia` | `ux` | `innovacion` | 5 | `cultura-organizacional` | 4.3 | 0.7 |
| `las-5-claves-sobre-ux-que-necesitas-saber` | `ux` | `diseno-estrategico` | 2.2 | `clonica` | 2 | 0.2 |
| `que-es-una-auditoria-ux-como-hacerla-y-que-beneficios-proporciona` | `ux` | `diseno-estrategico` | 2 | `clonica` | 2 | 0 |
| `ux-o-meter-03-google-meet-vs-zoom-vs-microsoft-teams` | `ux` | `cultura-organizacional` | 2.6 | `ux-research` | 1.3 | 1.3 |
| `ux-o-meter-netflix-vs-hbo-vs-prime-video` | `ux` | `ux-research` | 0.8 | `diseno-estrategico` | 0 | 0.8 |

## 4. Redirects 301

Generados con [`scripts/generate-redirects-v2.mjs`](scripts/generate-redirects-v2.mjs) desde [`scripts/legacy-redirects-snapshot.mjs`](scripts/legacy-redirects-snapshot.mjs) + [`scripts/taxonomy_v1.json`](scripts/taxonomy_v1.json). Output en [`config/miradas-redirects.mjs`](config/miradas-redirects.mjs), importado en `next.config.mjs`.

| Bucket | N | Significado |
|--------|---|-------------|
| `wp_legacy` | 65 | URL antigua de WordPress (ej. `/design/<slug>`) → `/miradas/<sub-v2>/<slug>` directo |
| `wp_legacy_orphan` | 42 | URL WP cuyo slug ya no existe en taxonomy → `/miradas/` listing global |
| `v1_to_v2` | 121 | URL de la migración v1 (`/miradas/<old-cat>/<slug>`) → sub v2 nueva |
| `listing_old` | 7 | Listing cat vieja (`/miradas/design`) → sub más afín |
| `corporate` | 9 | No-Miradas (`/blog`, `/sobre-nosotros`, etc.) — preservados |
| **Total único** | **244** | |

**Comportamiento**:
- URL vieja **sin** trailing slash → 1 salto al destino canónico v2.
- URL vieja **con** trailing slash → 2 saltos (Next.js normaliza primero, luego redirige). Dentro de los chains aceptables por Google.
- Verificado: cero loops, cero chains de 3+ saltos.

### Listings: cat vieja → sub afín

| Cat vieja | Sub destino |
|-----------|-------------|
| `design` | `diseno-ux-ui` |
| `diseno-inclusivo` | `diseno-ux-ui` |
| `ux` | `diseno-ux-ui` |
| `research` | `ux-research` |
| `ia` | `ia-aplicada` |
| `estrategia` | `innovacion` |
| `workshops` | `workshops` (mismo slug, cambia la madre) |

## 5. Cambios URL respecto a v1

### Estructura

| Nivel | v1 | v2 |
|-------|----|----|
| Listing global | `/miradas/` | `/miradas/` (igual) |
| Listing categoría | `/miradas/<old-cat>/` | `/miradas/<sub>/` o `/miradas/<madre>/` (sub o madre) |
| Detalle artículo | `/miradas/<old-cat>/<slug>/` | `/miradas/<sub>/<slug>/` |
| **Localización** | Slugs compartidos en los 3 idiomas | Slugs **localizados** por idioma (decisión D) |

### Slugs localizados

| Madre canónica (ES) | CA | EN |
|---------------------|----|----|
| `pensamiento-estrategico` | `pensament-estrategic` | `strategic-thinking` |
| `diseno-experiencias` | `disseny-experiencies` | `experience-design` |
| `transformacion-cultural` | `transformacio-cultural` | `cultural-transformation` |

| Sub canónica (ES) | CA | EN |
|-------------------|----|----|
| `diseno-estrategico` | `disseny-estrategic` | `strategic-design` |
| `innovacion` | `innovacio` | `innovation` |
| `futuros` | `futurs` | `futures` |
| `marca` | `marca` | `brand` |
| `diseno-ux-ui` | `disseny-ux-ui` | `ux-ui-design` |
| `ux-research` | `ux-research` | `ux-research` |
| `clonica` | `clonica` | `clonica` |
| `ia-aplicada` | `ia-aplicada` | `applied-ai` |
| `cultura-organizacional` | `cultura-organitzacional` | `organizational-culture` |
| `workshops` | `workshops` | `workshops` |

Mapeo completo en [`lib/miradas/i18n-routing.ts`](lib/miradas/i18n-routing.ts).

### Sitemap

| Tipo | URLs |
|------|------|
| Estáticas (home, capacidades, identidad, contacto, miradas) | 21 |
| Listings de madre × 3 locales | 9 |
| Listings de sub × 3 locales | 30 |
| Artículos × 3 locales | 375 |
| **Total** | **435** |

## 6. Pendientes humanos antes de mergear a `main`

- [ ] **Revisar 42 `requires_review`** (sección 3) y aplicar overrides manuales si la sub asignada por el algoritmo no es la editorialmente correcta. Editar `category:` + `parentCategory:` en el frontmatter del `.mdx` correspondiente.
- [ ] **Revisar copys editoriales** del listing de cada madre (3) y cada sub (10):
  - Texto introductorio bajo el H1 (actualmente fallback genérico "Reflexiones desde el territorio de…").
  - Hero específico si quieres uno (ahora es solo H1 + line).
- [ ] **Confirmar etiquetas de display CA/EN** en [`lib/miradas/i18n-routing.ts`](lib/miradas/i18n-routing.ts) (`PARENT_DISPLAY`, `SUB_DISPLAY`). Las traducciones actuales son una primera pasada — convendría revisión por hablante nativo.
- [ ] **Confirmar etiquetas de tags i18n** en `messages/{es,ca,en}/miradas.json` (namespace `miradas.grid.categories.<tag>`). Algunos tags pueden faltar.
- [ ] **Validar redirects en staging con `curl`**:
  ```bash
  for url in /design/atomic-design-para-dummies /miradas/design/atomic-design-para-dummies /miradas/ux /blog; do
    curl -sI -o /dev/null -w "%{http_code} %{redirect_url}\n" "$STAGING$url"
  done
  ```
- [ ] **`user-testing`**: la sub está fuera de la taxonomía. Si después se quiere reactivar, añadir su entrada en [`lib/miradas/frontmatter.schema.ts`](lib/miradas/frontmatter.schema.ts) (`MIRADAS_SUBCATEGORIES`, `SUB_TO_PARENT`, `SUBS_BY_PARENT`), `lib/miradas/i18n-routing.ts` (`SUB_SLUG_BY_LOCALE`, `SUB_DISPLAY`) y reintroducir las reglas en [`scripts/taxonomize-miradas.mjs`](scripts/taxonomize-miradas.mjs).
- [ ] **OG images dinámicas**: actualmente el cover del frontmatter (`image:`) sigue siendo path estático `/miradas-assets/<slug>/<file>` (decisión B). Si en el futuro se quiere endpoint dinámico OG, crear `app/[locale]/(main)/miradas/[parentOrSub]/[slug]/opengraph-image.tsx` (alcance Tarea no incluida en esta migración).
- [ ] **Submitir nuevo sitemap a Google Search Console** tras deploy a producción.
- [ ] **Test 404s de URLs viejas con trailing slash** (caso 2 saltos): comprobar manualmente que `/design/foo/` → `/miradas/diseno-ux-ui/foo` (vía 2 redirects) y no termina en error.
- [ ] **Auditoría de `requires_review` con bajo score**: artículos con `top1 < 2` están casi al azar (sin keywords claros). Casos: `de-ux-designer-a-emprendedor`, `el-sindrome-de-la-hoja-en-blanco`, `hip-hop-origenes-y-user-experience`, `diseno-ux-como-servicio`, `ux-o-meter-netflix-vs-hbo-vs-prime-video`. Revisión editorial recomendada.

## 7. Comandos clave

```bash
# Validar todos los frontmatters contra el schema Zod
npm run validate:miradas

# Regenerar la asignación si se ajustan reglas
node scripts/taxonomize-miradas.mjs

# Aplicar (mover archivos + reescribir frontmatters) — IDEMPOTENTE
node scripts/apply-taxonomy-v2.mjs --dry-run
node scripts/apply-taxonomy-v2.mjs

# Regenerar el array de redirects v2 desde el snapshot legacy
node scripts/generate-redirects-v2.mjs

# Build local
npm run build

# Smoke test routes (con dev arriba)
curl -sI -o /dev/null -w "%{http_code}\n" http://localhost:3000/miradas/diseno-ux-ui/atomic-design-para-dummies
```
