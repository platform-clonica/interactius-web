# Plantilla del informe

Usa **exactamente** esta estructura. El usuario la va a ver repetidamente — la consistencia importa.

---

```markdown
# Auditoría Web — [Nombre del proyecto]

**Fecha:** [YYYY-MM-DD]
**Framework detectado:** [React 18.x / Vue 3.x / Angular 17.x / etc.]
**Bundler:** [Vite / Webpack / Next.js / etc.]
**Modo de renderizado:** [SSR / SSG / Cliente (SPA) / Híbrido]

---

## 📋 Resumen ejecutivo

[5-10 líneas en prosa. Responde a: ¿cuál es el estado general del proyecto? ¿Qué 2-3 cosas son más urgentes? ¿Cuáles son las fortalezas?]

**Puntuaciones Lighthouse** (si se ejecutó):
- Rendimiento: XX / 100
- Accesibilidad: XX / 100
- Best Practices: XX / 100
- SEO: XX / 100

**Conteo de hallazgos:**
- 🔴 Críticos: X
- 🟠 Altos: X
- 🟡 Medios: X
- 🟢 Bajos: X

---

## ⚡ Rendimiento

### Métricas clave

| Métrica | Valor | Objetivo | Estado |
|---|---|---|---|
| LCP | X.Xs | < 2.5s | ✅ / ⚠️ / ❌ |
| CLS | 0.XX | < 0.1 | ✅ / ⚠️ / ❌ |
| TBT | XXXms | < 200ms | ✅ / ⚠️ / ❌ |
| Bundle inicial (JS) | XXX KB gzip | < 200 KB | ✅ / ⚠️ / ❌ |

### Hallazgos

#### 🔴 [Título del hallazgo crítico]
**Ubicación:** `src/archivo.tsx:42` (o "bundle global", "múltiples archivos")
**Problema:** [Qué pasa y por qué importa para los usuarios]
**Recomendación:**
[Qué hacer, idealmente con ejemplo de código o comando]
```tsx
// Antes
import _ from 'lodash';
// Después
import debounce from 'lodash/debounce';
```

#### 🟠 [Siguiente hallazgo por severidad]
...

[Continúa ordenado por severidad descendente]

---

## 🧹 Calidad de código

### Resumen cuantitativo

- **Errores ESLint:** X
- **Warnings ESLint:** X
- **Archivos analizados:** X
- **Líneas de código (src/):** X
- **Uso de `any` (TS):** X ocurrencias
- **Duplicación:** X.X %
- **Top reglas violadas:** [regla 1] (X veces), [regla 2] (X veces)...

### Hallazgos

#### 🔴 [Título]
**Ubicación:** ...
**Problema:** ...
**Recomendación:** ...

[Resto de hallazgos por severidad]

---

## ♿ Accesibilidad

### Resumen

- **Herramienta usada:** axe-core / Pa11y / Lighthouse
- **Páginas auditadas:** [lista]
- **Violaciones WCAG detectadas:** X (A: X, AA: X, AAA: X)

### Hallazgos

#### 🔴 [Título]
**Criterio WCAG:** [p. ej. 1.1.1 Contenido no textual (Nivel A)]
**Usuarios afectados:** [p. ej. "Usuarios de lector de pantalla"]
**Ubicación:** ...
**Problema:** ...
**Recomendación:** ...
```tsx
// Antes
<img src="/logo.png" />
// Después
<img src="/logo.png" alt="Logo de Empresa S.A." />
```

[Resto de hallazgos por severidad]

---

## 🔎 SEO técnico

### Estado general

- **Renderizado:** [SSR / SSG / SPA cliente / Híbrido]
- **Sitemap.xml:** ✅ presente / ❌ ausente
- **Robots.txt:** ✅ presente / ❌ ausente / ⚠️ con problemas
- **Meta tags por ruta:** ✅ gestionados con [library] / ❌ ausentes o estáticos

### Hallazgos

#### 🔴 [Título]
**Ubicación:** ...
**Problema:** ...
**Recomendación:** ...

[Resto de hallazgos por severidad]

---

## 🎯 Próximos pasos recomendados

En orden de prioridad:

1. **[Acción concreta del más urgente]** — [por qué es primero, impacto esperado]
2. **[Siguiente acción]** — ...
3. ...
[Hasta 5-10 items máximo]

---

## 📎 Anexo: herramientas y comandos usados

Para reproducir esta auditoría:

```bash
# Rendimiento
npx lighthouse http://localhost:4173 --output=json --output-path=./lighthouse.json

# Bundle
npx vite-bundle-visualizer

# Linter
npx eslint "src/**/*.{ts,tsx}" --format json

# Accesibilidad
npx @axe-core/cli http://localhost:4173 --save axe.json
```

## ⚠️ Limitaciones de esta auditoría

[Mencionar qué no se pudo ejecutar y por qué. Ejemplo:]
- Lighthouse no se ejecutó porque el proyecto no construyó correctamente (error en `npm run build`)
- El análisis de accesibilidad se basa solo en análisis estático del código
- No se auditaron rutas protegidas que requieren autenticación
```

---

## Notas para Claude

- **Sé específico, no genérico.** "Usar lazy loading" es mala recomendación. "Aplicar `loading='lazy'` a las imágenes en `HomePage.tsx:88-102` que están below-the-fold" es buena.
- **Incluye ejemplos de código** siempre que sea realista. Tú has visto el código, sabes cómo está escrito, usa sus convenciones.
- **No rellenes secciones vacías con tópicos.** Si no hay hallazgos críticos, di "Sin hallazgos críticos en esta área. ✅" y pasa a los siguientes.
- **El resumen ejecutivo se escribe al final**, cuando ya tienes todo lo demás.
- **Menciona aspectos positivos** del proyecto cuando los haya — no es solo una lista de defectos.
