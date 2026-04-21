# Auditoría de rendimiento

Objetivo: detectar cuellos de botella que afectan tiempos de carga, interactividad y experiencia percibida.

## Herramientas a ejecutar

### 1. Lighthouse (CLI)

Es la herramienta canónica. Da scores de Performance, Accessibility, Best Practices, SEO y PWA.

```bash
# Si el proyecto tiene un build servible:
npx --yes lighthouse http://localhost:PUERTO \
  --output=json --output=html \
  --output-path=./lighthouse-report \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance
```

Para servir el build:
- Vite: `npm run build && npx --yes serve dist -p 4173`
- Next.js: `npm run build && npm run start`
- CRA: `npm run build && npx --yes serve build -p 5000`

**Si no puedes servir el build** (falla, sin dependencias, etc.), continúa con análisis estático y anótalo como limitación.

Extrae del JSON estas métricas clave (Core Web Vitals y relacionadas):
- **LCP** (Largest Contentful Paint) — objetivo < 2.5s
- **CLS** (Cumulative Layout Shift) — objetivo < 0.1
- **INP** / **TBT** (Interaction to Next Paint / Total Blocking Time) — objetivo INP < 200ms, TBT < 200ms
- **FCP** (First Contentful Paint) — objetivo < 1.8s
- **TTI** (Time to Interactive) — objetivo < 3.8s
- **Speed Index** — objetivo < 3.4s

### 2. Análisis del bundle

Dependiendo del bundler:

**Vite:**
```bash
npx --yes vite-bundle-visualizer
# o
npm install --no-save rollup-plugin-visualizer
```

**Webpack:**
```bash
npx --yes webpack-bundle-analyzer stats.json
# genera stats con: webpack --profile --json > stats.json
```

**Next.js:**
```bash
# Si ya tiene @next/bundle-analyzer configurado:
ANALYZE=true npm run build
```

**Análisis directo de `dist/` / `build/`:**
```bash
# Tamaños de los chunks generados
du -sh dist/assets/* | sort -h
# o
find dist -name "*.js" -exec ls -lh {} \; | awk '{print $5, $9}' | sort -h
```

Busca:
- Bundle inicial JS > 200 KB gzip (alto) / > 500 KB gzip (crítico)
- Chunks muy grandes que podrían dividirse con code-splitting
- Librerías pesadas: moment (usar date-fns/dayjs), lodash entero (importar funciones sueltas), icon libraries enteras importadas

### 3. Análisis estático de rendimiento

Incluso sin ejecutar nada, busca estos patrones en el código:

**Imágenes:**
```bash
# Imágenes grandes en public/ o src/assets/
find . -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" \) -size +200k -not -path "*/node_modules/*"
```

**Imports problemáticos:**
```bash
# Imports de librerías completas
grep -rn "import [A-Z]\+ from 'lodash'" src/ 2>/dev/null
grep -rn "import.*from 'moment'" src/ 2>/dev/null
grep -rn "import \* as" src/ 2>/dev/null
```

**En React específicamente:**
- Componentes sin `React.memo` que reciben props complejas en listas grandes
- `useEffect` sin array de dependencias o con dependencias incorrectas
- Re-renders innecesarios (funciones inline pasadas como props, objetos creados en render)
- Falta de `React.lazy` + `Suspense` para rutas

**En Vue:**
- Uso de `v-if` + `v-for` juntos en el mismo elemento
- Falta de `keep-alive` en componentes que se montan/desmontan frecuentemente
- Watchers profundos (`deep: true`) cuando no son necesarios

**En Angular:**
- Falta de `ChangeDetectionStrategy.OnPush`
- Uso de `*ngIf` con funciones en el template (se llaman en cada detección de cambios)
- Falta de `trackBy` en `*ngFor`

## Qué reportar

Para cada hallazgo incluye:
1. Métrica o patrón detectado (con número concreto si lo hay)
2. Por qué es un problema (impacto en usuario real)
3. Ubicación (archivo:línea, o "bundle global")
4. Recomendación con ejemplo de código o comando

## Umbrales de severidad (rendimiento)

| Condición | Severidad |
|---|---|
| LCP > 4s en móvil simulado | 🔴 Crítico |
| Bundle inicial > 500 KB gzip | 🔴 Crítico |
| LCP 2.5–4s, CLS 0.1–0.25 | 🟠 Alto |
| Bundle inicial 200–500 KB gzip | 🟠 Alto |
| Imágenes > 500 KB sin optimizar | 🟠 Alto |
| Imports de librerías completas evitables | 🟡 Medio |
| Falta de `loading="lazy"` en imágenes below-the-fold | 🟡 Medio |
| Falta de memoization en componentes no críticos | 🟢 Bajo |
