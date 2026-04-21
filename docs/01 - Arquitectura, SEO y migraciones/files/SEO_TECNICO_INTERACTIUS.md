# SEO Técnico — Interactius
## Documentación completa del sistema de metadatos, sitemap y schema

---

## Ficheros entregados

| Fichero | Uso | Estado |
|---|---|---|
| `robots.production.txt` | `/robots.txt` en producción | ✅ Listo |
| `robots.staging.txt` | `/robots.txt` en staging | ✅ Listo |
| `next-sitemap.config.js` | Configuración del sitemap con i18n y hreflang | ✅ Listo |
| `lib/metadata.config.ts` | Sistema centralizado de metadatos | ✅ Listo |
| `lib/schema.ts` | Schemas Organization, Article, Breadcrumb | ✅ Listo |
| `app/[locale]/layout.tsx` | RootLayout con SEO completo | ✅ Listo |

---

## Pendientes con assets de marca

| Elemento | Dónde | Qué hacer cuando llegue |
|---|---|---|
| Logo | `lib/metadata.config.ts` → `SITE_CONFIG.ogImage` | Reemplazar URL placeholder |
| Logo | `lib/schema.ts` → `organizationSchema.logo` | Reemplazar URL placeholder |
| Favicon | `app/[locale]/layout.tsx` → `icons` | Añadir `/favicon.ico`, `/apple-touch-icon.png` |
| OG image | `lib/metadata.config.ts` → `SITE_CONFIG.ogImage` | Crear imagen 1200×630px y subir |
| GSC verification | `lib/metadata.config.ts` → `verification.google` | Pegar código de Search Console |
| Tipografía | `app/[locale]/layout.tsx` → `inter` | Reemplazar con fuente del sistema visual |

---

## Pendientes con contenido real

| Elemento | Dónde | Qué hacer |
|---|---|---|
| `title` y `description` de cada página | `lib/metadata.config.ts` → `pageMetadata` | Revisar propuestas con copy definitivo |
| Metadatos de artículos MDX | Frontmatter de cada archivo `.mdx` | Añadir `title`, `description`, `publishedAt`, `author`, `image` |

---

## Arquitectura de URLs i18n

```
ES (default):  https://www.interactius.com/[ruta]
CA:            https://www.interactius.com/ca/[ruta-ca]
EN:            https://www.interactius.com/en/[ruta-en]
```

### Tabla de rutas por idioma

| ES | CA | EN |
|---|---|---|
| `/` | `/ca/` | `/en/` |
| `/pensamiento-estrategico` | `/ca/pensament-estrategic` | `/en/strategic-thinking` |
| `/activacion-de-soluciones` | `/ca/activacio-de-solucions` | `/en/solution-activation` |
| `/transformacion-cultural` | `/ca/transformacio-cultural` | `/en/cultural-transformation` |
| `/identidad` | `/ca/identitat` | `/en/identity` |
| `/contacto` | `/ca/contacte` | `/en/contact` |
| `/miradas` | `/ca/mirades` | `/en/thoughts` |
| `/miradas/[cat]/[slug]` | `/ca/mirades/[cat]/[slug]` | `/en/thoughts/[cat]/[slug]` |
| `/aviso-legal` | `/ca/avis-legal` | `/en/legal-notice` |

---

## Categorías de Miradas

| Categoría | Artículos | URL |
|---|---|---|
| design | 39 | `/miradas/design/` |
| ux | 28 | `/miradas/ux/` |
| research | 21 | `/miradas/research/` |
| ia | 10 | `/miradas/ia/` |
| estrategia | 6 | `/miradas/estrategia/` |
| workshops | 3 | `/miradas/workshops/` |
| diseno-inclusivo | 1 | `/miradas/diseno-inclusivo/` |

---

## Frontmatter MDX — Patrón para artículos de Miradas

```mdx
---
title: 'Título del artículo'
description: 'Descripción de 150-160 caracteres para meta description y OG.'
publishedAt: '2025-01-15'
modifiedAt: '2025-01-15'
author: 'Nombre Apellido'
category: 'design'
slug: 'nombre-del-articulo'
image: '/miradas/design/nombre-del-articulo/og.jpg'
tags: ['diseño', 'ux', 'estrategia']
---
```

---

## ⚠ Requisito crítico de lanzamiento

**Verificar que las 108 URLs `/miradas/[cat]/[slug]` devuelven 200 antes de publicar.**
Un redirect 301 apuntando a un 404 no transfiere señal SEO y es peor que no tener redirect.

---

## Schema.org implementado

| Schema | Página | Notas |
|---|---|---|
| `Organization` | Todas (RootLayout) | Dirección Barcelona, LinkedIn |
| `WebSite` | Todas (RootLayout) | Base para sitelinks |
| `BreadcrumbList` | Páginas internas | Generar con `buildBreadcrumbSchema()` |
| `Article` | Artículos Miradas | Generar con `buildArticleSchema()` |

