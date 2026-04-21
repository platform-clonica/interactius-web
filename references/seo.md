# Auditoría de SEO técnico

Objetivo: asegurar que la web es rastreable, indexable y bien presentada en buscadores y redes sociales. Centrado en SEO técnico, no en estrategia de contenidos.

## Consideración importante sobre SPAs

React/Vue/Angular renderizan en el cliente por defecto. Esto tiene implicaciones enormes para SEO:

- Googlebot indexa JS, pero con limitaciones y retrasos
- Otros crawlers (Bing, DuckDuckGo, redes sociales para previews) tienen peor soporte de JS
- Sin SSR/SSG, los social previews (Twitter, LinkedIn, WhatsApp) suelen romperse

**Primera pregunta clave:** ¿el proyecto usa SSR, SSG o renderizado cliente puro?

- Next.js, Nuxt, Angular Universal, SvelteKit → SSR/SSG disponibles
- CRA, Vite + React/Vue vanilla → cliente puro por defecto

Si es **cliente puro y la web es pública**, esto ya es un problema de alto a crítico.

## Herramientas a ejecutar

### 1. Lighthouse (categoría SEO)

```bash
npx --yes lighthouse http://localhost:PUERTO \
  --only-categories=seo \
  --output=json --output-path=./lighthouse-seo.json
```

### 2. Inspección del HTML renderizado

Si hay build servible, captura el HTML que sirve el servidor:
```bash
curl -s http://localhost:PUERTO/ > rendered.html
# ¿Qué hay dentro del <body> en el HTML inicial?
# Si es básicamente <div id="root"></div>, es SPA cliente puro
```

### 3. Estructura de archivos estáticos

```bash
# ¿Existe robots.txt?
ls public/robots.txt public/sitemap.xml 2>/dev/null

# ¿Hay manifest.json?
ls public/manifest.json public/site.webmanifest 2>/dev/null
```

## Chequeos específicos

### Meta tags esenciales

Busca cómo se gestionan. En React típicamente con `react-helmet-async`, `next/head`, o hooks propios. En Vue con `@vueuse/head` o `vue-meta`. En Angular con `Meta` y `Title` services.

Comprobar que cada ruta tiene:
- `<title>` único y descriptivo (50-60 caracteres)
- `<meta name="description">` (150-160 caracteres)
- `<meta name="viewport" content="width=device-width, initial-scale=1">`
- `<html lang="...">` con idioma correcto

```bash
# Títulos en código
grep -rn "Helmet\|useHead\|title:" src/ --include="*.tsx" --include="*.ts" --include="*.vue"
```

### Open Graph y Twitter Cards

Para previsualizaciones en redes:
```html
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta property="og:url" content="..." />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

### Canonical URLs

```html
<link rel="canonical" href="https://ejemplo.com/ruta" />
```
Importante para evitar contenido duplicado.

### Sitemap.xml

- ¿Existe?
- ¿Se genera dinámicamente o es estático?
- ¿Incluye todas las URLs públicas?
- ¿Está referenciado en robots.txt?

### Robots.txt

```
User-agent: *
Allow: /
Sitemap: https://ejemplo.com/sitemap.xml
```

Revisa que no esté bloqueando accidentalmente rutas públicas (`Disallow: /` en producción es un error fatal).

### Structured data (JSON-LD)

```bash
grep -rn "application/ld+json\|schema.org" src/ public/
```

Útil para: artículos, productos, recetas, eventos, organizaciones, breadcrumbs.

### URLs limpias

- ¿Se usa hash routing (`/#/ruta`)? → mal para SEO
- ¿Se usan query params donde deberían ser paths?
- ¿URLs descriptivas vs IDs crudos?

```bash
# Detectar hash routing
grep -rn "createHashRouter\|HashRouter" src/
```

### Imágenes SEO-friendly

- Nombres descriptivos (no `IMG_1234.jpg`)
- `alt` presente (solapa con accesibilidad)
- Formatos modernos (WebP, AVIF) con fallback
- `width` y `height` especificados (evita CLS y mejora indexación)

### Renderizado del HTML inicial

Sirve la página y comprueba con `curl` o `wget` qué llega al cliente sin JS. Si el `<body>` está prácticamente vacío y toda la web se hace con JS:

- Comprueba si hay configuración de prerender (`vite-plugin-prerender`, `react-snap`, etc.)
- Evalúa migrar a SSR/SSG
- Al menos asegurar que los meta tags se inyectan server-side

### Internacionalización (si aplica)

- `<html lang>` dinámico por idioma
- `hreflang` en links o headers
- URLs distintas por idioma (`/es/`, `/en/`) o dominios distintos

### Rendimiento móvil

Google indexa con mobile-first. Solapa con la auditoría de rendimiento:
- ¿LCP < 2.5s en móvil?
- ¿Diseño responsive sin scroll horizontal?
- ¿Tamaño de tap targets adecuado (min 48x48px)?

### HTTPS y configuración

- ¿La web se sirve por HTTPS? (revisar si hay menciones de `http://` en código)
- ¿Hay redirects de www / no-www coherentes?
- ¿Headers de seguridad (CSP, X-Content-Type-Options)?

## Qué reportar

Agrupa en:
1. **Renderizado e indexabilidad** (SSR/SSG, HTML inicial, hash routing)
2. **Meta tags** (title, description, OG, Twitter)
3. **Estructura** (sitemap, robots, canonical)
4. **Contenido semántico** (headings, structured data, lang)
5. **URLs y arquitectura**

## Umbrales de severidad (SEO)

| Condición | Severidad |
|---|---|
| Web pública sin SSR/SSG ni prerender (body vacío al cargar) | 🔴 Crítico |
| `Disallow: /` en robots.txt de producción | 🔴 Crítico |
| Falta de `<title>` o `<meta description>` en rutas indexables | 🔴 Crítico |
| Hash routing en web pública | 🟠 Alto |
| Falta de sitemap.xml | 🟠 Alto |
| Sin Open Graph tags (rompe previsualizaciones sociales) | 🟠 Alto |
| Falta de `<html lang>` | 🟠 Alto |
| Sin canonical URLs (riesgo de contenido duplicado) | 🟡 Medio |
| Sin structured data cuando aplica (producto, artículo...) | 🟡 Medio |
| Imágenes con nombres no descriptivos | 🟢 Bajo |
| Falta de favicon / touch icons | 🟢 Bajo |
