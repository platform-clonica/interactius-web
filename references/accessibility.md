# Auditoría de accesibilidad (WCAG)

Objetivo: detectar barreras que impiden a personas con discapacidades usar la web. Sigue WCAG 2.1 nivel AA como mínimo.

## Herramientas a ejecutar

### 1. axe-core CLI

La herramienta de referencia. Requiere un build servible:

```bash
npx --yes @axe-core/cli http://localhost:PUERTO --save axe-report.json
```

Con múltiples rutas:
```bash
npx --yes @axe-core/cli \
  http://localhost:PUERTO/ \
  http://localhost:PUERTO/login \
  http://localhost:PUERTO/dashboard \
  --save axe-report.json
```

### 2. Pa11y (alternativa o complemento)

```bash
npx --yes pa11y http://localhost:PUERTO --reporter json > pa11y-report.json
# Con estándar específico:
npx --yes pa11y http://localhost:PUERTO --standard WCAG2AA
```

### 3. Lighthouse para accesibilidad

Ya capturado en el paso de rendimiento, pero puedes ejecutarlo aislado:
```bash
npx --yes lighthouse http://localhost:PUERTO \
  --only-categories=accessibility \
  --output=json --output-path=./lighthouse-a11y.json
```

### 4. ESLint plugins de accesibilidad

**React:**
```bash
npx --yes eslint "src/**/*.{jsx,tsx}" \
  --no-eslintrc \
  --resolve-plugins-relative-to . \
  --plugin jsx-a11y \
  --rule 'jsx-a11y/alt-text: error' \
  --rule 'jsx-a11y/anchor-has-content: error' \
  --rule 'jsx-a11y/aria-props: error' \
  --rule 'jsx-a11y/label-has-associated-control: error'
```

**Vue:** `eslint-plugin-vuejs-accessibility`
**Angular:** `@angular-eslint/template-accessibility-*`

## Análisis estático (sin build)

Revisión manual de patrones comunes. Usa grep y lectura del código:

### Imágenes sin alt

```bash
# React/JSX
grep -rEn "<img(\s+[^>]*)?\s*/?>" src/ --include="*.tsx" --include="*.jsx" | grep -v "alt="

# HTML puro
grep -rEn "<img(\s+[^>]*)?\s*/?>" src/ public/ --include="*.html" | grep -v "alt="
```

### Botones e interactivos sin texto accesible

```bash
# Botones solo con iconos (sin aria-label)
grep -rn "<button" src/ | grep -v "aria-label"
```

### Falta de labels en formularios

```bash
# Inputs sin label asociado por id o por wrapping
grep -rEn "<input" src/ --include="*.tsx" --include="*.jsx" --include="*.vue"
```
Después inspecciona manualmente si cada uno tiene `<label htmlFor="...">` o está envuelto por uno.

### Uso incorrecto de elementos semánticos

```bash
# Divs y spans que deberían ser botones (onClick sin role)
grep -rn "onClick" src/ --include="*.tsx" | grep "div\|span" | grep -v "role="
```

### Headings rotos

- ¿Hay `<h1>` en cada página?
- ¿Se saltan niveles (h1 → h3)?
- ¿Se usan headings para dar estilo en lugar de por jerarquía?

### Contraste de color

Esto requiere herramientas automatizadas (axe lo cubre), pero también revisa manualmente:
- Variables CSS de colores definidas en `:root` o tema
- Combinaciones texto/fondo evidentes en el código

### ARIA

- `aria-label` / `aria-labelledby` en elementos que lo necesitan
- `aria-hidden="true"` mal aplicado (oculta contenido esencial)
- Roles mal usados (`role="button"` en algo que debería ser `<button>`)

### Navegación por teclado

Revisa en el código:
- Elementos interactivos custom con `tabIndex`
- Trampas de foco en modales/drawers
- Orden de tabulación lógico

### Contenido multimedia

```bash
# Videos sin captions/transcripts
grep -rn "<video" src/ public/
# Audios sin alternativas
grep -rn "<audio" src/ public/
```

### Movimiento y animaciones

- Busca `animation` / `transition` en CSS
- ¿Respetan `prefers-reduced-motion`?

```bash
grep -rn "prefers-reduced-motion" src/
```

## Puntos WCAG clave a cubrir

1. **Perceptible**: texto alternativo, contraste, contenido adaptable
2. **Operable**: accesible por teclado, suficiente tiempo, no causa convulsiones
3. **Comprensible**: legible, predecible, asistencia en entrada de datos
4. **Robusto**: compatible con tecnologías asistivas

## Qué reportar

Para cada hallazgo:
1. Criterio WCAG violado (p. ej. "1.1.1 Contenido no textual")
2. Nivel (A / AA / AAA)
3. Elementos afectados (con selectores o archivo:línea)
4. Impacto en usuario (qué tipo de usuario se ve afectado)
5. Corrección concreta

## Umbrales de severidad (accesibilidad)

| Condición | Severidad |
|---|---|
| Violaciones WCAG nivel A | 🔴 Crítico |
| Imágenes de contenido sin alt, formularios sin labels | 🔴 Crítico |
| Páginas completas inaccesibles por teclado | 🔴 Crítico |
| Violaciones WCAG nivel AA (contraste, focus visible, etc.) | 🟠 Alto |
| Headings mal estructurados | 🟠 Alto |
| Falta `<html lang>` o `<title>` único por página | 🟠 Alto |
| ARIA mal usado pero sin romper funcionalidad | 🟡 Medio |
| Falta `prefers-reduced-motion` | 🟡 Medio |
| Mejoras AAA (contraste enhanced, etc.) | 🟢 Bajo |

**Nota importante:** la accesibilidad no es negociable. Muchas de sus violaciones son también obligaciones legales (EN 301 549 en UE, ADA en EEUU). Reportar siempre con rigor.
