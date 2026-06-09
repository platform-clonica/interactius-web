# Cómo subir un artículo a Miradas

Proceso paso a paso para publicar un artículo nuevo en la sección **Miradas**.
Pensado para repetirse en cada alta. La fuente canónica es siempre el **español (ES)**;
catalán (CA) e inglés (EN) son traducciones opcionales que se generan aparte.

> Referencia de arquitectura: ver `CLAUDE.md` § _Content (Miradas)_ y los archivos
> `lib/miradas/frontmatter.schema.ts`, `lib/miradas/i18n-routing.ts`,
> `lib/content/miradas.ts`.

---

## 0. Qué necesitas del autor

Normalmente llega un **Google Doc** + una carpeta de **imágenes** (Drive). Del doc se
extrae:

- **Título** → `title`
- **Fecha de publicación** → `publishedAt` (formato `YYYY-MM-DD`)
- **Autor** (solo nombre de pila: `María`, `Elena`, `Lucho`…) → `author`
- **Meta description** (SEO) → `description`
- **Categoría madre** (Pensamiento Estratégico / Diseño de Experiencias / Transformación Cultural)
- **Etiquetas** → `tags`
- **Marcadores de imagen/vídeo** en el cuerpo, del tipo `[img -> nombre.webp]`

⚠️ El doc suele indicar solo la **categoría madre**. Hay que decidir la **subcategoría**
concreta (es la carpeta y el segmento de URL). Si las etiquetas son ambiguas, pregunta al autor.

---

## 1. Decidir taxonomía y slug

### Subcategorías válidas (carpeta) → madre

| Subcategoría (carpeta / `category`) | Madre (`parentCategory`) |
|---|---|
| `diseno-estrategico`, `innovacion`, `futuros`, `marca` | `pensamiento-estrategico` |
| `diseno-ux-ui`, `ux-research`, `clonica` | `diseno-experiencias` |
| `ia-aplicada`, `cultura-organizacional`, `workshops` | `transformacion-cultural` |

Fuente única de verdad: `lib/miradas/frontmatter.schema.ts` (`SUB_TO_PARENT`).

### Slug

- Solo `[a-zA-Z0-9_.-]`, en minúsculas, con guiones. Legible y con keyword (SEO).
- **Es invariante**: el nombre del archivo `.mdx` es el mismo en ES/CA/EN. En CA/EN la URL
  usa un `localizedSlug` aparte (lo genera el script de traducción), pero el archivo se llama
  siempre `<slug-es>.mdx`.

### Tags — análisis de contenido (paso obligatorio)

Los tags **no son libres**: son un filtro UI client-side que agrupa artículos por igualdad
**exacta** de string (sensible a mayúsculas/espacios/tildes) y son **invariantes** (se leen solo
del frontmatter ES; CA/EN los heredan). Por eso, antes de inventar tags nuevos hay que
**analizar el contenido del artículo y contrastarlo con los tags ya existentes**:

1. **Lee el artículo** e identifica 3-5 temas/conceptos centrales.
2. **Saca el inventario de tags existentes** y su frecuencia:
   ```bash
   for f in content/miradas/es/*/*.mdx; do
     awk '/^tags:/{t=1;next} t&&/^[a-zA-Z]/{t=0} t&&/^[[:space:]]*-/{sub(/^[[:space:]]*-[[:space:]]*/,"");print}' "$f"
   done | sed 's/^"//;s/"$//' | sort | uniq -c | sort -rn
   ```
3. **Reutiliza un tag existente siempre que exprese el mismo concepto** (así el artículo agrupa
   en el filtro). Solo crea un tag nuevo si ningún existente encaja.
4. **Formato:** minúsculas, con guiones, sin tildes ni espacios (`product-design`,
   `diseno-estrategico`, `branding`). La UI muestra el tag reemplazando `-` por espacio.
5. Propón la lista final al autor/a antes de fijarla.

---

## 2. Crear el archivo MDX (ES)

Ruta: `content/miradas/es/<subcategoria>/<slug>.mdx`

Frontmatter (validado por Zod — ver schema):

```yaml
---
title: Título del artículo
description: Meta description para SEO.
publishedAt: '2026-05-20'
modifiedAt: '2026-06-01'        # opcional
author: María                   # solo nombre de pila
category: diseno-estrategico    # una de las 10 subcategorías
parentCategory: pensamiento-estrategico   # debe casar con SUB_TO_PARENT[category]
slug: mi-slug-del-articulo      # = nombre del archivo
image: /miradas-assets/mi-slug-del-articulo/header.webp   # opcional (cover + og:image)
tags:                           # opcional. minúsculas-con-guiones, sin tildes ni espacios.
  - estrategias-de-marca        # reutiliza tags existentes (ver § Tags) para que agrupen
  - diseno-estrategico
---
```

### Reglas del cuerpo

- **No repitas el título** como `#` al principio: la página lo pinta aparte. El cuerpo
  arranca con el párrafo de entrada.
- Markdown normal. Jerarquía: `##` para secciones (serif grande), `###` para subsecciones.
- Componentes MDX disponibles (definidos en `components/miradas/MDXContent.tsx`):
  - `<ImageWithCaption src="/miradas-assets/<slug>/<file>" alt="..." caption="..." />`
  - `<PullQuote>Cita destacada.</PullQuote>` — úsalo para las citas entrecomilladas del doc.
  - `<Video src="/ruta/video.mp4" poster="/ruta/poster.webp" caption="..." />` — reproductor con
    **controles** (play, barra de tiempo, volumen/audio). `poster` y `caption` son opcionales;
    un `poster` vacío o en blanco se ignora. El archivo `.mp4` debe existir en `public/` (no se
    descarga solo). Comprime los vídeos antes de subirlos: un `.mp4` de decenas de MB carga lento.
