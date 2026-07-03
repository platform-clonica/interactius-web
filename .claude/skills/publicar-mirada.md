---
name: publicar-mirada
description: Publica un artículo nuevo en la sección Miradas de interactius-web a partir de un Google Doc (+ imágenes). Extrae metadata, crea el MDX ES, coloca/optimiza imágenes, traduce a CA/EN, valida SEO y despliega por PRs (staging → main). Úsala cuando el usuario quiera "subir/publicar/añadir un artículo a Miradas" y pase un enlace de Google Doc/Drive. Detalle largo en docs/CONTRIBUTING-MIRADAS.md.
---

# Publicar un artículo en Miradas

Runbook end-to-end. La **fuente canónica es ES**; CA/EN son traducciones. El render
(grid 12-col, `<PullQuote>`, `<ImageWithCaption>`, `<Video>` con controles) y el SEO
(canonical, hreflang, JSON-LD Article con image/keywords/inLanguage/publisher, og, sitemap)
ya están resueltos en código: **no hay que tocar componentes** para un alta normal.

Fondo y taxonomía completa: `docs/CONTRIBUTING-MIRADAS.md`. Este archivo es el procedimiento.

## 0. Leer el Doc y extraer

Con el `fileId` del Doc → `mcp__claude_ai_Google_Drive__read_file_content`. Extrae:
`title`, fecha → `publishedAt (YYYY-MM-DD)`, autor → **nombre de pila** (`author`),
`Meta Description` → `description`, categoría **madre**, `Etiquetas`, y los marcadores
`[img -> archivo.webp]` / `[video -> archivo.mp4]`. **Excluye** la sección "Post Linkedin".

## 1. Decidir con el usuario (AskUserQuestion)

- **Subcategoría** (carpeta + URL): el Doc suele dar solo la madre. Elige la sub por contenido.
  Mapa madre→subs y slugs localizados: `lib/miradas/i18n-routing.ts`. Si dudas, pregunta.
- **Slug** (nombre de archivo + URL, invariante): `[a-z0-9-]`, legible, con keyword. Verifica que
  no exista: `ls content/miradas/*/*/<slug>.mdx`.
- **Tags**: análisis de contenido vs inventario existente (§ Tags del CONTRIBUTING). Saca el
  inventario, **reutiliza** tags existentes que expresen el mismo concepto (agrupan en el filtro
  UI, que es igualdad exacta de string). Formato minúsculas-con-guiones, sin tildes/espacios.
  Propón la lista final.
- **Traducción**: CA+EN ahora o solo ES.
- **Fecha**: por defecto la del Doc; ojo si es **futura** (no hay filtro por fecha: se publica igual).

## 2. Crear el MDX ES — `content/miradas/es/<sub>/<slug>.mdx`

Frontmatter (validado por Zod, ver `lib/miradas/frontmatter.schema.ts`):
```yaml
---
title: ...
description: '...'          # SIEMPRE entre comillas: si lleva ':' rompe el YAML
publishedAt: 'YYYY-MM-DD'
author: Nombre              # debe existir en components/miradas/AuthorAvatar.tsx (si no, avatar = inicial)
category: <sub>
parentCategory: <madre>     # = SUB_TO_PARENT[category]
slug: <slug>
image: /miradas-assets/<slug>/<file>.webp   # el <slug> del path debe coincidir
tags: [ ... ]
---
```
- **SEO description ≤ 160 caracteres** (si no, se trunca en el SERP; el validador avisa). Reescríbela
  si el Doc trae una más larga, conservando keyword + marca "Interactius".
- Cuerpo: **no repitas el título** como `#`. `##` secciones, `###` subsecciones. Citas
  entrecomilladas del Doc → `<PullQuote>…</PullQuote>`. Menciones a Clónica → enlaza `https://clonica.io/`.
  Imágenes de cuerpo → `<ImageWithCaption src alt caption />`. Vídeo → `<Video src poster caption />`.

## 3. Imágenes — `public/miradas-assets/<slug>/`

