---
name: web-audit
description: Audita proyectos web SPA (React, Vue, Angular) en términos de rendimiento, calidad de código, accesibilidad (WCAG) y SEO técnico, ejecutando herramientas reales (ESLint, Lighthouse, bundle analyzer, axe-core) sobre el proyecto y produciendo un informe Markdown con issues priorizados por severidad. Úsala siempre que el usuario pida "auditar", "revisar", "analizar el rendimiento/calidad/accesibilidad/SEO" de una web, proyecto frontend, app React/Vue/Angular, o mencione tiempos de carga, optimización web, Core Web Vitals, Lighthouse, accesibilidad web, o quiera una revisión técnica general de una web — incluso si no dice la palabra "auditar" explícitamente.
---

# Web Audit

Auditoría completa de proyectos web SPA (React/Vue/Angular). Produce un informe Markdown estructurado con hallazgos priorizados por severidad y recomendaciones concretas.

## Cuándo aplicar esta skill

El usuario quiere una revisión técnica de una web/app frontend. Señales típicas:
- "Audita mi web / proyecto / app"
- "Revisa el rendimiento de esto"
- "¿Cómo puedo mejorar los tiempos de carga?"
- "Analiza la calidad del código / accesibilidad / SEO"
- Sube una carpeta de proyecto React/Vue/Angular pidiendo feedback técnico

## Flujo general

Sigue estos pasos en orden. Cada paso tiene un archivo de referencia con el detalle de qué ejecutar y qué buscar.

### 1. Reconocimiento del proyecto

Antes de ejecutar nada, entiende qué tienes delante:

1. Lista la estructura de alto nivel (`ls` sobre la raíz, luego `src/`).
2. Lee `package.json` para identificar: framework (React/Vue/Angular), bundler (Vite/Webpack/Next/Nuxt/etc.), versiones, scripts disponibles, dependencias.
3. Busca configs relevantes: `tsconfig.json`, `.eslintrc*`, `vite.config.*`, `webpack.config.*`, `next.config.*`, `tailwind.config.*`.
4. Detecta si hay build previa (`dist/`, `build/`, `.next/`) o si hay que construir.

Esto determina qué herramientas del paso 2 son aplicables. Por ejemplo: Lighthouse solo tiene sentido si puedes servir un build; bundle analyzer depende del bundler.

### 2. Ejecutar herramientas de auditoría

Ejecuta las herramientas aplicables en **las cuatro áreas**. Si una herramienta falla o no aplica, documéntalo y continúa — no bloquees la auditoría entera por una herramienta que no arranca.

Consulta las referencias según necesites:
- `references/performance.md` — rendimiento (Lighthouse, bundle analyzer, tamaños de assets, Core Web Vitals)
- `references/code-quality.md` — calidad de código (ESLint, complejidad, duplicación, TypeScript strict, patrones anti-patrón)
- `references/accessibility.md` — accesibilidad (axe-core, Pa11y, revisión manual de landmarks/ARIA/contraste)
- `references/seo.md` — SEO técnico (meta tags, SSR/SSG, sitemap, robots, structured data, semantic HTML)

**Instala lo que falte con cuidado:** usa `npm install --no-save` o `npx` para no contaminar el `package.json` del usuario.

**Nunca ejecutes `npm install` sobre el proyecto del usuario sin avisar** — las dependencias del proyecto ya deberían estar instaladas; si no lo están, pregúntale antes.

### 3. Clasificar cada hallazgo por severidad

Usa estos criterios consistentemente en todo el informe:

| Severidad | Criterio |
|---|---|
| 🔴 **Crítico** | Rompe la experiencia para un subconjunto real de usuarios (p. ej. web inaccesible para lectores de pantalla, LCP > 4s en móvil, errores de build/runtime, secretos expuestos) |
| 🟠 **Alto** | Impacto claro y medible en usuarios, SEO o mantenibilidad (bundle inicial > 500 KB gzip, contraste insuficiente, falta de `<title>`/meta description, código con complejidad ciclomática > 15) |
| 🟡 **Medio** | Problema real pero con impacto acotado (imágenes sin lazy-load, warnings de ESLint recurrentes, falta de `alt` en imágenes decorativas) |
| 🟢 **Bajo** | Mejora recomendable, sin impacto urgente (formato inconsistente, nombres de variables poco claros, falta de alguna meta opcional) |

**Regla de oro:** si tienes dudas entre dos niveles, elige el más bajo. Es mejor no inflar la urgencia.

### 4. Escribir el informe

Usa exactamente la estructura de `references/report-template.md`. Claves:

- El informe es **un único archivo Markdown** guardado como `auditoria-web.md` (o nombre que pida el usuario) en el directorio de salida.
- Empieza con un **resumen ejecutivo** de 5-10 líneas: estado general, 3 cosas más urgentes, puntuaciones clave.
- Una sección por cada área (Rendimiento / Calidad de código / Accesibilidad / SEO).
- Dentro de cada área, los hallazgos van **ordenados por severidad descendente** (críticos primero).
- Cada hallazgo tiene: título, severidad, descripción del problema, ubicación (archivo:línea si aplica), **recomendación concreta** con ejemplo de código cuando tenga sentido.
- Cierra con una **sección "Próximos pasos"** con los 5-10 items más importantes en orden de prioridad.

### 5. Entregar el informe

Guarda el archivo y preséntaselo al usuario con `present_files`. En el mensaje de respuesta, incluye solo un resumen breve (3-5 líneas) — el detalle está en el informe, no lo repitas.

## Cosas que NO debes hacer

- **No modifiques el código del usuario** sin que lo pida explícitamente. Esta skill solo audita, no arregla.
- **No inventes métricas.** Si no pudiste ejecutar Lighthouse, di "no ejecutado" en lugar de estimar números.
- **No hagas recomendaciones genéricas** tipo "usa mejores prácticas". Cada recomendación debe ser específica y accionable, idealmente con referencia a archivo/línea.
- **No subestimes problemas de accesibilidad.** Son tan importantes como el rendimiento — trátalos con el mismo rigor.
- **No asumas que el usuario puede ejecutar comandos.** Documenta en el informe los comandos que usaste, por si quiere reproducirlos.

## Si el proyecto no construye o faltan dependencias

No abandones la auditoría. Haz lo que puedas con análisis estático (lectura de código, grep de patrones, revisión de configs) y documéntalo claramente en el informe en una sección "Limitaciones de esta auditoría".