- Enlaces externos: markdown normal `[texto](https://...)` (se abren en pestaña nueva solos).
- **Vídeo del cuerpo:** usa `<Video>`. Si el doc trae un marcador `[video -> archivo.mp4]`,
  el archivo debe existir en `public/` (no se descarga solo); si no está, pídelo o consensúa.

---

## 3. Imágenes

Carpeta: `public/miradas-assets/<slug>/` (el `<slug>` del path **debe** coincidir con el del artículo).

- La **portada** va en `image:` del frontmatter (sirve de cover y de `og:image`). No se incluye
  en el cuerpo: la cabecera la pinta la página.
- Las del cuerpo se referencian con `<ImageWithCaption>` o `![alt](...)`.
- Extensiones válidas: `webp, jpg, jpeg, png, gif, svg`.

### Bajar imágenes desde Drive

La carpeta de Drive suele **no ser pública**, así que `curl` a `drive.google.com/uc?...`
devuelve una página HTML de login (no el archivo). Dos vías fiables:

1. **Manual (lo más simple):** descarga las imágenes del Drive y déjalas en la carpeta destino
   con los nombres exactos que referencia el `.mdx`.
2. **Carpeta pública temporal:** el autor pone la carpeta en "cualquiera con el enlace",
   se descargan por `curl`, y luego revierte el permiso.

Verifica siempre que son imágenes reales (no HTML de Drive):

```bash
file public/miradas-assets/<slug>/*.webp   # debe decir "Web/P image", no "HTML document"
```

### Optimizar el cover (importante)

Las cabeceras suelen venir en 4K y varios MB. Una portada así penaliza el LCP y puede superar
el límite de `og:image` (~5MB). Reescala a **1920px de ancho** y recomprime webp con `sharp`
(ya está instalado por Next):

```bash
node -e '
const sharp = require("sharp");
const f = process.argv[1];
sharp(f).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 82 })
  .toBuffer().then(b => require("fs").writeFileSync(f, b))
  .then(() => sharp(f).metadata().then(m => console.log(m.width + "x" + m.height)));
' public/miradas-assets/<slug>/header.webp
```

(Caso real: una cabecera 3840×2160 de 6.5MB bajó a 1920×1080 / ~285KB sin pérdida visible.)

---

## 4. Validar

```bash
npm run validate:miradas
```

Comprueba el frontmatter contra el schema Zod **y** la coherencia con la ruta:
carpeta = `category`, `parentCategory` correcta, nombre de archivo = `slug`, y que el `<slug>`
embebido en `image:` coincide. Debe salir `✓ N/N válidos`.

---

## 5. (Opcional) Traducir a CA / EN

El ES ya publica e indexa solo. Las URLs CA/EN resuelven igualmente pero, **sin traducción real**,
sirven el contenido ES con `noindex` + `canonical → ES` (no contaminan SEO ni entran en el
sitemap de esa locale). Traduce cuando quieras versión indexable.

```bash
# Requiere ANTHROPIC_API_KEY (ponla en .env.local, que está gitignoreado)
npm run translate:miradas -- --slug=<slug> --dry-run     # previsualiza
npm run translate:miradas -- --slug=<slug>               # genera CA + EN
```

Genera `content/miradas/{ca,en}/<subcategoria>/<slug>.mdx` con `localizedSlug`, `translatedBy: ai`
y `translatedAt`. La página muestra automáticamente el banner "traducido por IA".
Otras opciones: `--locale=ca|en|all`, `--force` (re-traducir), `--model=<id>`.

Tras traducir, vuelve a correr `npm run validate:miradas`.

---

## 6. Comprobar en local y publicar

```bash
npm run dev
```

- ES:  `http://localhost:3000/miradas/<subcategoria>/<slug>`
- EN:  `http://localhost:3000/en/thoughts/<subcategoria-localizada>/<localizedSlug>`
- CA:  `http://localhost:3000/ca/mirades/<subcategoria-localizada>/<localizedSlug>`

OJO con el **segmento de sección** por locale: ES `miradas`, CA `mirades`, **EN `thoughts`**
(no `miradas`). Las subcategorías localizadas están en `lib/miradas/i18n-routing.ts`
(p. ej. `diseno-estrategico` → EN `strategic-design`, CA `disseny-estrategic`). Una URL EN
con el segmento equivocado responde 307 (redirect), no 200.

Cuando esté correcto:

```bash
git checkout -b content/miradas-<slug>
git add content/miradas public/miradas-assets/<slug>
git commit -m "content(miradas): nuevo artículo <slug> en <subcategoria>"
```

Flujo de release del repo: PR a `staging` → QA en `staging.interactius.com` → PR `staging` → `main`
(autodeploy a producción). **No** hotfix directo a `main`.

---

## Checklist rápido

- [ ] `.mdx` en `content/miradas/es/<subcategoria>/<slug>.mdx`
- [ ] Frontmatter completo (`title`, `description`, `publishedAt`, `author`, `category`, `parentCategory`, `slug`)
- [ ] Título NO repetido como `#` en el cuerpo
- [ ] Imágenes en `public/miradas-assets/<slug>/`, nombres = los del `.mdx`, validadas como webp reales
- [ ] Cover reescalado a 1920px / recomprimido
- [ ] `npm run validate:miradas` → ✓
- [ ] (Opcional) Traducción CA/EN + re-validar
- [ ] Visto en `npm run dev`
- [ ] Commit + PR a `staging`
