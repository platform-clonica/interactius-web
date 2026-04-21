# Auditoría de calidad de código

Objetivo: detectar problemas de mantenibilidad, legibilidad, buenas prácticas y riesgos de bugs.

## Herramientas a ejecutar

### 1. ESLint

Es la herramienta estándar. Si el proyecto ya tiene configuración, úsala:

```bash
# Usar la config del proyecto
npx eslint "src/**/*.{js,jsx,ts,tsx,vue}" --format json --output-file eslint-report.json
npx eslint "src/**/*.{js,jsx,ts,tsx,vue}" --format stylish
```

Si **no hay config** de ESLint, propón una según el framework y ejecuta con `--no-eslintrc`:

```bash
# Config básica inline (ejemplo para React+TS)
npx --yes eslint "src/**/*.{ts,tsx}" \
  --no-eslintrc \
  --resolve-plugins-relative-to . \
  --rule 'no-unused-vars: warn' \
  --rule 'no-console: warn'
```

Del reporte JSON extrae:
- Total de errores vs warnings
- Reglas más frecuentemente violadas (top 5)
- Archivos con más problemas (top 5)

### 2. TypeScript (si aplica)

```bash
# Comprobar tipos sin emitir
npx tsc --noEmit
```

Busca:
- Uso extensivo de `any` (grep `: any` / `as any`)
- `@ts-ignore` / `@ts-expect-error` sin justificación
- `tsconfig.json` con `strict: false` — recomienda activar strict mode progresivamente

```bash
# Uso de 'any'
grep -rn ": any" src/ --include="*.ts" --include="*.tsx" | wc -l
grep -rn "as any" src/ --include="*.ts" --include="*.tsx" | wc -l
grep -rn "@ts-ignore\|@ts-expect-error" src/ | wc -l
```

### 3. Complejidad ciclomática

```bash
# Con eslint + eslint-plugin-complexity o simplemente la regla built-in:
npx --yes eslint "src/**/*.{js,jsx,ts,tsx}" \
  --no-eslintrc \
  --rule 'complexity: [warn, 10]' \
  --rule 'max-lines-per-function: [warn, 50]' \
  --rule 'max-depth: [warn, 4]'
```

Alternativa con herramienta dedicada:
```bash
npx --yes complexity-report-html src/
# o
npx --yes plato -r -d report src/
```

### 4. Duplicación de código

```bash
npx --yes jscpd src/ --min-lines 5 --min-tokens 50 --reporters console,json --output ./jscpd-report
```

### 5. Tamaño y estructura del código

```bash
# Archivos enormes (candidatos a refactor)
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.vue" \) -exec wc -l {} \; | sort -rn | head -20

# Contar líneas totales por tipo
find src -name "*.tsx" | xargs wc -l | tail -1
```

## Análisis estático por framework

### React

Busca estos anti-patrones:
- **Dependencias mal gestionadas en hooks**: `useEffect(() => {...}, [])` cuando usa variables externas
- **Mutación de estado directa**: `state.foo = bar` en lugar de `setState`
- **Keys con índice en listas dinámicas**: `key={index}` cuando la lista se reordena
- **Props drilling excesivo**: 3+ niveles pasando las mismas props → sugerir Context o state manager
- **Componentes de 200+ líneas**: candidatos a dividir
- **Lógica de negocio en componentes**: debería estar en hooks custom o servicios

```bash
grep -rn "key={index}" src/ --include="*.tsx" --include="*.jsx"
grep -rn "useEffect.*\[\]" src/ --include="*.tsx" --include="*.jsx"
```

### Vue

- Uso de Options API vs Composition API inconsistente
- `v-html` sin sanitización (riesgo XSS)
- Stores Vuex/Pinia enormes sin dividir en módulos
- Componentes con `<script>` de > 300 líneas

### Angular

- Servicios sin `providedIn: 'root'` cuando deberían
- Subscripciones sin `unsubscribe` (memory leaks)
- Lógica pesada en templates
- Falta de tipado estricto en formularios reactivos

## Otros patrones generales

- **Console.log en producción**: `grep -rn "console.log" src/`
- **TODOs / FIXMEs sin resolver**: `grep -rn "TODO\|FIXME\|HACK\|XXX" src/`
- **Magic numbers**: números hardcodeados sin constantes con nombre
- **Nombres poco claros**: variables `data`, `temp`, `x`, `obj`
- **Funciones sin retorno explícito de tipo** (en TS)
- **Archivos sin tests** cuando hay carpeta de tests

## Qué reportar

Agrupa los hallazgos en:
1. **Errores/warnings de linter** (resumen cuantitativo + top reglas)
2. **Problemas estructurales** (archivos demasiado grandes, duplicación, complejidad)
3. **Tipado** (si TS)
4. **Anti-patrones específicos del framework**
5. **Higiene general** (console.logs, TODOs, magic numbers)

## Umbrales de severidad (calidad)

| Condición | Severidad |
|---|---|
| Errores de ESLint (no warnings) | 🔴 Crítico |
| Código que no compila / errores de TS | 🔴 Crítico |
| Uso extensivo de `any` (> 20 ocurrencias o > 10% de tipos) | 🟠 Alto |
| Duplicación > 5% del código | 🟠 Alto |
| Archivos > 500 líneas | 🟠 Alto |
| Funciones con complejidad > 15 | 🟠 Alto |
| Warnings de ESLint recurrentes (misma regla > 10 veces) | 🟡 Medio |
| Console.logs olvidados | 🟡 Medio |
| TODOs antiguos, magic numbers aislados | 🟢 Bajo |
| Formato inconsistente | 🟢 Bajo |