La carpeta/archivo de Drive normalmente **no es público** → `curl` devuelve HTML de login, y
bajar por MCP en base64 es demasiado pesado para el contexto. Pide al usuario que **suelte las
imágenes en la carpeta** (o que las haga públicas para bajarlas por `curl`). Verifica:
```bash
file public/miradas-assets/<slug>/*.webp   # "Web/P image", no "HTML document"
```
**Optimiza la portada** (suelen venir en 4K/varios MB) a 1920px con `sharp`:
```bash
node -e 'const s=require("sharp"),f=process.argv[1];s(f).resize({width:1920,withoutEnlargement:true}).webp({quality:82}).toBuffer().then(b=>require("fs").writeFileSync(f,b)).then(()=>s(f).metadata().then(m=>console.log(m.width+"x"+m.height,require("fs").statSync(f).size)))' public/miradas-assets/<slug>/<cover>.webp
```
Vídeos: comprime con ffmpeg si pesan (no hay ffmpeg/brew → `ffmpeg-static` en /tmp: `cd /tmp && npm i ffmpeg-static`).

## 4. Validar

```bash
npm run validate:miradas -- --slug=<slug>
```
Debe salir `✓ N/N válidos`. Los **errores** rompen (imagen inexistente, schema, path). Los
**avisos** acotados a tu slug: resuélvelos (description >160, `author` fuera de AuthorAvatar).

## 5. Traducir CA/EN (si aplica)

```bash
export ANTHROPIC_API_KEY=$(grep -E '^ANTHROPIC_API_KEY=' .env.local | head -1 | cut -d= -f2-)
npm run translate:miradas -- --slug=<slug>
```
Genera `content/miradas/{ca,en}/<sub>/<slug>.mdx` con `localizedSlug`, `translatedBy: ai`, banner IA.
**Revisa `localizedSlug`** (corrige hibridaciones ES/CA, p.ej. "claredad"→"claredat"). `tags` y `description`
se heredan/traducen del ES; re-valida y verifica que las descriptions CA/EN también sean ≤160.

## 6. Verificar en local

```bash
npm run type-check   # solo si tocaste código
rm -rf .next && npm run dev -- -p 3137   # en background; curl con --retry
```
Comprueba **200** en los 3 idiomas (¡el segmento EN es `thoughts`, no `miradas`!):
- ES `/miradas/<sub>/<slug>` · CA `/ca/mirades/<sub-ca>/<localizedSlug-ca>` · EN `/en/thoughts/<sub-en>/<localizedSlug-en>`

SEO a verificar en el HTML: el `<script type="application/ld+json">` Article incluye `"image"`
(URL absoluta), `keywords`, `inLanguage`, `publisher`; la cabecera (cover) carga; `og:image` presente.

## 7. Release por PRs

```bash
git checkout -b content/miradas-<slug> origin/main   # rama de contenido limpia
git add content/miradas public/miradas-assets/<slug>
git commit -m "content(miradas): nuevo artículo <slug> en <sub> (ES/CA/EN)"
git push -u origin content/miradas-<slug>
gh pr create --base staging ... && gh pr merge --merge   # → QA en staging.interactius.com
gh pr create --base main --head staging ... && gh pr merge --merge   # → producción (confirmar antes)
```
Tras cada merge, **sondea el deploy** (Netlify, ~2-4 min) hasta `200` con la description nueva
(background loop con `sleep`, no `sleep` en foreground). Verifica que sale en el listado de la sub.

**Gotchas de git**: el credential helper puede apuntar a un `gh` viejo en `/tmp`; si `git push`
falla, fija el helper local: `git config --local "credential.https://github.com.helper" ""`
y `git config --local --add "credential.https://github.com.helper" "!$(which gh) auth git-credential"`.
El `gh` real suele estar en `~/.local/bin/gh`.

## Checklist

- [ ] MDX ES creado; título no repetido; PullQuotes; Clónica enlazada; "Post Linkedin" fuera
- [ ] description ≤160 (ES/CA/EN); author en AuthorAvatar; description entre comillas
- [ ] Imágenes en la carpeta (webp reales); cover optimizado a 1920px
- [ ] `validate:miradas --slug=<slug>` → ✓ sin errores ni avisos
- [ ] Traducción CA/EN + `localizedSlug` revisado + re-validado
- [ ] Render 200 ES/CA/EN (EN = `thoughts`); JSON-LD con `image`; cover carga
- [ ] Commit → PR staging → QA → PR main → deploy verificado
