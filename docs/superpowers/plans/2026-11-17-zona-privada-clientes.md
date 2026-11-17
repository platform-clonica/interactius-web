# Zona privada de clientes — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Servir en `interactius.com/clientes/<cliente>/<id>` artefactos de claude.ai confidenciales, visibles solo para las personas autorizadas en cada artefacto, con usuario y contraseña, sin que el contenido pase por el repo.

**Architecture:** Los datos (archivos, fichas con permisos, usuarios) viven en tres stores de Netlify Blobs por entorno. Una capa `lib/clientes/` sin dependencias de Next (contraseñas, sesiones, tokens, permisos, operaciones) se prueba con Vitest sobre un store en memoria y la usan tanto las rutas de Next (`app/clientes/`) como una CLI (`scripts/clientes.ts`) que ejecuta Claude para publicar y gestionar accesos. El HTML del artefacto se sirve en un iframe desde `/clientes/archivos/<id>/<token>/…` con `CSP: sandbox` y un token HMAC de 15 minutos en la ruta.

**Tech Stack:** Next.js 15.5 App Router (runtime Node en route handlers), TypeScript 5.7, `@netlify/blobs` 11.1.7, `node:crypto` (scrypt, HMAC-SHA256), Vitest 5.0.5, tsx 4.23.15, Tailwind 3.4.

**Spec:** `docs/superpowers/specs/2026-11-17-zona-privada-clientes-design.md`

## Global Constraints

- Ningún archivo de artefacto, credencial ni correo de cliente se escribe dentro del repo. La CLI rechaza `--dir` dentro del working tree.
- Versiones exactas: `@netlify/blobs@11.1.7` (dependency), `vitest@5.0.5` y `tsx@4.23.15` (devDependencies).
- Stores: `clientes-artefactos-<entorno>`, `clientes-registro-<entorno>`, `clientes-usuarios-<entorno>`, con `<entorno>` = `production` | `staging`. En runtime: `production` si `SITE_CONFIG.isProduction`, si no `staging`.
- Secreto: `process.env.CLIENTES_SESSION_SECRET` escrito literalmente, mínimo 32 caracteres. Sin él la zona no autentica a nadie (fail-closed).
- IDs aleatorios con alfabeto `abcdefghijkmnpqrstuvwxyz23456789`; id de artefacto de 10 caracteres; contraseña de 16 en grupos de 4 con guiones.
- scrypt N=16384, r=8, p=1, salt 16 bytes, clave 32 bytes.
- Cookie `__Host-ia_clientes`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, 7 días.
- Bloqueo: 5 fallos consecutivos → 15 minutos.
- Token de archivo: 15 minutos, en la ruta (`/clientes/archivos/<id>/<token>/<ruta>`).
- Slugs de cliente reservados: `login`, `logout`, `admin`, `archivos`.
- Admins: solo correos `@interactius.com`.
- Mensajes de error al usuario: "Usuario o contraseña incorrectos." · "Demasiados intentos. Prueba de nuevo en unos minutos." · "No tienes acceso a este contenido." · "Servicio no disponible."
- Toda la zona: `noindex, nofollow`, `Cache-Control: private, no-store`, `Referrer-Policy: no-referrer`, `Disallow: /clientes` en robots, fuera del sitemap.
- Comentarios y textos en español, como el resto del repo. Sin hex en clases: usar tokens (`text-fg`, `bg-warm-light`).
- Verificación de cada tarea: `npm test` (desde la Tarea 1), `npm run type-check`, `npm run lint`.

## Mapa de archivos

| Archivo | Responsabilidad |
| --- | --- |
| `lib/clientes/types.ts` | Tipos `Entorno`, `Artefacto`, `Usuario`, `ArchivoArtefacto` |
| `lib/clientes/ids.ts` | IDs aleatorios, validación de slug, id y email |
| `lib/clientes/passwords.ts` | Generar, hashear y verificar contraseñas |
| `lib/clientes/hmac.ts` | Firmar y comparar HMAC en tiempo constante |
| `lib/clientes/session.ts` | Token de sesión de la cookie |
| `lib/clientes/file-tokens.ts` | Token de archivo con caducidad |
| `lib/clientes/store.ts` | Interfaz `AlmacenBlobs` / `Almacenes` |
| `lib/clientes/memory-store.ts` | Implementación en memoria (tests) |
| `lib/clientes/netlify-store.ts` | Implementación con `@netlify/blobs` |
| `lib/clientes/repo.ts` | Lectura y escritura tipada de fichas, usuarios y últimos accesos |
| `lib/clientes/auth.ts` | Login con bloqueo por intentos |
| `lib/clientes/access.ts` | Usuario de la sesión, `puedeVer`, registrar acceso |
| `lib/clientes/operations.ts` | Publicar, republicar, dar o quitar acceso, usuarios, resumen admin, avisos |
| `lib/clientes/http.ts` | `origenValido`, `destinoSeguro`, cabeceras comunes |
| `lib/clientes/config.ts` | Entorno, secreto y almacenes en runtime (solo servidor) |
| `lib/clientes/__tests__/*.test.ts` | Tests unitarios |
| `scripts/clientes.ts` | CLI |
| `middleware.ts` | Bypass de i18n y cabeceras para `/clientes` |
| `app/robots.ts` | `Disallow: /clientes` |
| `app/clientes/layout.tsx` | Root layout de la zona |
| `app/clientes/not-found.tsx` | "No tienes acceso a este contenido." |
| `app/clientes/[cliente]/[id]/page.tsx` | Login o visor |
| `app/clientes/login/route.ts` · `logout/route.ts` | Sesión |
| `app/clientes/archivos/[id]/[token]/[...ruta]/route.ts` | Archivos del artefacto |
| `app/clientes/admin/page.tsx` | Vista admin |
| `app/clientes/admin/revocar/route.ts` · `admin/usuarios/desactivar/route.ts` | Acciones admin |
| `components/clientes/*` | Login, visor, servicio no disponible, copiar enlace, recarga |

---

### Task 1: Herramientas, tipos e identificadores

**Files:**
- Modify: `package.json`, `.gitignore`, `CLAUDE.md`
- Create: `vitest.config.ts`, `lib/clientes/types.ts`, `lib/clientes/ids.ts`
- Test: `lib/clientes/__tests__/ids.test.ts`

**Interfaces:**
- Produces: tipos `Entorno`, `Acceso`, `Artefacto`, `Usuario`, `ArchivoArtefacto`; `ALFABETO`, `idAleatorio(longitud: number): string`, `ID_ARTEFACTO_RE: RegExp`, `SLUGS_RESERVADOS`, `validarSlugCliente(slug: string): string | null`, `normalizarEmail(email: string): string`, `esEmailValido(email: string): boolean`, `esEmailInteractius(email: string): boolean`.

- [ ] **Step 1: Instalar dependencias y scripts**

```bash
npm install --save-exact @netlify/blobs@11.1.7
npm install --save-dev --save-exact vitest@5.0.5 tsx@4.23.15
npm pkg set scripts.test="vitest run" scripts.clientes="tsx scripts/clientes.ts"
```

- [ ] **Step 2: Configurar Vitest**

`vitest.config.ts`:

```ts
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
})
```

Añadir al final de `.gitignore`:

```
# Zona privada de clientes: copias locales de artefactos. Nunca al repo.
/.clientes-tmp/
```

En `CLAUDE.md`, sustituir la línea `No test runner is configured. Verify changes with \`npm run type-check && npm run lint\` and visually in the browser.` por:

```
Vitest covers only `lib/clientes/` (private client area security logic): `npm test`. Everything else: verify with `npm run type-check && npm run lint` and visually in the browser.
```

y añadir `npm test` al bloque de comandos.

- [ ] **Step 3: Escribir los tipos**

`lib/clientes/types.ts`:

```ts
/* ==========================================================================
   Zona privada de clientes — tipos compartidos
   --------------------------------------------------------------------------
   Ver docs/superpowers/specs/2026-11-17-zona-privada-clientes-design.md.
   Estos datos viven en Netlify Blobs, nunca en el repo.
   ========================================================================== */

export type Entorno = 'production' | 'staging'

export interface Acceso {
  concedidoEn: string
}

export interface Artefacto {
  id: string
  cliente: string
  titulo: string
  /** URL del artefacto original en claude.ai. */
  origen: string
  version: number
  publicadoEn: string
  publicadoPor: string
  /** Ruta del HTML de entrada dentro del artefacto, p. ej. `index.html`. */
  entrada: string
  avisos: string[]
  /** Clave: email normalizado. */
  accesos: Record<string, Acceso>
}

export interface Usuario {
  email: string
  /** `null` = desactivado: no puede entrar en nada. */
  hash: string | null
  admin: boolean
  creadoEn: string
  /** Las sesiones emitidas antes de esta fecha no valen. */
  credencialesEn: string
  fallos: number
  bloqueadoHasta: string | null
}

export interface ArchivoArtefacto {
  ruta: string
  datos: Uint8Array
  contentType: string
}
```

- [ ] **Step 4: Escribir el test de ids (falla)**

`lib/clientes/__tests__/ids.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  ALFABETO,
  ID_ARTEFACTO_RE,
  esEmailInteractius,
  esEmailValido,
  idAleatorio,
  normalizarEmail,
  validarSlugCliente,
} from '@/lib/clientes/ids'

describe('ids', () => {
  it('el alfabeto tiene 32 caracteres sin ambigüedades', () => {
    expect(ALFABETO).toHaveLength(32)
    expect(ALFABETO).not.toMatch(/[01lo]/)
  })

  it('idAleatorio respeta longitud y alfabeto y no repite', () => {
    const a = idAleatorio(10)
    const b = idAleatorio(10)
    expect(a).toMatch(ID_ARTEFACTO_RE)
    expect(a).not.toBe(b)
    expect(idAleatorio(16)).toHaveLength(16)
  })

  it('valida slugs de cliente', () => {
    expect(validarSlugCliente('caixabank')).toBeNull()
    expect(validarSlugCliente('el-corte-ingles')).toBeNull()
    expect(validarSlugCliente('Caixa')).not.toBeNull()
    expect(validarSlugCliente('caixa--bank')).not.toBeNull()
    expect(validarSlugCliente('')).not.toBeNull()
    for (const r of ['login', 'logout', 'admin', 'archivos']) {
      expect(validarSlugCliente(r)).toMatch(/reservado/)
    }
  })

  it('normaliza y valida emails', () => {
    expect(normalizarEmail('  Ana@Cliente.COM ')).toBe('ana@cliente.com')
    expect(esEmailValido('ana@cliente.com')).toBe(true)
    expect(esEmailValido('ana@cliente')).toBe(false)
    expect(esEmailValido('ana cliente@x.com')).toBe(false)
    expect(esEmailInteractius('Carlos@Interactius.com')).toBe(true)
    expect(esEmailInteractius('carlos@interactius.com.evil.io')).toBe(false)
  })
})
```

- [ ] **Step 5: Ejecutar y comprobar que falla**

Run: `npm test`
Expected: FAIL, `Failed to resolve import "@/lib/clientes/ids"`.

- [ ] **Step 6: Implementar `ids.ts`**

`lib/clientes/ids.ts`:

```ts
import { randomBytes } from 'node:crypto'

/** 32 símbolos sin `0/o/1/l`: fáciles de dictar y copiar. */
export const ALFABETO = 'abcdefghijkmnpqrstuvwxyz23456789'

export const ID_ARTEFACTO_RE = /^[abcdefghijkmnpqrstuvwxyz23456789]{10}$/

/** 256 es múltiplo de 32, así que `b & 31` es uniforme. */
export function idAleatorio(longitud: number): string {
  let out = ''
  for (const b of randomBytes(longitud)) out += ALFABETO[b & 31]
  return out
}

export const SLUGS_RESERVADOS = ['login', 'logout', 'admin', 'archivos'] as const

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Devuelve el motivo del error o `null` si el slug es válido. */
export function validarSlugCliente(slug: string): string | null {
  if (!SLUG_RE.test(slug)) {
    return 'El cliente debe ir en minúsculas, con letras, números y guiones simples.'
  }
  if ((SLUGS_RESERVADOS as readonly string[]).includes(slug)) {
    return `"${slug}" es un nombre reservado por la zona de clientes.`
  }
  return null
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function esEmailInteractius(email: string): boolean {
  return normalizarEmail(email).endsWith('@interactius.com')
}
```

- [ ] **Step 7: Ejecutar tests, type-check y lint**

Run: `npm test && npm run type-check && npm run lint`
Expected: 4 tests PASS; sin errores.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts .gitignore CLAUDE.md lib/clientes
git commit -m "feat(clientes): base de la zona privada (tipos, ids, Vitest)"
```

---

### Task 2: Contraseñas

**Files:**
- Create: `lib/clientes/passwords.ts`
- Test: `lib/clientes/__tests__/passwords.test.ts`

**Interfaces:**
- Consumes: `idAleatorio` (Task 1).
- Produces: `generarPassword(): string`, `hashPassword(pw: string): Promise<string>`, `verificarPassword(pw: string, almacenado: string): Promise<boolean>`, `HASH_FICTICIO: string`.

- [ ] **Step 1: Escribir el test (falla)**

`lib/clientes/__tests__/passwords.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  HASH_FICTICIO,
  generarPassword,
  hashPassword,
  verificarPassword,
} from '@/lib/clientes/passwords'

describe('passwords', () => {
  it('genera 16 caracteres en grupos de 4', () => {
    expect(generarPassword()).toMatch(
      /^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/,
    )
  })

  it('verifica la contraseña correcta y rechaza otra', async () => {
    const pw = generarPassword()
    const hash = await hashPassword(pw)
    expect(hash).toMatch(/^scrypt\$N=16384,r=8,p=1\$/)
    expect(hash).not.toContain(pw)
    expect(await verificarPassword(pw, hash)).toBe(true)
    expect(await verificarPassword(generarPassword(), hash)).toBe(false)
  })

  it('tolera mayúsculas, espacios y guiones al teclear', async () => {
    const hash = await hashPassword('k7f3-q9xm-2pab-r4dz')
    expect(await verificarPassword(' K7F3 Q9XM 2PAB R4DZ ', hash)).toBe(true)
    expect(await verificarPassword('k7f3q9xm2pabr4dz', hash)).toBe(true)
  })

  it('dos hashes de la misma contraseña son distintos (salt)', async () => {
    expect(await hashPassword('a')).not.toBe(await hashPassword('a'))
  })

  it('rechaza hashes mal formados y el ficticio', async () => {
    expect(await verificarPassword('x', 'basura')).toBe(false)
    expect(await verificarPassword('x', 'scrypt$N=0,r=8,p=1$AA==$AA==')).toBe(false)
    expect(await verificarPassword('x', HASH_FICTICIO)).toBe(false)
  })
})
```

- [ ] **Step 2: Ejecutar y comprobar que falla**

Run: `npm test -- passwords`
Expected: FAIL, no resuelve `@/lib/clientes/passwords`.

- [ ] **Step 3: Implementar**

`lib/clientes/passwords.ts`:

```ts
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

import { idAleatorio } from './ids'

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>

const N = 16384
const R = 8
const P = 1
const KEYLEN = 32

/**
 * Hash con forma válida pero que no corresponde a ninguna contraseña. Se usa
 * para gastar el mismo tiempo cuando el usuario no existe.
 */
export const HASH_FICTICIO = `scrypt$N=${N},r=${R},p=${P}$${'A'.repeat(22)}==$${'A'.repeat(43)}=`

/** `k7f3-q9xm-2pab-r4dz`: ~80 bits. */
export function generarPassword(): string {
  return idAleatorio(16).match(/.{4}/g)!.join('-')
}

/** Las contraseñas son generadas: ignoramos mayúsculas, espacios y guiones. */
function normalizar(pw: string): string {
  return pw.normalize('NFKC').toLowerCase().replace(/[\s-]/g, '')
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scrypt(normalizar(pw), salt, KEYLEN, { N, r: R, p: P })
  return `scrypt$N=${N},r=${R},p=${P}$${salt.toString('base64')}$${hash.toString('base64')}`
}

export async function verificarPassword(
  pw: string,
  almacenado: string,
): Promise<boolean> {
  const partes = almacenado.split('$')
  if (partes.length !== 4 || partes[0] !== 'scrypt') return false
  const params = Object.fromEntries(
    partes[1].split(',').map((kv) => kv.split('=') as [string, string]),
  )
  const n = Number(params.N)
  const r = Number(params.r)
  const p = Number(params.p)
  if (!n || !r || !p) return false
  const salt = Buffer.from(partes[2], 'base64')
  const esperado = Buffer.from(partes[3], 'base64')
  if (salt.length === 0 || esperado.length === 0) return false
  const calculado = await scrypt(normalizar(pw), salt, esperado.length, { N: n, r, p })
  return timingSafeEqual(calculado, esperado)
}
```

- [ ] **Step 4: Ejecutar tests**

Run: `npm test -- passwords`
Expected: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/clientes/passwords.ts lib/clientes/__tests__/passwords.test.ts
git commit -m "feat(clientes): generación y hash scrypt de contraseñas"
```

---

### Task 3: Tokens de sesión y de archivo

**Files:**
- Create: `lib/clientes/hmac.ts`, `lib/clientes/session.ts`, `lib/clientes/file-tokens.ts`
- Test: `lib/clientes/__tests__/session.test.ts`, `lib/clientes/__tests__/file-tokens.test.ts`

**Interfaces:**
- Produces:
  - `firmar(datos: string, secreto: string): string`, `firmaValida(datos: string, firma: string, secreto: string): boolean`
  - `COOKIE_SESION = '__Host-ia_clientes'`, `DURACION_SESION_MS`, `interface Sesion { email: string; emitidaEn: number; expira: number }`, `crearTokenSesion(email: string, ahora: number, secreto: string): string`, `leerTokenSesion(token: string | undefined, ahora: number, secreto: string): Sesion | null`
  - `DURACION_TOKEN_ARCHIVO_MS`, `crearTokenArchivo(id: string, version: number, ahora: number, secreto: string): { token: string; expira: number }`, `verificarTokenArchivo(token: string, id: string, version: number, ahora: number, secreto: string): boolean`

- [ ] **Step 1: Escribir los tests (fallan)**

`lib/clientes/__tests__/session.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  DURACION_SESION_MS,
  crearTokenSesion,
  leerTokenSesion,
} from '@/lib/clientes/session'

const S = 'x'.repeat(32)
const T0 = 1_800_000_000_000

describe('session', () => {
  it('ida y vuelta', () => {
    const t = crearTokenSesion('ana@cliente.com', T0, S)
    expect(leerTokenSesion(t, T0 + 1000, S)).toEqual({
      email: 'ana@cliente.com',
      emitidaEn: T0,
      expira: T0 + DURACION_SESION_MS,
    })
  })

  it('caduca a los 7 días', () => {
    const t = crearTokenSesion('ana@cliente.com', T0, S)
    expect(leerTokenSesion(t, T0 + DURACION_SESION_MS + 1, S)).toBeNull()
  })

  it('rechaza otro secreto, manipulación y basura', () => {
    const t = crearTokenSesion('ana@cliente.com', T0, S)
    expect(leerTokenSesion(t, T0, 'y'.repeat(32))).toBeNull()
    const [, emitida, expira, firma] = t.split('.')
    const otro = Buffer.from('luis@cliente.com').toString('base64url')
    expect(leerTokenSesion([otro, emitida, expira, firma].join('.'), T0, S)).toBeNull()
    expect(leerTokenSesion(undefined, T0, S)).toBeNull()
    expect(leerTokenSesion('a.b.c', T0, S)).toBeNull()
  })
})
```

`lib/clientes/__tests__/file-tokens.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  DURACION_TOKEN_ARCHIVO_MS,
  crearTokenArchivo,
  verificarTokenArchivo,
} from '@/lib/clientes/file-tokens'

const S = 'x'.repeat(32)
const T0 = 1_800_000_000_000

describe('file-tokens', () => {
  it('válido para su artefacto y versión durante 15 minutos', () => {
    const { token, expira } = crearTokenArchivo('k7f3q9xm2p', 2, T0, S)
    expect(expira).toBe(T0 + DURACION_TOKEN_ARCHIVO_MS)
    expect(token).toMatch(/^[A-Za-z0-9_.-]+$/)
    expect(verificarTokenArchivo(token, 'k7f3q9xm2p', 2, T0 + 60_000, S)).toBe(true)
    expect(verificarTokenArchivo(token, 'k7f3q9xm2p', 2, expira + 1, S)).toBe(false)
  })

  it('no sirve para otro artefacto, otra versión u otro secreto', () => {
    const { token } = crearTokenArchivo('k7f3q9xm2p', 2, T0, S)
    expect(verificarTokenArchivo(token, 'aaaaaaaaaa', 2, T0, S)).toBe(false)
    expect(verificarTokenArchivo(token, 'k7f3q9xm2p', 3, T0, S)).toBe(false)
    expect(verificarTokenArchivo(token, 'k7f3q9xm2p', 2, T0, 'y'.repeat(32))).toBe(false)
    expect(verificarTokenArchivo('basura', 'k7f3q9xm2p', 2, T0, S)).toBe(false)
  })
})
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm test -- session file-tokens`
Expected: FAIL, módulos no encontrados.

- [ ] **Step 3: Implementar**

`lib/clientes/hmac.ts`:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

export function firmar(datos: string, secreto: string): string {
  return createHmac('sha256', secreto).update(datos).digest('base64url')
}

export function firmaValida(datos: string, firma: string, secreto: string): boolean {
  const esperada = Buffer.from(firmar(datos, secreto))
  const recibida = Buffer.from(firma)
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida)
}
```

`lib/clientes/session.ts`:

```ts
import { firmaValida, firmar } from './hmac'

/** `__Host-` obliga a Secure, Path=/ y sin Domain: no se comparte con subdominios. */
export const COOKIE_SESION = '__Host-ia_clientes'
export const DURACION_SESION_MS = 7 * 24 * 60 * 60 * 1000

export interface Sesion {
  email: string
  emitidaEn: number
  expira: number
}

/** Formato: `<email b64url>.<emitidaEn>.<expira>.<firma>`. */
export function crearTokenSesion(email: string, ahora: number, secreto: string): string {
  const carga = [
    Buffer.from(email).toString('base64url'),
    String(ahora),
    String(ahora + DURACION_SESION_MS),
  ].join('.')
  return `${carga}.${firmar(`sesion|${carga}`, secreto)}`
}

export function leerTokenSesion(
  token: string | undefined,
  ahora: number,
  secreto: string,
): Sesion | null {
  if (!token) return null
  const partes = token.split('.')
  if (partes.length !== 4) return null
  const [emailB64, emitidaStr, expiraStr, firma] = partes
  const carga = `${emailB64}.${emitidaStr}.${expiraStr}`
  if (!firmaValida(`sesion|${carga}`, firma, secreto)) return null
  const emitidaEn = Number(emitidaStr)
  const expira = Number(expiraStr)
  if (!Number.isFinite(emitidaEn) || !Number.isFinite(expira) || ahora > expira) return null
  return { email: Buffer.from(emailB64, 'base64url').toString('utf8'), emitidaEn, expira }
}
```

`lib/clientes/file-tokens.ts`:

```ts
import { firmaValida, firmar } from './hmac'

export const DURACION_TOKEN_ARCHIVO_MS = 15 * 60 * 1000

/**
 * El iframe del artefacto corre con origen opaco (CSP sandbox) y no envía la
 * cookie en sus subrecursos; por eso los archivos se autorizan con este token
 * en la ruta. Formato: `<expira base36>.<firma>`.
 */
export function crearTokenArchivo(
  id: string,
  version: number,
  ahora: number,
  secreto: string,
): { token: string; expira: number } {
  const expira = ahora + DURACION_TOKEN_ARCHIVO_MS
  const firma = firmar(`archivo|${id}|${version}|${expira}`, secreto)
  return { token: `${expira.toString(36)}.${firma}`, expira }
}

export function verificarTokenArchivo(
  token: string,
  id: string,
  version: number,
  ahora: number,
  secreto: string,
): boolean {
  const partes = token.split('.')
  if (partes.length !== 2) return false
  const expira = parseInt(partes[0], 36)
  if (!Number.isFinite(expira) || ahora > expira) return false
  return firmaValida(`archivo|${id}|${version}|${expira}`, partes[1], secreto)
}
```

- [ ] **Step 4: Ejecutar tests**

Run: `npm test`
Expected: todos PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/clientes/hmac.ts lib/clientes/session.ts lib/clientes/file-tokens.ts lib/clientes/__tests__
git commit -m "feat(clientes): tokens firmados de sesión y de archivo"
```

---

### Task 4: Almacenamiento (interfaz, memoria, Netlify Blobs y repo)

**Files:**
- Create: `lib/clientes/store.ts`, `lib/clientes/memory-store.ts`, `lib/clientes/netlify-store.ts`, `lib/clientes/repo.ts`
- Test: `lib/clientes/__tests__/repo.test.ts`

**Interfaces:**
- Consumes: tipos (Task 1), `normalizarEmail` (Task 1).
- Produces:
  - `interface AlmacenBlobs { leerJSON<T>(clave: string): Promise<T | null>; escribirJSON(clave: string, valor: unknown): Promise<void>; leerArchivo(clave: string): Promise<{ datos: ArrayBuffer; contentType: string } | null>; escribirArchivo(clave: string, datos: Uint8Array, contentType: string): Promise<void>; borrar(clave: string): Promise<void>; listar(prefijo: string): Promise<string[]> }`
  - `interface Almacenes { artefactos: AlmacenBlobs; registro: AlmacenBlobs; usuarios: AlmacenBlobs }`
  - `crearAlmacenesEnMemoria(): Almacenes`
  - `crearAlmacenesNetlify(entorno: Entorno, opciones?: { siteID?: string; token?: string }): Almacenes`
  - `claveArchivo(id: string, version: number, ruta: string): string`
  - `leerArtefacto(a, id): Promise<Artefacto | null>`, `guardarArtefacto(a, art): Promise<void>`, `borrarFichaArtefacto(a, id): Promise<void>`, `listarArtefactos(a): Promise<Artefacto[]>`
  - `leerUsuario(a, email): Promise<Usuario | null>`, `guardarUsuario(a, u): Promise<void>`, `listarUsuarios(a): Promise<Usuario[]>`
  - `registrarUltimoAcceso(a, id, email, ahora: number): Promise<void>`, `leerUltimoAcceso(a, id, email): Promise<string | null>`, `borrarUltimosAccesos(a, id): Promise<void>`

- [ ] **Step 1: Escribir el test (falla)**

`lib/clientes/__tests__/repo.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { crearAlmacenesEnMemoria } from '@/lib/clientes/memory-store'
import {
  borrarUltimosAccesos,
  claveArchivo,
  guardarArtefacto,
  guardarUsuario,
  leerArtefacto,
  leerUltimoAcceso,
  leerUsuario,
  listarArtefactos,
  listarUsuarios,
  registrarUltimoAcceso,
} from '@/lib/clientes/repo'
import type { Artefacto, Usuario } from '@/lib/clientes/types'

const art = (id: string, cliente: string, publicadoEn: string): Artefacto => ({
  id, cliente, titulo: id, origen: 'https://claude.ai/artifact/x', version: 1,
  publicadoEn, publicadoPor: 'test', entrada: 'index.html', avisos: [], accesos: {},
})

const usuario: Usuario = {
  email: 'ana@cliente.com', hash: 'h', admin: false, creadoEn: 'c',
  credencialesEn: 'c', fallos: 0, bloqueadoHasta: null,
}

describe('repo', () => {
  it('guarda y lee artefactos, ordenados por cliente y fecha desc', async () => {
    const a = crearAlmacenesEnMemoria()
    await guardarArtefacto(a, art('bbbbbbbbbb', 'zara', '2026-01-01'))
    await guardarArtefacto(a, art('aaaaaaaaaa', 'caixabank', '2026-01-01'))
    await guardarArtefacto(a, art('cccccccccc', 'caixabank', '2026-02-01'))
    expect((await leerArtefacto(a, 'aaaaaaaaaa'))?.cliente).toBe('caixabank')
    expect(await leerArtefacto(a, 'nonononono')).toBeNull()
    expect((await listarArtefactos(a)).map((x) => x.id)).toEqual([
      'cccccccccc', 'aaaaaaaaaa', 'bbbbbbbbbb',
    ])
  })

  it('usuarios por email normalizado', async () => {
    const a = crearAlmacenesEnMemoria()
    await guardarUsuario(a, usuario)
    expect((await leerUsuario(a, ' ANA@cliente.com'))?.email).toBe('ana@cliente.com')
    expect(await listarUsuarios(a)).toHaveLength(1)
  })

  it('último acceso separado de la ficha', async () => {
    const a = crearAlmacenesEnMemoria()
    await registrarUltimoAcceso(a, 'aaaaaaaaaa', 'ana@cliente.com', Date.UTC(2026, 0, 2))
    expect(await leerUltimoAcceso(a, 'aaaaaaaaaa', 'ana@cliente.com')).toBe('2026-01-02T00:00:00.000Z')
    await borrarUltimosAccesos(a, 'aaaaaaaaaa')
    expect(await leerUltimoAcceso(a, 'aaaaaaaaaa', 'ana@cliente.com')).toBeNull()
  })

  it('archivos con contentType', async () => {
    const a = crearAlmacenesEnMemoria()
    const clave = claveArchivo('aaaaaaaaaa', 2, 'css/app.css')
    expect(clave).toBe('aaaaaaaaaa/v2/css/app.css')
    await a.artefactos.escribirArchivo(clave, new TextEncoder().encode('body{}'), 'text/css')
    const leido = await a.artefactos.leerArchivo(clave)
    expect(leido?.contentType).toBe('text/css')
    expect(new TextDecoder().decode(leido!.datos)).toBe('body{}')
    expect(await a.artefactos.listar('aaaaaaaaaa/v2/')).toEqual([clave])
  })
})
```

- [ ] **Step 2: Ejecutar y comprobar que falla**

Run: `npm test -- repo`
Expected: FAIL, módulos no encontrados.

- [ ] **Step 3: Implementar la interfaz y el store en memoria**

`lib/clientes/store.ts`:

```ts
/**
 * Almacenamiento clave-valor mínimo que necesita la zona de clientes. En
 * producción lo implementa Netlify Blobs (`netlify-store.ts`); en los tests,
 * un Map (`memory-store.ts`).
 */
export interface AlmacenBlobs {
  leerJSON<T>(clave: string): Promise<T | null>
  escribirJSON(clave: string, valor: unknown): Promise<void>
  leerArchivo(clave: string): Promise<{ datos: ArrayBuffer; contentType: string } | null>
  escribirArchivo(clave: string, datos: Uint8Array, contentType: string): Promise<void>
  borrar(clave: string): Promise<void>
  listar(prefijo: string): Promise<string[]>
}

export interface Almacenes {
  /** Archivos de los artefactos: `<id>/v<version>/<ruta>`. */
  artefactos: AlmacenBlobs
  /** Fichas (`artefactos/<id>`) y últimos accesos (`ultimos-accesos/<id>/<email>`). */
  registro: AlmacenBlobs
  /** Cuentas: `usuarios/<email>`. */
  usuarios: AlmacenBlobs
}
```

`lib/clientes/memory-store.ts`:

```ts
import type { AlmacenBlobs, Almacenes } from './store'

function crearAlmacen(): AlmacenBlobs {
  const json = new Map<string, string>()
  const archivos = new Map<string, { datos: Uint8Array; contentType: string }>()
  return {
    async leerJSON<T>(clave: string) {
      const v = json.get(clave)
      return v === undefined ? null : (JSON.parse(v) as T)
    },
    async escribirJSON(clave, valor) {
      json.set(clave, JSON.stringify(valor))
    },
    async leerArchivo(clave) {
      const v = archivos.get(clave)
      if (!v) return null
      return { datos: v.datos.slice().buffer as ArrayBuffer, contentType: v.contentType }
    },
    async escribirArchivo(clave, datos, contentType) {
      archivos.set(clave, { datos: datos.slice(), contentType })
    },
    async borrar(clave) {
      json.delete(clave)
      archivos.delete(clave)
    },
    async listar(prefijo) {
      return [...json.keys(), ...archivos.keys()].filter((k) => k.startsWith(prefijo)).sort()
    },
  }
}

export function crearAlmacenesEnMemoria(): Almacenes {
  return { artefactos: crearAlmacen(), registro: crearAlmacen(), usuarios: crearAlmacen() }
}
```

- [ ] **Step 4: Implementar el store de Netlify**

`lib/clientes/netlify-store.ts`:

```ts
import { getStore, type Store } from '@netlify/blobs'

import type { AlmacenBlobs, Almacenes } from './store'
import type { Entorno } from './types'

function adaptar(store: Store): AlmacenBlobs {
  return {
    async leerJSON<T>(clave: string) {
      return ((await store.get(clave, { type: 'json' })) as T | null) ?? null
    },
    async escribirJSON(clave, valor) {
      await store.setJSON(clave, valor)
    },
    async leerArchivo(clave) {
      const r = await store.getWithMetadata(clave, { type: 'arrayBuffer' })
      if (!r) return null
      const contentType =
        typeof r.metadata.contentType === 'string'
          ? r.metadata.contentType
          : 'application/octet-stream'
      return { datos: r.data, contentType }
    },
    async escribirArchivo(clave, datos, contentType) {
      await store.set(clave, datos.slice().buffer as ArrayBuffer, { metadata: { contentType } })
    },
    async borrar(clave) {
      await store.delete(clave)
    },
    async listar(prefijo) {
      const { blobs } = await store.list({ prefix: prefijo })
      return blobs.map((b) => b.key).sort()
    },
  }
}

export interface OpcionesNetlify {
  /** Solo fuera de Netlify (CLI): ID del sitio y token personal. */
  siteID?: string
  token?: string
}

/**
 * En runtime (funciones de Netlify) el contexto de Blobs llega solo y pedimos
 * consistencia fuerte para que una revocación se note al instante. Desde la
 * CLI se accede por API con siteID + token, que ya es consistente; ahí no se
 * pasa `consistency` porque exige un `uncachedEdgeURL` que solo existe en
 * runtime.
 */
export function crearAlmacenesNetlify(
  entorno: Entorno,
  opciones: OpcionesNetlify = {},
): Almacenes {
  const porApi = Boolean(opciones.siteID && opciones.token)
  const crear = (base: string) =>
    adaptar(
      porApi
        ? getStore({ name: `${base}-${entorno}`, siteID: opciones.siteID!, token: opciones.token! })
        : getStore({ name: `${base}-${entorno}`, consistency: 'strong' }),
    )
  return {
    artefactos: crear('clientes-artefactos'),
    registro: crear('clientes-registro'),
    usuarios: crear('clientes-usuarios'),
  }
}
```

- [ ] **Step 5: Implementar el repo**

`lib/clientes/repo.ts`:

```ts
import { normalizarEmail } from './ids'
import type { Almacenes } from './store'
import type { Artefacto, Usuario } from './types'

const PREFIJO_ARTEFACTOS = 'artefactos/'
const PREFIJO_USUARIOS = 'usuarios/'
const PREFIJO_ULTIMOS = 'ultimos-accesos/'

export const claveArchivo = (id: string, version: number, ruta: string) =>
  `${id}/v${version}/${ruta}`

export async function leerArtefacto(a: Almacenes, id: string) {
  return a.registro.leerJSON<Artefacto>(`${PREFIJO_ARTEFACTOS}${id}`)
}

export async function guardarArtefacto(a: Almacenes, art: Artefacto) {
  await a.registro.escribirJSON(`${PREFIJO_ARTEFACTOS}${art.id}`, art)
}

export async function borrarFichaArtefacto(a: Almacenes, id: string) {
  await a.registro.borrar(`${PREFIJO_ARTEFACTOS}${id}`)
}

/** Por cliente (A→Z) y, dentro, el más reciente primero. */
export async function listarArtefactos(a: Almacenes): Promise<Artefacto[]> {
  const claves = await a.registro.listar(PREFIJO_ARTEFACTOS)
  const fichas = await Promise.all(claves.map((k) => a.registro.leerJSON<Artefacto>(k)))
  return fichas
    .filter((f): f is Artefacto => f !== null)
    .sort(
      (x, y) =>
        x.cliente.localeCompare(y.cliente) || y.publicadoEn.localeCompare(x.publicadoEn),
    )
}

export async function leerUsuario(a: Almacenes, email: string) {
  return a.usuarios.leerJSON<Usuario>(`${PREFIJO_USUARIOS}${normalizarEmail(email)}`)
}

export async function guardarUsuario(a: Almacenes, u: Usuario) {
  await a.usuarios.escribirJSON(`${PREFIJO_USUARIOS}${normalizarEmail(u.email)}`, u)
}

export async function listarUsuarios(a: Almacenes): Promise<Usuario[]> {
  const claves = await a.usuarios.listar(PREFIJO_USUARIOS)
  const usuarios = await Promise.all(claves.map((k) => a.usuarios.leerJSON<Usuario>(k)))
  return usuarios
    .filter((u): u is Usuario => u !== null)
    .sort((x, y) => x.email.localeCompare(y.email))
}

export async function registrarUltimoAcceso(
  a: Almacenes,
  id: string,
  email: string,
  ahora: number,
) {
  await a.registro.escribirJSON(`${PREFIJO_ULTIMOS}${id}/${normalizarEmail(email)}`, {
    en: new Date(ahora).toISOString(),
  })
}

export async function leerUltimoAcceso(a: Almacenes, id: string, email: string) {
  const v = await a.registro.leerJSON<{ en: string }>(
    `${PREFIJO_ULTIMOS}${id}/${normalizarEmail(email)}`,
  )
  return v?.en ?? null
}

export async function borrarUltimosAccesos(a: Almacenes, id: string) {
  const claves = await a.registro.listar(`${PREFIJO_ULTIMOS}${id}/`)
  await Promise.all(claves.map((k) => a.registro.borrar(k)))
}
```

- [ ] **Step 6: Ejecutar tests y type-check**

Run: `npm test && npm run type-check`
Expected: todos PASS; sin errores de tipos (si `@netlify/blobs` 11 cambia alguna firma de `get`/`getWithMetadata`/`list`, ajustar el adaptador a los tipos del paquete sin cambiar la interfaz `AlmacenBlobs`).

- [ ] **Step 7: Commit**

```bash
git add lib/clientes
git commit -m "feat(clientes): almacenamiento en Netlify Blobs y repo tipado"
```

---

### Task 5: Login con bloqueo y control de acceso

**Files:**
- Create: `lib/clientes/auth.ts`, `lib/clientes/access.ts`
- Test: `lib/clientes/__tests__/auth.test.ts`, `lib/clientes/__tests__/access.test.ts`

**Interfaces:**
- Consumes: `verificarPassword`, `HASH_FICTICIO` (Task 2); `leerTokenSesion` (Task 3); `leerUsuario`, `guardarUsuario`, `registrarUltimoAcceso` (Task 4).
- Produces:
  - `MAX_FALLOS = 5`, `BLOQUEO_MS`, `type ResultadoLogin = { ok: true; usuario: Usuario } | { ok: false; motivo: 'credenciales' | 'bloqueado' }`, `autenticar(a, email, password, ahora: number): Promise<ResultadoLogin>`
  - `usuarioDeSesion(a, token: string | undefined, ahora: number, secreto: string): Promise<Usuario | null>`, `puedeVer(u: Usuario, art: Artefacto): boolean`, `registrarAcceso(a, id, email, ahora): Promise<void>`

- [ ] **Step 1: Escribir los tests (fallan)**

`lib/clientes/__tests__/auth.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { BLOQUEO_MS, MAX_FALLOS, autenticar } from '@/lib/clientes/auth'
import { crearAlmacenesEnMemoria } from '@/lib/clientes/memory-store'
import { hashPassword } from '@/lib/clientes/passwords'
import { guardarUsuario, leerUsuario } from '@/lib/clientes/repo'

const T0 = Date.UTC(2026, 10, 20)

async function conUsuario(hash: string | null = null) {
  const a = crearAlmacenesEnMemoria()
  await guardarUsuario(a, {
    email: 'ana@cliente.com',
    hash: hash ?? (await hashPassword('aaaa-bbbb-cccc-dddd')),
    admin: false, creadoEn: 'c', credencialesEn: new Date(T0).toISOString(),
    fallos: 0, bloqueadoHasta: null,
  })
  return a
}

describe('autenticar', () => {
  it('acepta credenciales correctas', async () => {
    const a = await conUsuario()
    const r = await autenticar(a, 'ANA@cliente.com', 'aaaa-bbbb-cccc-dddd', T0)
    expect(r.ok).toBe(true)
  })

  it('usuario inexistente y contraseña mala dan el mismo motivo', async () => {
    const a = await conUsuario()
    expect(await autenticar(a, 'nadie@x.com', 'x', T0)).toEqual({ ok: false, motivo: 'credenciales' })
    expect(await autenticar(a, 'ana@cliente.com', 'x', T0)).toEqual({ ok: false, motivo: 'credenciales' })
  })

  it(`bloquea tras ${MAX_FALLOS} fallos y desbloquea a los 15 min`, async () => {
    const a = await conUsuario()
    for (let i = 1; i < MAX_FALLOS; i++) {
      expect((await autenticar(a, 'ana@cliente.com', 'x', T0)).ok).toBe(false)
    }
    expect(await autenticar(a, 'ana@cliente.com', 'x', T0)).toEqual({ ok: false, motivo: 'bloqueado' })
    // Ni la contraseña buena entra mientras dura el bloqueo.
    expect(await autenticar(a, 'ana@cliente.com', 'aaaa-bbbb-cccc-dddd', T0 + 1000)).toEqual({ ok: false, motivo: 'bloqueado' })
    expect((await autenticar(a, 'ana@cliente.com', 'aaaa-bbbb-cccc-dddd', T0 + BLOQUEO_MS + 1)).ok).toBe(true)
    expect((await leerUsuario(a, 'ana@cliente.com'))?.bloqueadoHasta).toBeNull()
  })

  it('un login correcto pone el contador a cero', async () => {
    const a = await conUsuario()
    await autenticar(a, 'ana@cliente.com', 'x', T0)
    await autenticar(a, 'ana@cliente.com', 'aaaa-bbbb-cccc-dddd', T0)
    expect((await leerUsuario(a, 'ana@cliente.com'))?.fallos).toBe(0)
  })

  it('un usuario desactivado no entra', async () => {
    const a = crearAlmacenesEnMemoria()
    await guardarUsuario(a, {
      email: 'ana@cliente.com', hash: null, admin: false, creadoEn: 'c',
      credencialesEn: 'c', fallos: 0, bloqueadoHasta: null,
    })
    expect(await autenticar(a, 'ana@cliente.com', 'x', T0)).toEqual({ ok: false, motivo: 'credenciales' })
  })
})
```

`lib/clientes/__tests__/access.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { puedeVer, registrarAcceso, usuarioDeSesion } from '@/lib/clientes/access'
import { crearAlmacenesEnMemoria } from '@/lib/clientes/memory-store'
import { guardarUsuario, leerUltimoAcceso } from '@/lib/clientes/repo'
import { crearTokenSesion } from '@/lib/clientes/session'
import type { Artefacto, Usuario } from '@/lib/clientes/types'

const S = 'x'.repeat(32)
const T0 = Date.UTC(2026, 10, 20)

const base: Usuario = {
  email: 'ana@cliente.com', hash: 'h', admin: false, creadoEn: 'c',
  credencialesEn: new Date(T0).toISOString(), fallos: 0, bloqueadoHasta: null,
}

const art = (accesos: string[]): Artefacto => ({
  id: 'aaaaaaaaaa', cliente: 'caixabank', titulo: 't', origen: 'o', version: 1,
  publicadoEn: 'p', publicadoPor: 'x', entrada: 'index.html', avisos: [],
  accesos: Object.fromEntries(accesos.map((e) => [e, { concedidoEn: 'c' }])),
})

describe('usuarioDeSesion', () => {
  it('devuelve el usuario con sesión válida', async () => {
    const a = crearAlmacenesEnMemoria()
    await guardarUsuario(a, base)
    const t = crearTokenSesion('ana@cliente.com', T0 + 1, S)
    expect((await usuarioDeSesion(a, t, T0 + 2, S))?.email).toBe('ana@cliente.com')
  })

  it('invalida sesiones anteriores a regenerar credenciales', async () => {
    const a = crearAlmacenesEnMemoria()
    const t = crearTokenSesion('ana@cliente.com', T0 + 1, S)
    await guardarUsuario(a, { ...base, credencialesEn: new Date(T0 + 10).toISOString() })
    expect(await usuarioDeSesion(a, t, T0 + 20, S)).toBeNull()
  })

  it('usuario desactivado o borrado no tiene sesión', async () => {
    const a = crearAlmacenesEnMemoria()
    const t = crearTokenSesion('ana@cliente.com', T0 + 1, S)
    expect(await usuarioDeSesion(a, t, T0 + 2, S)).toBeNull()
    await guardarUsuario(a, { ...base, hash: null })
    expect(await usuarioDeSesion(a, t, T0 + 2, S)).toBeNull()
  })
})

describe('puedeVer', () => {
  it('solo las personas asignadas, y los admin', () => {
    expect(puedeVer(base, art(['ana@cliente.com']))).toBe(true)
    expect(puedeVer(base, art(['luis@cliente.com']))).toBe(false)
    expect(puedeVer({ ...base, email: 'eq@interactius.com', admin: true }, art([]))).toBe(true)
  })
})

describe('registrarAcceso', () => {
  it('guarda la fecha del último acceso', async () => {
    const a = crearAlmacenesEnMemoria()
    await registrarAcceso(a, 'aaaaaaaaaa', 'ana@cliente.com', T0)
    expect(await leerUltimoAcceso(a, 'aaaaaaaaaa', 'ana@cliente.com')).toBe(new Date(T0).toISOString())
  })
})
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm test -- auth access`
Expected: FAIL, módulos no encontrados.

- [ ] **Step 3: Implementar**

`lib/clientes/auth.ts`:

```ts
import { HASH_FICTICIO, verificarPassword } from './passwords'
import { guardarUsuario, leerUsuario } from './repo'
import type { Almacenes } from './store'
import type { Usuario } from './types'

export const MAX_FALLOS = 5
export const BLOQUEO_MS = 15 * 60 * 1000

export type ResultadoLogin =
  | { ok: true; usuario: Usuario }
  | { ok: false; motivo: 'credenciales' | 'bloqueado' }

export async function autenticar(
  a: Almacenes,
  email: string,
  password: string,
  ahora: number,
): Promise<ResultadoLogin> {
  const usuario = await leerUsuario(a, email)

  if (!usuario || !usuario.hash) {
    // Mismo coste que una verificación real: no revelar si el usuario existe.
    await verificarPassword(password, HASH_FICTICIO)
    return { ok: false, motivo: 'credenciales' }
  }

  if (usuario.bloqueadoHasta && Date.parse(usuario.bloqueadoHasta) > ahora) {
    return { ok: false, motivo: 'bloqueado' }
  }

  if (!(await verificarPassword(password, usuario.hash))) {
    const fallos = usuario.fallos + 1
    const bloquear = fallos >= MAX_FALLOS
    await guardarUsuario(a, {
      ...usuario,
      fallos: bloquear ? 0 : fallos,
      bloqueadoHasta: bloquear ? new Date(ahora + BLOQUEO_MS).toISOString() : null,
    })
    return { ok: false, motivo: bloquear ? 'bloqueado' : 'credenciales' }
  }

  if (usuario.fallos !== 0 || usuario.bloqueadoHasta) {
    await guardarUsuario(a, { ...usuario, fallos: 0, bloqueadoHasta: null })
  }
  return { ok: true, usuario: { ...usuario, fallos: 0, bloqueadoHasta: null } }
}
```

`lib/clientes/access.ts`:

```ts
import { leerUsuario, registrarUltimoAcceso } from './repo'
import { leerTokenSesion } from './session'
import type { Almacenes } from './store'
import type { Artefacto, Usuario } from './types'

/**
 * Se llama en CADA petición: además de la firma, comprueba que el usuario
 * sigue existiendo, activo, y que la sesión es posterior a su última
 * regeneración de contraseña. Así revocar o regenerar surte efecto al momento.
 */
export async function usuarioDeSesion(
  a: Almacenes,
  token: string | undefined,
  ahora: number,
  secreto: string,
): Promise<Usuario | null> {
  const sesion = leerTokenSesion(token, ahora, secreto)
  if (!sesion) return null
  const usuario = await leerUsuario(a, sesion.email)
  if (!usuario || !usuario.hash) return null
  if (sesion.emitidaEn < Date.parse(usuario.credencialesEn)) return null
  return usuario
}

/** Los admin de Interactius pueden revisar cualquier artefacto. */
export function puedeVer(usuario: Usuario, artefacto: Artefacto): boolean {
  return usuario.admin || Object.hasOwn(artefacto.accesos, usuario.email)
}

export async function registrarAcceso(
  a: Almacenes,
  id: string,
  email: string,
  ahora: number,
): Promise<void> {
  await registrarUltimoAcceso(a, id, email, ahora)
}
```

- [ ] **Step 4: Ejecutar tests**

Run: `npm test`
Expected: todos PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/clientes
git commit -m "feat(clientes): login con bloqueo por intentos y control de acceso por artefacto"
```

---

### Task 6: Operaciones de gestión

**Files:**
- Create: `lib/clientes/operations.ts`
- Test: `lib/clientes/__tests__/operations.test.ts`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces:
  - `class ErrorOperacion extends Error`
  - `detectarAvisos(archivos: ArchivoArtefacto[]): string[]`
  - `publicar(a, datos: { cliente: string; titulo: string; origen: string; entrada: string; archivos: ArchivoArtefacto[]; avisos: string[]; publicadoPor: string }, ahora: number): Promise<Artefacto>`
  - `republicar(a, id: string, datos: { archivos: ArchivoArtefacto[]; avisos: string[]; entrada?: string; publicadoPor: string }, ahora: number): Promise<Artefacto>`
  - `darAcceso(a, id: string, email: string, ahora: number): Promise<{ artefacto: Artefacto; email: string; password: string | null }>`
  - `quitarAcceso(a, id: string, email: string): Promise<boolean>`
  - `regenerarPassword(a, email: string, ahora: number): Promise<string>`
  - `crearAdmin(a, email: string, ahora: number): Promise<string>`
  - `desactivarUsuario(a, email: string, ahora: number): Promise<void>`
  - `borrarArtefacto(a, id: string): Promise<void>`
  - `interface FilaAdmin { artefacto: Artefacto; personas: PersonaConAcceso[] }`
  - `interface PersonaConAcceso { email: string; concedidoEn: string; ultimoAcceso: string | null; activo: boolean }`, `type UsuarioPublico = Omit<Usuario, 'hash'> & { activo: boolean }`
  - `resumenAdmin(a): Promise<{ artefactos: FilaAdmin[]; usuarios: UsuarioPublico[] }>`

- [ ] **Step 1: Escribir el test (falla)**

`lib/clientes/__tests__/operations.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { autenticar } from '@/lib/clientes/auth'
import { crearAlmacenesEnMemoria } from '@/lib/clientes/memory-store'
import {
  ErrorOperacion,
  borrarArtefacto,
  crearAdmin,
  darAcceso,
  desactivarUsuario,
  detectarAvisos,
  publicar,
  quitarAcceso,
  regenerarPassword,
  republicar,
  resumenAdmin,
} from '@/lib/clientes/operations'
import { claveArchivo, leerArtefacto, leerUsuario } from '@/lib/clientes/repo'
import type { ArchivoArtefacto } from '@/lib/clientes/types'

const T0 = Date.UTC(2026, 10, 20)
const html = (s: string): ArchivoArtefacto => ({
  ruta: 'index.html', datos: new TextEncoder().encode(s), contentType: 'text/html; charset=utf-8',
})
const datosBase = {
  cliente: 'caixabank', titulo: 'PoC', origen: 'https://claude.ai/artifact/x',
  entrada: 'index.html', avisos: [], publicadoPor: 'test',
}

describe('detectarAvisos', () => {
  it('avisa si el artefacto usa window.claude', () => {
    expect(detectarAvisos([html('<script>window.claude.ask()</script>')])).toHaveLength(1)
    expect(detectarAvisos([html('<p>hola</p>')])).toEqual([])
  })
})

describe('publicar y republicar', () => {
  it('publica v1 con id aleatorio', async () => {
    const a = crearAlmacenesEnMemoria()
    const art = await publicar(a, { ...datosBase, archivos: [html('v1')] }, T0)
    expect(art.version).toBe(1)
    expect(art.id).toMatch(/^[a-z2-9]{10}$/)
    expect(await a.artefactos.leerArchivo(claveArchivo(art.id, 1, 'index.html'))).not.toBeNull()
  })

  it('rechaza cliente reservado y entrada inexistente', async () => {
    const a = crearAlmacenesEnMemoria()
    await expect(publicar(a, { ...datosBase, cliente: 'admin', archivos: [html('x')] }, T0)).rejects.toThrow(ErrorOperacion)
    await expect(publicar(a, { ...datosBase, entrada: 'otra.html', archivos: [html('x')] }, T0)).rejects.toThrow(/entrada/)
  })

  it('republica: sube versión, conserva accesos y borra la anterior', async () => {
    const a = crearAlmacenesEnMemoria()
    const art = await publicar(a, { ...datosBase, archivos: [html('v1')] }, T0)
    await darAcceso(a, art.id, 'ana@cliente.com', T0)
    const v2 = await republicar(a, art.id, { archivos: [html('v2')], avisos: [], publicadoPor: 'test' }, T0 + 1)
    expect(v2.version).toBe(2)
    expect(Object.keys(v2.accesos)).toEqual(['ana@cliente.com'])
    expect(await a.artefactos.leerArchivo(claveArchivo(art.id, 1, 'index.html'))).toBeNull()
    expect(await a.artefactos.leerArchivo(claveArchivo(art.id, 2, 'index.html'))).not.toBeNull()
  })
})

describe('accesos', () => {
  it('crea el usuario la primera vez y solo entonces devuelve contraseña', async () => {
    const a = crearAlmacenesEnMemoria()
    const art = await publicar(a, { ...datosBase, archivos: [html('x')] }, T0)
    const otro = await publicar(a, { ...datosBase, archivos: [html('y')] }, T0)
    const r1 = await darAcceso(a, art.id, ' Ana@Cliente.com', T0)
    expect(r1.email).toBe('ana@cliente.com')
    expect(r1.password).toMatch(/^[a-z2-9-]{19}$/)
    expect((await autenticar(a, 'ana@cliente.com', r1.password!, T0)).ok).toBe(true)
    const r2 = await darAcceso(a, otro.id, 'ana@cliente.com', T0)
    expect(r2.password).toBeNull()
  })

  it('quitar acceso afecta solo a ese artefacto', async () => {
    const a = crearAlmacenesEnMemoria()
    const x = await publicar(a, { ...datosBase, archivos: [html('x')] }, T0)
    const y = await publicar(a, { ...datosBase, archivos: [html('y')] }, T0)
    await darAcceso(a, x.id, 'ana@cliente.com', T0)
    await darAcceso(a, y.id, 'ana@cliente.com', T0)
    expect(await quitarAcceso(a, x.id, 'ana@cliente.com')).toBe(true)
    expect((await leerArtefacto(a, x.id))?.accesos).toEqual({})
    expect(Object.keys((await leerArtefacto(a, y.id))!.accesos)).toEqual(['ana@cliente.com'])
    expect(await quitarAcceso(a, x.id, 'ana@cliente.com')).toBe(false)
  })

  it('rechaza emails inválidos y artefactos inexistentes', async () => {
    const a = crearAlmacenesEnMemoria()
    const x = await publicar(a, { ...datosBase, archivos: [html('x')] }, T0)
    await expect(darAcceso(a, x.id, 'no-es-email', T0)).rejects.toThrow(ErrorOperacion)
    await expect(darAcceso(a, 'nonononono', 'ana@cliente.com', T0)).rejects.toThrow(/no existe/)
  })
})

describe('usuarios', () => {
  it('regenerar invalida la contraseña anterior y actualiza credencialesEn', async () => {
    const a = crearAlmacenesEnMemoria()
    const x = await publicar(a, { ...datosBase, archivos: [html('x')] }, T0)
    const { password } = await darAcceso(a, x.id, 'ana@cliente.com', T0)
    const nueva = await regenerarPassword(a, 'ana@cliente.com', T0 + 5)
    expect((await autenticar(a, 'ana@cliente.com', password!, T0 + 6)).ok).toBe(false)
    expect((await autenticar(a, 'ana@cliente.com', nueva, T0 + 6)).ok).toBe(true)
    expect((await leerUsuario(a, 'ana@cliente.com'))?.credencialesEn).toBe(new Date(T0 + 5).toISOString())
  })

  it('desactivar impide entrar; dar acceso de nuevo lo reactiva con contraseña nueva', async () => {
    const a = crearAlmacenesEnMemoria()
    const x = await publicar(a, { ...datosBase, archivos: [html('x')] }, T0)
    await darAcceso(a, x.id, 'ana@cliente.com', T0)
    await desactivarUsuario(a, 'ana@cliente.com', T0 + 1)
    expect((await leerUsuario(a, 'ana@cliente.com'))?.hash).toBeNull()
    const r = await darAcceso(a, x.id, 'ana@cliente.com', T0 + 2)
    expect(r.password).not.toBeNull()
  })

  it('admin solo con correo de Interactius', async () => {
    const a = crearAlmacenesEnMemoria()
    await expect(crearAdmin(a, 'ana@cliente.com', T0)).rejects.toThrow(/interactius/)
    const pw = await crearAdmin(a, 'Equipo@Interactius.com', T0)
    expect((await leerUsuario(a, 'equipo@interactius.com'))?.admin).toBe(true)
    expect((await autenticar(a, 'equipo@interactius.com', pw, T0)).ok).toBe(true)
  })
})

describe('borrar y resumen', () => {
  it('borra archivos, ficha y últimos accesos; el resumen lista personas', async () => {
    const a = crearAlmacenesEnMemoria()
    const x = await publicar(a, { ...datosBase, archivos: [html('x')] }, T0)
    await darAcceso(a, x.id, 'ana@cliente.com', T0)
    const r = await resumenAdmin(a)
    expect(r.artefactos[0].personas).toEqual([
      { email: 'ana@cliente.com', concedidoEn: new Date(T0).toISOString(), ultimoAcceso: null, activo: true },
    ])
    expect(r.usuarios.map((u) => u.email)).toEqual(['ana@cliente.com'])
    expect(r.usuarios[0]).not.toHaveProperty('hash')
    await borrarArtefacto(a, x.id)
    expect(await leerArtefacto(a, x.id)).toBeNull()
    expect(await a.artefactos.listar(`${x.id}/`)).toEqual([])
  })
})
```

- [ ] **Step 2: Ejecutar y comprobar que falla**

Run: `npm test -- operations`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar**

`lib/clientes/operations.ts`:

```ts
/* ==========================================================================
   Operaciones de gestión de la zona de clientes
   --------------------------------------------------------------------------
   Las usan la CLI (`scripts/clientes.ts`) y las acciones de la vista admin.
   No dependen de Next ni de Netlify: reciben los `Almacenes` por parámetro.
   ========================================================================== */

import {
  esEmailInteractius,
  esEmailValido,
  idAleatorio,
  normalizarEmail,
  validarSlugCliente,
} from './ids'
import { generarPassword, hashPassword } from './passwords'
import {
  borrarFichaArtefacto,
  borrarUltimosAccesos,
  claveArchivo,
  guardarArtefacto,
  guardarUsuario,
  leerArtefacto,
  leerUltimoAcceso,
  leerUsuario,
  listarArtefactos,
  listarUsuarios,
} from './repo'
import type { Almacenes } from './store'
import type { ArchivoArtefacto, Artefacto, Usuario } from './types'

export class ErrorOperacion extends Error {}

const iso = (ms: number) => new Date(ms).toISOString()

const EXTENSIONES_TEXTO = /\.(html?|m?js|css|svg|json|txt)$/i

/** Señales de que el artefacto usa funciones que solo existen en claude.ai. */
export function detectarAvisos(archivos: ArchivoArtefacto[]): string[] {
  const avisos = new Set<string>()
  const decoder = new TextDecoder()
  for (const f of archivos) {
    if (!EXTENSIONES_TEXTO.test(f.ruta)) continue
    if (/window\.claude\b/.test(decoder.decode(f.datos))) {
      avisos.add(
        'Usa funciones de Claude (window.claude): esas partes no funcionarán fuera de claude.ai.',
      )
    }
  }
  return [...avisos]
}

async function exigirArtefacto(a: Almacenes, id: string): Promise<Artefacto> {
  const art = await leerArtefacto(a, id)
  if (!art) throw new ErrorOperacion(`El artefacto ${id} no existe.`)
  return art
}

function exigirEmail(email: string): string {
  const e = normalizarEmail(email)
  if (!esEmailValido(e)) throw new ErrorOperacion(`"${email}" no es un correo válido.`)
  return e
}

function exigirEntrada(archivos: ArchivoArtefacto[], entrada: string) {
  if (!archivos.some((f) => f.ruta === entrada)) {
    throw new ErrorOperacion(`No hay ningún archivo de entrada "${entrada}" en el artefacto.`)
  }
}

function comprobarRutas(archivos: ArchivoArtefacto[]) {
  for (const f of archivos) {
    if (f.ruta.startsWith('/') || f.ruta.split('/').some((s) => s === '..' || s === '')) {
      throw new ErrorOperacion(`Ruta de archivo no válida: "${f.ruta}".`)
    }
  }
}

async function subirArchivos(a: Almacenes, id: string, version: number, archivos: ArchivoArtefacto[]) {
  await Promise.all(
    archivos.map((f) =>
      a.artefactos.escribirArchivo(claveArchivo(id, version, f.ruta), f.datos, f.contentType),
    ),
  )
}

async function borrarVersion(a: Almacenes, id: string, version: number) {
  const claves = await a.artefactos.listar(`${id}/v${version}/`)
  await Promise.all(claves.map((k) => a.artefactos.borrar(k)))
}

export async function publicar(
  a: Almacenes,
  datos: {
    cliente: string
    titulo: string
    origen: string
    entrada: string
    archivos: ArchivoArtefacto[]
    avisos: string[]
    publicadoPor: string
  },
  ahora: number,
): Promise<Artefacto> {
  const errorSlug = validarSlugCliente(datos.cliente)
  if (errorSlug) throw new ErrorOperacion(errorSlug)
  if (!datos.titulo.trim()) throw new ErrorOperacion('Falta el título.')
  comprobarRutas(datos.archivos)
  exigirEntrada(datos.archivos, datos.entrada)

  let id = idAleatorio(10)
  while (await leerArtefacto(a, id)) id = idAleatorio(10)

  await subirArchivos(a, id, 1, datos.archivos)
  const art: Artefacto = {
    id,
    cliente: datos.cliente,
    titulo: datos.titulo.trim(),
    origen: datos.origen,
    version: 1,
    publicadoEn: iso(ahora),
    publicadoPor: datos.publicadoPor,
    entrada: datos.entrada,
    avisos: datos.avisos,
    accesos: {},
  }
  await guardarArtefacto(a, art)
  return art
}

/** Sube la versión nueva, apunta la ficha a ella y solo entonces borra la anterior. */
export async function republicar(
  a: Almacenes,
  id: string,
  datos: { archivos: ArchivoArtefacto[]; avisos: string[]; entrada?: string; publicadoPor: string },
  ahora: number,
): Promise<Artefacto> {
  const art = await exigirArtefacto(a, id)
  const entrada = datos.entrada ?? art.entrada
  comprobarRutas(datos.archivos)
  exigirEntrada(datos.archivos, entrada)
  const anterior = art.version
  const nueva = anterior + 1
  await subirArchivos(a, id, nueva, datos.archivos)
  const actualizado: Artefacto = {
    ...art,
    version: nueva,
    entrada,
    avisos: datos.avisos,
    publicadoEn: iso(ahora),
    publicadoPor: datos.publicadoPor,
  }
  await guardarArtefacto(a, actualizado)
  await borrarVersion(a, id, anterior)
  return actualizado
}

async function nuevasCredenciales(
  base: Omit<Usuario, 'hash' | 'credencialesEn' | 'fallos' | 'bloqueadoHasta'>,
  ahora: number,
): Promise<{ usuario: Usuario; password: string }> {
  const password = generarPassword()
  return {
    password,
    usuario: {
      ...base,
      hash: await hashPassword(password),
      credencialesEn: iso(ahora),
      fallos: 0,
      bloqueadoHasta: null,
    },
  }
}

/** Crea o reactiva al usuario si hace falta; solo entonces devuelve contraseña. */
export async function darAcceso(
  a: Almacenes,
  id: string,
  email: string,
  ahora: number,
): Promise<{ artefacto: Artefacto; email: string; password: string | null }> {
  const e = exigirEmail(email)
  const art = await exigirArtefacto(a, id)

  let password: string | null = null
  const existente = await leerUsuario(a, e)
  if (!existente || !existente.hash) {
    const r = await nuevasCredenciales(
      { email: e, admin: existente?.admin ?? false, creadoEn: existente?.creadoEn ?? iso(ahora) },
      ahora,
    )
    await guardarUsuario(a, r.usuario)
    password = r.password
  }

  const actualizado: Artefacto = {
    ...art,
    accesos: { ...art.accesos, [e]: art.accesos[e] ?? { concedidoEn: iso(ahora) } },
  }
  await guardarArtefacto(a, actualizado)
  return { artefacto: actualizado, email: e, password }
}

export async function quitarAcceso(a: Almacenes, id: string, email: string): Promise<boolean> {
  const e = normalizarEmail(email)
  const art = await exigirArtefacto(a, id)
  if (!Object.hasOwn(art.accesos, e)) return false
  const { [e]: _quitado, ...resto } = art.accesos
  await guardarArtefacto(a, { ...art, accesos: resto })
  return true
}

export async function regenerarPassword(a: Almacenes, email: string, ahora: number): Promise<string> {
  const existente = await leerUsuario(a, email)
  if (!existente) throw new ErrorOperacion(`No existe el usuario ${normalizarEmail(email)}.`)
  const r = await nuevasCredenciales(
    { email: existente.email, admin: existente.admin, creadoEn: existente.creadoEn },
    ahora,
  )
  await guardarUsuario(a, r.usuario)
  return r.password
}

export async function crearAdmin(a: Almacenes, email: string, ahora: number): Promise<string> {
  const e = exigirEmail(email)
  if (!esEmailInteractius(e)) {
    throw new ErrorOperacion('Solo se pueden crear admins con correos @interactius.com.')
  }
  const existente = await leerUsuario(a, e)
  const r = await nuevasCredenciales(
    { email: e, admin: true, creadoEn: existente?.creadoEn ?? iso(ahora) },
    ahora,
  )
  await guardarUsuario(a, r.usuario)
  return r.password
}

export async function desactivarUsuario(a: Almacenes, email: string, ahora: number): Promise<void> {
  const existente = await leerUsuario(a, email)
  if (!existente) throw new ErrorOperacion(`No existe el usuario ${normalizarEmail(email)}.`)
  await guardarUsuario(a, { ...existente, hash: null, credencialesEn: iso(ahora) })
}

export async function borrarArtefacto(a: Almacenes, id: string): Promise<void> {
  await exigirArtefacto(a, id)
  const claves = await a.artefactos.listar(`${id}/`)
  await Promise.all(claves.map((k) => a.artefactos.borrar(k)))
  await borrarUltimosAccesos(a, id)
  await borrarFichaArtefacto(a, id)
}

export interface PersonaConAcceso {
  email: string
  concedidoEn: string
  ultimoAcceso: string | null
  activo: boolean
}

export interface FilaAdmin {
  artefacto: Artefacto
  personas: PersonaConAcceso[]
}

export type UsuarioPublico = Omit<Usuario, 'hash'> & { activo: boolean }

export async function resumenAdmin(
  a: Almacenes,
): Promise<{ artefactos: FilaAdmin[]; usuarios: UsuarioPublico[] }> {
  const [artefactos, usuarios] = await Promise.all([listarArtefactos(a), listarUsuarios(a)])
  const activos = new Map(usuarios.map((u) => [u.email, u.hash !== null]))
  const filas = await Promise.all(
    artefactos.map(async (artefacto) => ({
      artefacto,
      personas: await Promise.all(
        Object.entries(artefacto.accesos)
          .sort(([x], [y]) => x.localeCompare(y))
          .map(async ([email, acceso]) => ({
            email,
            concedidoEn: acceso.concedidoEn,
            ultimoAcceso: await leerUltimoAcceso(a, artefacto.id, email),
            activo: activos.get(email) ?? false,
          })),
      ),
    })),
  )
  return {
    artefactos: filas,
    usuarios: usuarios.map(({ hash, ...resto }) => ({ ...resto, activo: hash !== null })),
  }
}
```

- [ ] **Step 4: Ejecutar tests, type-check y lint**

Run: `npm test && npm run type-check && npm run lint`
Expected: todos PASS; sin errores (el `_quitado` cumple la regla `varsIgnorePattern: "^_"`).

- [ ] **Step 5: Commit**

```bash
git add lib/clientes
git commit -m "feat(clientes): operaciones de publicación y gestión de accesos"
```

---

### Task 7: CLI de gestión

**Files:**
- Create: `scripts/clientes.ts`, `lib/clientes/cli-files.ts`
- Test: `lib/clientes/__tests__/cli-files.test.ts`

**Interfaces:**
- Consumes: `crearAlmacenesNetlify` (Task 4), operaciones (Task 6), `listarArtefactos` (Task 4).
- Produces: `leerDirectorioArtefacto(dir: string, raizRepo: string): Promise<ArchivoArtefacto[]>`, `tipoMime(ruta: string): string`, `URL_BASE: Record<Entorno, string>`.

- [ ] **Step 1: Escribir el test (falla)**

`lib/clientes/__tests__/cli-files.test.ts`:

```ts
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { leerDirectorioArtefacto, tipoMime } from '@/lib/clientes/cli-files'

describe('cli-files', () => {
  it('tipos MIME por extensión', () => {
    expect(tipoMime('index.html')).toBe('text/html; charset=utf-8')
    expect(tipoMime('a/b.JS')).toBe('text/javascript; charset=utf-8')
    expect(tipoMime('x.webp')).toBe('image/webp')
    expect(tipoMime('x.raro')).toBe('application/octet-stream')
  })

  it('lee recursivamente, con rutas relativas y sin ocultos', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'artefacto-'))
    await writeFile(join(dir, 'index.html'), '<p>hola</p>')
    await mkdir(join(dir, 'css'))
    await writeFile(join(dir, 'css', 'app.css'), 'body{}')
    await writeFile(join(dir, '.DS_Store'), 'x')
    const archivos = await leerDirectorioArtefacto(dir, '/no/es/el/repo')
    expect(archivos.map((f) => f.ruta).sort()).toEqual(['css/app.css', 'index.html'])
  })

  it('rechaza directorios dentro del repo', async () => {
    await expect(leerDirectorioArtefacto(process.cwd(), process.cwd())).rejects.toThrow(/dentro del repo/)
  })
})
```

- [ ] **Step 2: Ejecutar y comprobar que falla**

Run: `npm test -- cli-files`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar `cli-files.ts`**

`lib/clientes/cli-files.ts`:

```ts
import { readdir, readFile, realpath } from 'node:fs/promises'
import { extname, isAbsolute, join, relative, sep } from 'node:path'

import { ErrorOperacion } from './operations'
import type { ArchivoArtefacto, Entorno } from './types'

export const URL_BASE: Record<Entorno, string> = {
  production: 'https://www.interactius.com',
  staging: 'https://staging.interactius.com',
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
}

export function tipoMime(ruta: string): string {
  return MIME[extname(ruta).toLowerCase()] ?? 'application/octet-stream'
}

/**
 * Lee la carpeta del artefacto. Se niega a leer dentro del repo: los
 * artefactos son confidenciales y no deben acabar en un commit.
 */
export async function leerDirectorioArtefacto(
  dir: string,
  raizRepo: string,
): Promise<ArchivoArtefacto[]> {
  const real = await realpath(dir)
  const repo = await realpath(raizRepo).catch(() => raizRepo)
  const rel = relative(repo, real)
  const dentroDelRepo = rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
  if (dentroDelRepo) {
    throw new ErrorOperacion(
      `La carpeta ${real} está dentro del repo. Copia el artefacto a un directorio temporal fuera del repo (p. ej. el scratchpad).`,
    )
  }

  const archivos: ArchivoArtefacto[] = []
  async function recorrer(actual: string) {
    for (const entrada of await readdir(actual, { withFileTypes: true })) {
      if (entrada.name.startsWith('.')) continue
      const ruta = join(actual, entrada.name)
      if (entrada.isDirectory()) await recorrer(ruta)
      else if (entrada.isFile()) {
        const rutaRel = relative(real, ruta).split(sep).join('/')
        archivos.push({
          ruta: rutaRel,
          datos: new Uint8Array(await readFile(ruta)),
          contentType: tipoMime(rutaRel),
        })
      }
    }
  }
  await recorrer(real)
  return archivos
}
```

- [ ] **Step 4: Ejecutar tests**

Run: `npm test -- cli-files`
Expected: 3 PASS.

- [ ] **Step 5: Implementar la CLI**

`scripts/clientes.ts`:

```ts
/* ==========================================================================
   CLI de la zona privada de clientes
   --------------------------------------------------------------------------
   npm run clientes -- <comando> --entorno production|staging [opciones]

   Requiere en el entorno local (nunca en el repo):
     NETLIFY_SITE_ID     ID del sitio en Netlify
     NETLIFY_AUTH_TOKEN  token personal de Netlify

   Las contraseñas solo se imprimen aquí, una vez. No se guardan en claro.
   ========================================================================== */

import { parseArgs } from 'node:util'

import { URL_BASE, leerDirectorioArtefacto } from '../lib/clientes/cli-files'
import { crearAlmacenesNetlify } from '../lib/clientes/netlify-store'
import {
  ErrorOperacion,
  borrarArtefacto,
  crearAdmin,
  darAcceso,
  detectarAvisos,
  publicar,
  quitarAcceso,
  regenerarPassword,
  republicar,
  resumenAdmin,
} from '../lib/clientes/operations'
import type { Artefacto, Entorno } from '../lib/clientes/types'

const AYUDA = `Uso: npm run clientes -- <comando> --entorno production|staging [opciones]

  publicar           --cliente <slug> --titulo "<t>" --origen <url> --dir <carpeta> [--entrada index.html] [--aceptar-avisos]
  republicar         --id <id> --dir <carpeta> [--entrada <ruta>] [--aceptar-avisos]
  dar-acceso         --id <id> --email <correo>
  quitar-acceso      --id <id> --email <correo>
  regenerar-password --email <correo>
  crear-admin        --email <correo@interactius.com>
  listar             [--cliente <slug>]
  borrar             --id <id> --si`

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    entorno: { type: 'string' },
    cliente: { type: 'string' },
    titulo: { type: 'string' },
    origen: { type: 'string' },
    dir: { type: 'string' },
    entrada: { type: 'string' },
    id: { type: 'string' },
    email: { type: 'string' },
    'aceptar-avisos': { type: 'boolean', default: false },
    si: { type: 'boolean', default: false },
  },
})

function requerir(nombre: keyof typeof values): string {
  const v = values[nombre]
  if (typeof v !== 'string' || !v.trim()) throw new ErrorOperacion(`Falta --${nombre}.\n\n${AYUDA}`)
  return v.trim()
}

const enlace = (entorno: Entorno, art: Artefacto) =>
  `${URL_BASE[entorno]}/clientes/${art.cliente}/${art.id}`

async function main() {
  const comando = positionals[0]
  if (!comando) throw new ErrorOperacion(AYUDA)

  const entorno = requerir('entorno')
  if (entorno !== 'production' && entorno !== 'staging') {
    throw new ErrorOperacion('--entorno debe ser production o staging.')
  }
  const siteID = process.env.NETLIFY_SITE_ID
  const token = process.env.NETLIFY_AUTH_TOKEN
  if (!siteID || !token) {
    throw new ErrorOperacion('Faltan NETLIFY_SITE_ID y/o NETLIFY_AUTH_TOKEN en el entorno.')
  }
  const a = crearAlmacenesNetlify(entorno, { siteID, token })
  const ahora = Date.now()
  const publicadoPor = 'claude-code'

  async function archivosConAvisos() {
    const archivos = await leerDirectorioArtefacto(requerir('dir'), process.cwd())
    const avisos = detectarAvisos(archivos)
    if (avisos.length && !values['aceptar-avisos']) {
      throw new ErrorOperacion(
        `No se publica: el artefacto tiene avisos.\n- ${avisos.join('\n- ')}\nRepite con --aceptar-avisos si se publica igualmente.`,
      )
    }
    return { archivos, avisos }
  }

  switch (comando) {
    case 'publicar': {
      const { archivos, avisos } = await archivosConAvisos()
      const art = await publicar(
        a,
        {
          cliente: requerir('cliente'),
          titulo: requerir('titulo'),
          origen: requerir('origen'),
          entrada: values.entrada ?? 'index.html',
          archivos,
          avisos,
          publicadoPor,
        },
        ahora,
      )
      console.log(`Publicado (${archivos.length} archivos).\nID: ${art.id}\nEnlace: ${enlace(entorno, art)}`)
      if (avisos.length) console.log(`Avisos:\n- ${avisos.join('\n- ')}`)
      break
    }
    case 'republicar': {
      const { archivos, avisos } = await archivosConAvisos()
      const art = await republicar(
        a,
        requerir('id'),
        { archivos, avisos, entrada: values.entrada, publicadoPor },
        ahora,
      )
      console.log(`Republicado como versión ${art.version}. Mismo enlace: ${enlace(entorno, art)}`)
      break
    }
    case 'dar-acceso': {
      const r = await darAcceso(a, requerir('id'), requerir('email'), ahora)
      console.log(`Acceso concedido a "${r.artefacto.titulo}".`)
      console.log(`Enlace:     ${enlace(entorno, r.artefacto)}`)
      console.log(`Usuario:    ${r.email}`)
      console.log(
        r.password
          ? `Contraseña: ${r.password}   (solo se muestra ahora; envíala por un canal distinto al enlace)`
          : 'Contraseña: la que ya tenía (usuario existente).',
      )
      break
    }
    case 'quitar-acceso': {
      const ok = await quitarAcceso(a, requerir('id'), requerir('email'))
      console.log(ok ? 'Acceso retirado.' : 'Esa persona no tenía acceso a este artefacto.')
      break
    }
    case 'regenerar-password': {
      const pw = await regenerarPassword(a, requerir('email'), ahora)
      console.log(`Nueva contraseña: ${pw}\nLas sesiones abiertas de esta persona quedan cerradas.`)
      break
    }
    case 'crear-admin': {
      const pw = await crearAdmin(a, requerir('email'), ahora)
      console.log(`Admin listo.\nEnlace:     ${URL_BASE[entorno]}/clientes/admin\nContraseña: ${pw}`)
      break
    }
    case 'listar': {
      const { artefactos } = await resumenAdmin(a)
      const filtro = values.cliente
      for (const { artefacto: art, personas } of artefactos) {
        if (filtro && art.cliente !== filtro) continue
        console.log(`\n[${art.cliente}] ${art.titulo}  (v${art.version}, ${art.publicadoEn.slice(0, 10)})`)
        console.log(`  ${enlace(entorno, art)}`)
        for (const av of art.avisos) console.log(`  ! ${av}`)
        for (const p of personas) {
          console.log(
            `  - ${p.email}${p.activo ? '' : ' (desactivado)'} · último acceso: ${p.ultimoAcceso?.slice(0, 16).replace('T', ' ') ?? 'nunca'}`,
          )
        }
        if (!personas.length) console.log('  (sin personas con acceso)')
      }
      break
    }
    case 'borrar': {
      if (!values.si) throw new ErrorOperacion('Borrar es irreversible. Repite con --si para confirmar.')
      await borrarArtefacto(a, requerir('id'))
      console.log('Artefacto borrado (archivos, ficha y registro de accesos).')
      break
    }
    default:
      throw new ErrorOperacion(`Comando desconocido: ${comando}\n\n${AYUDA}`)
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof ErrorOperacion ? e.message : e)
  process.exit(1)
})
```

- [ ] **Step 6: Comprobar que arranca y valida sin tocar Netlify**

Run: `npm run clientes -- listar; echo "exit=$?"`
Expected: imprime `Falta --entorno.` + ayuda y `exit=1`.

Run: `npm run clientes -- listar --entorno staging; echo "exit=$?"`
Expected (sin variables de Netlify): `Faltan NETLIFY_SITE_ID y/o NETLIFY_AUTH_TOKEN en el entorno.` y `exit=1`.

- [ ] **Step 7: Tests, type-check, lint y commit**

Run: `npm test && npm run type-check && npm run lint`
Expected: todo PASS.

```bash
git add scripts/clientes.ts lib/clientes/cli-files.ts lib/clientes/__tests__/cli-files.test.ts
git commit -m "feat(clientes): CLI para publicar artefactos y gestionar accesos"
```

---

### Task 8: Rutas públicas de la zona (login, visor y archivos)

**Files:**
- Create: `lib/clientes/http.ts`, `lib/clientes/config.ts`, `app/clientes/layout.tsx`, `app/clientes/not-found.tsx`, `app/clientes/[cliente]/[id]/page.tsx`, `app/clientes/login/route.ts`, `app/clientes/logout/route.ts`, `app/clientes/archivos/[id]/[token]/[...ruta]/route.ts`, `components/clientes/Marco.tsx`, `components/clientes/Login.tsx`, `components/clientes/Visor.tsx`, `components/clientes/RecargaAlCaducar.tsx`, `components/clientes/ServicioNoDisponible.tsx`, `components/clientes/BotonSalir.tsx`
- Modify: `middleware.ts` (función `middleware`, antes del bloque `0.`), `app/robots.ts` (los dos `disallow`)
- Test: `lib/clientes/__tests__/http.test.ts`

**Interfaces:**
- Consumes: Tasks 1–6.
- Produces:
  - `origenValido(req: Request): boolean`, `destinoSeguro(next: string): string`, `rutaSegura(segmentos: string[]): string | null`, `CSP_ARTEFACTO`, `CABECERAS_PRIVADAS: Record<string, string>`, `noDisponible(): Response`
  - `class ZonaNoDisponible extends Error`, `entornoActual(): Entorno`, `secretoSesion(): string`, `almacenes(): Almacenes`
  - Componentes `<Marco>`, `<Login next error? />`, `<BotonSalir next />`, `<ServicioNoDisponible />`

- [ ] **Step 1: Escribir el test de `http.ts` (falla)**

`lib/clientes/__tests__/http.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { destinoSeguro, origenValido, rutaSegura } from '@/lib/clientes/http'

const req = (headers: Record<string, string>) =>
  new Request('https://www.interactius.com/clientes/login', { method: 'POST', headers })

describe('origenValido', () => {
  it('acepta el mismo host y rechaza otros o ausencia', () => {
    expect(origenValido(req({ origin: 'https://www.interactius.com', host: 'www.interactius.com' }))).toBe(true)
    expect(origenValido(req({ origin: 'https://evil.io', host: 'www.interactius.com' }))).toBe(false)
    expect(origenValido(req({ host: 'www.interactius.com' }))).toBe(false)
    expect(origenValido(req({ origin: 'null', host: 'www.interactius.com' }))).toBe(false)
  })
})

describe('destinoSeguro', () => {
  it('solo rutas de la zona', () => {
    expect(destinoSeguro('/clientes/caixabank/k7f3q9xm2p')).toBe('/clientes/caixabank/k7f3q9xm2p')
    expect(destinoSeguro('/clientes/admin')).toBe('/clientes/admin')
    expect(destinoSeguro('https://evil.io')).toBe('/clientes/admin')
    expect(destinoSeguro('//evil.io/clientes/x/y')).toBe('/clientes/admin')
    expect(destinoSeguro('/clientes/caixabank/k7f3q9xm2p?x=1')).toBe('/clientes/admin')
  })
})

describe('rutaSegura', () => {
  it('une segmentos y rechaza escapes', () => {
    expect(rutaSegura(['css', 'app.css'])).toBe('css/app.css')
    expect(rutaSegura(['mi%20archivo.png'])).toBe('mi archivo.png')
    expect(rutaSegura(['..', 'x'])).toBeNull()
    expect(rutaSegura(['%2e%2e', 'x'])).toBeNull()
    expect(rutaSegura([])).toBeNull()
  })
})
```

- [ ] **Step 2: Ejecutar y comprobar que falla**

Run: `npm test -- http`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar `http.ts` y `config.ts`**

`lib/clientes/http.ts`:

```ts
/** Protección CSRF: el POST debe venir de una página de nuestro mismo host. */
export function origenValido(req: Request): boolean {
  const origin = req.headers.get('origin')
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

const DESTINO_RE = /^\/clientes\/(admin|[a-z0-9]+(?:-[a-z0-9]+)*\/[abcdefghijkmnpqrstuvwxyz23456789]{10})$/

/** Evita redirecciones abiertas tras el login: solo rutas de la zona. */
export function destinoSeguro(next: string): string {
  return DESTINO_RE.test(next) ? next : '/clientes/admin'
}

/** Ruta de archivo a partir de los segmentos de la URL, sin `..` ni vacíos. */
export function rutaSegura(segmentos: string[]): string | null {
  if (!segmentos.length) return null
  const partes: string[] = []
  for (const s of segmentos) {
    let d: string
    try {
      d = decodeURIComponent(s)
    } catch {
      return null
    }
    if (!d || d === '.' || d === '..' || d.includes('/') || d.includes('\\')) return null
    partes.push(d)
  }
  return partes.join('/')
}

/**
 * Sin `allow-same-origin`: el artefacto corre con origen opaco y no puede
 * leer la sesión ni actuar como interactius.com. Solo enmarcable por nosotros.
 */
export const CSP_ARTEFACTO =
  "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-downloads; frame-ancestors 'self'"

export const CABECERAS_PRIVADAS: Record<string, string> = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
}

export function noDisponible(): Response {
  return new Response('Servicio no disponible.', { status: 503, headers: CABECERAS_PRIVADAS })
}
```

`lib/clientes/config.ts`:

```ts
import { SITE_CONFIG } from '@/lib/seo/metadata.config'

import { crearAlmacenesNetlify } from './netlify-store'
import type { Almacenes } from './store'
import type { Entorno } from './types'

/** Algo esencial falta o falla: la zona no autentica a nadie (fail-closed). */
export class ZonaNoDisponible extends Error {}

export function entornoActual(): Entorno {
  return SITE_CONFIG.isProduction ? 'production' : 'staging'
}

export function secretoSesion(): string {
  // Escrita literal a propósito (ver comentario equivalente en middleware.ts).
  const s = process.env.CLIENTES_SESSION_SECRET
  if (!s || s.length < 32) throw new ZonaNoDisponible('Falta CLIENTES_SESSION_SECRET (mín. 32 caracteres).')
  return s
}

let cache: Almacenes | null = null

export function almacenes(): Almacenes {
  try {
    return (cache ??= crearAlmacenesNetlify(entornoActual()))
  } catch (e) {
    console.error('[clientes] Netlify Blobs no disponible', e)
    throw new ZonaNoDisponible('Netlify Blobs no disponible.')
  }
}
```

- [ ] **Step 4: Ejecutar tests**

Run: `npm test -- http`
Expected: 3 PASS.

- [ ] **Step 5: Middleware y robots**

En `middleware.ts`, dentro de `export default function middleware(req: NextRequest) {`, insertar como primer bloque (antes de `// 0. Ruta app-root fuera de i18n`):

```ts
  // Zona privada de clientes (`app/clientes/`): fuera de i18n y SIN pasar a
  // minúsculas (los tokens de archivo distinguen mayúsculas). La autenticación
  // la hacen las propias rutas; aquí solo cabeceras de privacidad.
  const p = req.nextUrl.pathname
  if (p === '/clientes' || p.startsWith('/clientes/')) {
    const res = NextResponse.next()
    res.headers.set('X-Robots-Tag', 'noindex, nofollow')
    res.headers.set('Cache-Control', 'private, no-store')
    res.headers.set('Referrer-Policy', 'no-referrer')
    return res
  }

```

En `app/robots.ts`, en las dos reglas de producción, cambiar `disallow: ['/api/']` por `disallow: ['/api/', '/clientes']`.

- [ ] **Step 6: Layout, componentes y not-found**

`app/clientes/layout.tsx`:

```tsx
import type { Metadata } from 'next'

import '@/app/globals.css'
import { ftFontsClass } from '@/lib/fonts/future-thinking'

/* ==========================================================================
   Zona privada de clientes — root layout
   --------------------------------------------------------------------------
   Vive fuera de `app/[locale]/` (como `app/proyectos/`), así que tiene su
   propio <html>. Título genérico: no se revela qué hay dentro antes del login.
   ========================================================================== */

export const metadata: Metadata = {
  title: 'Interactius · Área de clientes',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

export default function ClientesLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={ftFontsClass}>
      <body className="min-h-dvh bg-warm-light text-fg font-[family-name:var(--font-ft-sans)]">
        {children}
      </body>
    </html>
  )
}
```

Nota: a diferencia de las landings de `app/proyectos/` (CSS propio, sin Tailwind), esta zona usa clases de Tailwind, así que importa `app/globals.css`, que es donde están las capas `@tailwind` y los tokens (`text-fg`, `bg-warm-light`).

`components/clientes/Marco.tsx`:

```tsx
/** Contenedor centrado con la firma de Interactius, para login y avisos. */
export function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <p className="mb-10 font-[family-name:var(--font-ft-mono)] text-sm uppercase tracking-widest">
        interactius · área de clientes
      </p>
      {children}
    </main>
  )
}
```

`components/clientes/Login.tsx`:

```tsx
import { Marco } from './Marco'

const ERRORES: Record<string, string> = {
  credenciales: 'Usuario o contraseña incorrectos.',
  bloqueado: 'Demasiados intentos. Prueba de nuevo en unos minutos.',
}

/** Formulario HTML puro: funciona sin JavaScript. */
export function Login({ next, error }: { next: string; error?: string }) {
  const mensaje = error ? ERRORES[error] : undefined
  return (
    <Marco>
      <h1 className="mb-8 font-[family-name:var(--font-ft-serif)] text-3xl">Acceso privado</h1>
      <form method="post" action="/clientes/login" className="flex flex-col gap-5">
        <input type="hidden" name="next" value={next} />
        <label className="flex flex-col gap-2 text-sm">
          Usuario (tu correo)
          <input
            name="email" type="email" required autoComplete="username"
            className="border border-fg/30 bg-transparent px-3 py-2 text-base"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Contraseña
          <input
            name="password" type="password" required autoComplete="current-password"
            className="border border-fg/30 bg-transparent px-3 py-2 text-base"
          />
        </label>
        {mensaje && <p role="alert" className="text-sm">{mensaje}</p>}
        <button type="submit" className="mt-2 bg-fg px-4 py-3 text-warm-light">
          Entrar
        </button>
      </form>
    </Marco>
  )
}
```

`components/clientes/BotonSalir.tsx`:

```tsx
export function BotonSalir({ next, className }: { next: string; className?: string }) {
  return (
    <form method="post" action="/clientes/logout" className={className}>
      <input type="hidden" name="next" value={next} />
      <button type="submit" className="underline underline-offset-4">Cerrar sesión</button>
    </form>
  )
}
```

`components/clientes/ServicioNoDisponible.tsx`:

```tsx
import { Marco } from './Marco'

export function ServicioNoDisponible() {
  return (
    <Marco>
      <h1 className="font-[family-name:var(--font-ft-serif)] text-3xl">Servicio no disponible.</h1>
      <p className="mt-4">Inténtalo de nuevo en unos minutos.</p>
    </Marco>
  )
}
```

`components/clientes/RecargaAlCaducar.tsx`:

```tsx
'use client'

import { useEffect } from 'react'

/**
 * Los archivos del artefacto se sirven con un token de 15 minutos. Si la
 * pestaña vuelve a primer plano después de que caduque, recargamos la página
 * para obtener uno nuevo (la sesión de 7 días sigue valiendo).
 */
export function RecargaAlCaducar({ expira }: { expira: number }) {
  useEffect(() => {
    const comprobar = () => {
      if (document.visibilityState === 'visible' && Date.now() > expira - 30_000) {
        window.location.reload()
      }
    }
    document.addEventListener('visibilitychange', comprobar)
    return () => document.removeEventListener('visibilitychange', comprobar)
  }, [expira])
  return null
}
```

`components/clientes/Visor.tsx`:

```tsx
import { BotonSalir } from './BotonSalir'
import { RecargaAlCaducar } from './RecargaAlCaducar'

export function Visor({
  titulo, src, expira, email, volver,
}: { titulo: string; src: string; expira: number; email: string; volver: string }) {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-fg/15 px-4 text-sm">
        <span className="truncate">
          <span className="font-[family-name:var(--font-ft-mono)] uppercase tracking-widest">interactius</span>
          <span className="mx-2 opacity-40">/</span>
          {titulo}
        </span>
        <span className="flex shrink-0 items-center gap-4">
          <span className="hidden opacity-60 sm:inline">{email}</span>
          <BotonSalir next={volver} />
        </span>
      </header>
      <iframe
        src={src}
        title={titulo}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-downloads"
        referrerPolicy="no-referrer"
        className="block w-full flex-1 border-0 bg-white"
      />
      <RecargaAlCaducar expira={expira} />
    </div>
  )
}
```

`app/clientes/not-found.tsx`:

```tsx
import { BotonSalir } from '@/components/clientes/BotonSalir'
import { Marco } from '@/components/clientes/Marco'

/** Misma respuesta para "no existe" y "no es tuyo": no revela qué existe. */
export default function NoTienesAcceso() {
  return (
    <Marco>
      <h1 className="font-[family-name:var(--font-ft-serif)] text-3xl">No tienes acceso a este contenido.</h1>
      <p className="mt-4">Si crees que deberías tenerlo, escribe a tu contacto en Interactius.</p>
      <BotonSalir next="/clientes/admin" className="mt-8" />
    </Marco>
  )
}
```

- [ ] **Step 7: Página del visor**

`app/clientes/[cliente]/[id]/page.tsx`:

```tsx
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { Login } from '@/components/clientes/Login'
import { ServicioNoDisponible } from '@/components/clientes/ServicioNoDisponible'
import { Visor } from '@/components/clientes/Visor'
import { puedeVer, registrarAcceso, usuarioDeSesion } from '@/lib/clientes/access'
import { almacenes, secretoSesion } from '@/lib/clientes/config'
import { crearTokenArchivo } from '@/lib/clientes/file-tokens'
import { ID_ARTEFACTO_RE } from '@/lib/clientes/ids'
import { leerArtefacto } from '@/lib/clientes/repo'
import { COOKIE_SESION } from '@/lib/clientes/session'
import type { Almacenes } from '@/lib/clientes/store'
import type { Artefacto, Usuario } from '@/lib/clientes/types'

export const dynamic = 'force-dynamic'

type Carga =
  | { estado: 'no-disponible' }
  | { estado: 'sin-sesion' }
  | { estado: 'ok'; a: Almacenes; secreto: string; usuario: Usuario; artefacto: Artefacto | null }

/** Todo lo que puede fallar por infraestructura, en un solo try. */
async function cargar(id: string, ahora: number): Promise<Carga> {
  try {
    const a = almacenes()
    const secreto = secretoSesion()
    const token = (await cookies()).get(COOKIE_SESION)?.value
    const usuario = await usuarioDeSesion(a, token, ahora, secreto)
    if (!usuario) return { estado: 'sin-sesion' }
    const artefacto = ID_ARTEFACTO_RE.test(id) ? await leerArtefacto(a, id) : null
    return { estado: 'ok', a, secreto, usuario, artefacto }
  } catch (e) {
    console.error('[clientes] visor', e)
    return { estado: 'no-disponible' }
  }
}

const codificarRuta = (ruta: string) => ruta.split('/').map(encodeURIComponent).join('/')

export default async function ArtefactoPage({
  params,
  searchParams,
}: {
  params: Promise<{ cliente: string; id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { cliente, id } = await params
  const { error } = await searchParams
  const volver = `/clientes/${cliente}/${id}`
  const ahora = Date.now()

  const c = await cargar(id, ahora)
  if (c.estado === 'no-disponible') return <ServicioNoDisponible />
  if (c.estado === 'sin-sesion') return <Login next={volver} error={error} />

  const { a, secreto, usuario, artefacto } = c
  // Misma respuesta si no existe, si el cliente no cuadra o si no es suyo.
  if (!artefacto || artefacto.cliente !== cliente || !puedeVer(usuario, artefacto)) notFound()

  if (!usuario.admin) {
    await registrarAcceso(a, id, usuario.email, ahora).catch((e) =>
      console.error('[clientes] registrar acceso', e),
    )
  }

  const { token, expira } = crearTokenArchivo(id, artefacto.version, ahora, secreto)
  return (
    <Visor
      titulo={artefacto.titulo}
      src={`/clientes/archivos/${id}/${token}/${codificarRuta(artefacto.entrada)}`}
      expira={expira}
      email={usuario.email}
      volver={volver}
    />
  )
}
```

- [ ] **Step 8: Login y logout**

`app/clientes/login/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'

import { autenticar } from '@/lib/clientes/auth'
import { almacenes, secretoSesion } from '@/lib/clientes/config'
import { destinoSeguro, noDisponible, origenValido } from '@/lib/clientes/http'
import { COOKIE_SESION, DURACION_SESION_MS, crearTokenSesion } from '@/lib/clientes/session'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!origenValido(req)) return new NextResponse('Forbidden', { status: 403 })

  const form = await req.formData()
  const next = destinoSeguro(String(form.get('next') ?? ''))
  const email = String(form.get('email') ?? '')
  const password = String(form.get('password') ?? '')

  try {
    const secreto = secretoSesion()
    const ahora = Date.now()
    const r = await autenticar(almacenes(), email, password, ahora)
    if (!r.ok) {
      const url = new URL(next, req.url)
      url.searchParams.set('error', r.motivo)
      return NextResponse.redirect(url, 303)
    }
    const res = NextResponse.redirect(new URL(next, req.url), 303)
    res.cookies.set(COOKIE_SESION, crearTokenSesion(r.usuario.email, ahora, secreto), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: DURACION_SESION_MS / 1000,
    })
    return res
  } catch (e) {
    console.error('[clientes] login', e)
    return noDisponible()
  }
}
```

`app/clientes/logout/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'

import { destinoSeguro, origenValido } from '@/lib/clientes/http'
import { COOKIE_SESION } from '@/lib/clientes/session'

export async function POST(req: NextRequest) {
  if (!origenValido(req)) return new NextResponse('Forbidden', { status: 403 })
  const form = await req.formData()
  const res = NextResponse.redirect(
    new URL(destinoSeguro(String(form.get('next') ?? '')), req.url),
    303,
  )
  res.cookies.set(COOKIE_SESION, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 })
  return res
}
```

- [ ] **Step 9: Ruta de archivos**

`app/clientes/archivos/[id]/[token]/[...ruta]/route.ts`:

```ts
import { almacenes, secretoSesion } from '@/lib/clientes/config'
import { verificarTokenArchivo } from '@/lib/clientes/file-tokens'
import { CABECERAS_PRIVADAS, CSP_ARTEFACTO, noDisponible, rutaSegura } from '@/lib/clientes/http'
import { ID_ARTEFACTO_RE } from '@/lib/clientes/ids'
import { claveArchivo, leerArtefacto } from '@/lib/clientes/repo'

export const dynamic = 'force-dynamic'

const prohibido = () => new Response('Forbidden', { status: 403, headers: CABECERAS_PRIVADAS })

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; token: string; ruta: string[] }> },
) {
  const { id, token, ruta } = await params
  const rutaArchivo = rutaSegura(ruta)
  if (!ID_ARTEFACTO_RE.test(id) || !rutaArchivo) return prohibido()

  try {
    const secreto = secretoSesion()
    const a = almacenes()
    const art = await leerArtefacto(a, id)
    if (!art || !verificarTokenArchivo(token, id, art.version, Date.now(), secreto)) {
      return prohibido()
    }
    const archivo = await a.artefactos.leerArchivo(claveArchivo(id, art.version, rutaArchivo))
    if (!archivo) return new Response('Not found', { status: 404, headers: CABECERAS_PRIVADAS })
    return new Response(archivo.datos, {
      headers: {
        ...CABECERAS_PRIVADAS,
        'Content-Type': archivo.contentType,
        'Content-Security-Policy': CSP_ARTEFACTO,
        // El documento enmarcado tiene origen opaco: sus scripts de módulo y
        // fuentes piden CORS. La autorización es el token, no la cookie, así
        // que permitir cualquier origen no amplía el acceso.
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e) {
    console.error('[clientes] archivo', e)
    return noDisponible()
  }
}
```

- [ ] **Step 10: Verificar**

Run: `npm test && npm run type-check && npm run lint && npm run build`
Expected: todo PASS; el build lista `/clientes/[cliente]/[id]`, `/clientes/login`, `/clientes/logout` y `/clientes/archivos/[id]/[token]/[...ruta]` como rutas dinámicas (ƒ).

Run: `npm run dev` y abrir `http://localhost:3000/clientes/caixabank/aaaaaaaaaa`.
Expected: sin `CLIENTES_SESSION_SECRET` ni Netlify Blobs en local → pantalla "Servicio no disponible." (fail-closed). `curl -sI http://localhost:3000/clientes/caixabank/aaaaaaaaaa | grep -i robots` → `x-robots-tag: noindex, nofollow`.

- [ ] **Step 11: Commit**

```bash
git add middleware.ts app/robots.ts app/clientes components/clientes lib/clientes
git commit -m "feat(clientes): login, visor aislado y servicio de archivos con token"
```

---

### Task 9: Vista admin

**Files:**
- Create: `app/clientes/admin/page.tsx`, `app/clientes/admin/revocar/route.ts`, `app/clientes/admin/usuarios/desactivar/route.ts`, `components/clientes/CopiarEnlace.tsx`, `lib/clientes/admin-request.ts`

**Interfaces:**
- Consumes: `resumenAdmin`, `quitarAcceso`, `desactivarUsuario` (Task 6); `usuarioDeSesion` (Task 5); config y http (Task 8); `SITE_CONFIG.baseUrl`.
- Produces: `adminDeLaPeticion(req: NextRequest): Promise<{ a: Almacenes; admin: Usuario } | Response>`.

- [ ] **Step 1: Helper de peticiones admin**

`lib/clientes/admin-request.ts`:

```ts
import type { NextRequest } from 'next/server'

import { usuarioDeSesion } from './access'
import { almacenes, secretoSesion } from './config'
import { CABECERAS_PRIVADAS, noDisponible, origenValido } from './http'
import { COOKIE_SESION } from './session'
import type { Almacenes } from './store'
import type { Usuario } from './types'

/** Origen válido + sesión de admin, o la Response de error a devolver. */
export async function adminDeLaPeticion(
  req: NextRequest,
): Promise<{ a: Almacenes; admin: Usuario } | Response> {
  if (!origenValido(req)) return new Response('Forbidden', { status: 403, headers: CABECERAS_PRIVADAS })
  try {
    const a = almacenes()
    const usuario = await usuarioDeSesion(a, req.cookies.get(COOKIE_SESION)?.value, Date.now(), secretoSesion())
    if (!usuario?.admin) return new Response('Forbidden', { status: 403, headers: CABECERAS_PRIVADAS })
    return { a, admin: usuario }
  } catch (e) {
    console.error('[clientes] admin', e)
    return noDisponible()
  }
}
```

- [ ] **Step 2: Acciones**

`app/clientes/admin/revocar/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'

import { adminDeLaPeticion } from '@/lib/clientes/admin-request'
import { noDisponible } from '@/lib/clientes/http'
import { quitarAcceso } from '@/lib/clientes/operations'

export async function POST(req: NextRequest) {
  const r = await adminDeLaPeticion(req)
  if (r instanceof Response) return r
  const form = await req.formData()
  try {
    await quitarAcceso(r.a, String(form.get('id') ?? ''), String(form.get('email') ?? ''))
  } catch (e) {
    console.error('[clientes] revocar', e)
    return noDisponible()
  }
  return NextResponse.redirect(new URL('/clientes/admin?hecho=revocado', req.url), 303)
}
```

`app/clientes/admin/usuarios/desactivar/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'

import { adminDeLaPeticion } from '@/lib/clientes/admin-request'
import { noDisponible } from '@/lib/clientes/http'
import { desactivarUsuario } from '@/lib/clientes/operations'

export async function POST(req: NextRequest) {
  const r = await adminDeLaPeticion(req)
  if (r instanceof Response) return r
  const form = await req.formData()
  const email = String(form.get('email') ?? '')
  if (email === r.admin.email) {
    return NextResponse.redirect(new URL('/clientes/admin?hecho=no-a-ti-mismo', req.url), 303)
  }
  try {
    await desactivarUsuario(r.a, email, Date.now())
  } catch (e) {
    console.error('[clientes] desactivar', e)
    return noDisponible()
  }
  return NextResponse.redirect(new URL('/clientes/admin?hecho=desactivado', req.url), 303)
}
```

- [ ] **Step 3: Botón copiar**

`components/clientes/CopiarEnlace.tsx`:

```tsx
'use client'

import { useState } from 'react'

export function CopiarEnlace({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <span className="flex flex-wrap items-center gap-3">
      <code className="break-all text-xs">{url}</code>
      <button
        type="button"
        className="text-sm underline underline-offset-4"
        onClick={async () => {
          await navigator.clipboard.writeText(url)
          setCopiado(true)
          setTimeout(() => setCopiado(false), 2000)
        }}
      >
        {copiado ? 'Copiado' : 'Copiar enlace'}
      </button>
    </span>
  )
}
```

- [ ] **Step 4: Página admin**

`app/clientes/admin/page.tsx`:

```tsx
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { BotonSalir } from '@/components/clientes/BotonSalir'
import { CopiarEnlace } from '@/components/clientes/CopiarEnlace'
import { Login } from '@/components/clientes/Login'
import { ServicioNoDisponible } from '@/components/clientes/ServicioNoDisponible'
import { usuarioDeSesion } from '@/lib/clientes/access'
import { almacenes, secretoSesion } from '@/lib/clientes/config'
import { resumenAdmin } from '@/lib/clientes/operations'
import { COOKIE_SESION } from '@/lib/clientes/session'
import { SITE_CONFIG } from '@/lib/seo/metadata.config'

export const dynamic = 'force-dynamic'

const MENSAJES: Record<string, string> = {
  revocado: 'Acceso revocado.',
  desactivado: 'Usuario desactivado.',
  'no-a-ti-mismo': 'No puedes desactivar tu propia cuenta.',
}

type Carga =
  | { estado: 'no-disponible' }
  | { estado: 'sin-sesion' }
  | { estado: 'no-admin' }
  | { estado: 'ok'; emailAdmin: string; datos: Awaited<ReturnType<typeof resumenAdmin>> }

/* notFound() se llama fuera del try: lanza una excepción que Next debe recibir. */
async function cargar(): Promise<Carga> {
  try {
    const a = almacenes()
    const token = (await cookies()).get(COOKIE_SESION)?.value
    const usuario = await usuarioDeSesion(a, token, Date.now(), secretoSesion())
    if (!usuario) return { estado: 'sin-sesion' }
    if (!usuario.admin) return { estado: 'no-admin' }
    return { estado: 'ok', emailAdmin: usuario.email, datos: await resumenAdmin(a) }
  } catch (e) {
    console.error('[clientes] admin', e)
    return { estado: 'no-disponible' }
  }
}

const fecha = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' })
    : 'nunca'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; hecho?: string }>
}) {
  const { error, hecho } = await searchParams
  const c = await cargar()
  if (c.estado === 'no-disponible') return <ServicioNoDisponible />
  if (c.estado === 'sin-sesion') return <Login next="/clientes/admin" error={error} />
  if (c.estado === 'no-admin') notFound()
  const { datos, emailAdmin } = c

  const porCliente = Map.groupBy(datos.artefactos, (f) => f.artefacto.cliente)

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-[family-name:var(--font-ft-serif)] text-3xl">Artefactos de clientes</h1>
        <span className="flex items-center gap-4 text-sm">
          <span className="opacity-60">{emailAdmin}</span>
          <BotonSalir next="/clientes/admin" />
        </span>
      </header>

      {hecho && MENSAJES[hecho] && <p role="status" className="mb-6 text-sm">{MENSAJES[hecho]}</p>}

      <p className="mb-10 max-w-prose text-sm opacity-70">
        Para publicar, actualizar o dar acceso, pídeselo a Claude. Aquí puedes consultar y revocar.
      </p>

      {porCliente.size === 0 && <p>Todavía no hay artefactos publicados.</p>}

      {[...porCliente].map(([cliente, filas]) => (
        <section key={cliente} className="mb-12">
          <h2 className="mb-4 font-[family-name:var(--font-ft-mono)] text-sm uppercase tracking-widest">{cliente}</h2>
          <ul className="flex flex-col gap-6">
            {filas.map(({ artefacto: art, personas }) => (
              <li key={art.id} className="border-t border-fg/15 pt-4">
                <p className="text-lg">{art.titulo}</p>
                <p className="mb-2 text-xs opacity-60">
                  v{art.version} · publicado {fecha(art.publicadoEn)}
                </p>
                <CopiarEnlace url={`${SITE_CONFIG.baseUrl}/clientes/${art.cliente}/${art.id}`} />
                {art.avisos.map((av) => (
                  <p key={av} className="mt-2 text-xs">⚠ {av}</p>
                ))}
                <table className="mt-4 w-full text-sm">
                  <tbody>
                    {personas.length === 0 && (
                      <tr><td className="py-1 opacity-60">Nadie tiene acceso todavía.</td></tr>
                    )}
                    {personas.map((p) => (
                      <tr key={p.email} className="align-top">
                        <td className="py-1 pr-4">{p.email}{!p.activo && ' (desactivado)'}</td>
                        <td className="py-1 pr-4 opacity-60">último acceso: {fecha(p.ultimoAcceso)}</td>
                        <td className="py-1 text-right">
                          <form method="post" action="/clientes/admin/revocar">
                            <input type="hidden" name="id" value={art.id} />
                            <input type="hidden" name="email" value={p.email} />
                            <button type="submit" className="underline underline-offset-4">Revocar</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-16">
        <h2 className="mb-4 font-[family-name:var(--font-ft-mono)] text-sm uppercase tracking-widest">Usuarios</h2>
        <table className="w-full text-sm">
          <tbody>
            {datos.usuarios.map((u) => (
              <tr key={u.email} className="border-t border-fg/15">
                <td className="py-2 pr-4">{u.email}{u.admin && ' · admin'}</td>
                <td className="py-2 pr-4 opacity-60">{u.activo ? 'activo' : 'desactivado'}</td>
                <td className="py-2 text-right">
                  {u.activo && u.email !== emailAdmin && (
                    <form method="post" action="/clientes/admin/usuarios/desactivar">
                      <input type="hidden" name="email" value={u.email} />
                      <button type="submit" className="underline underline-offset-4">Desactivar</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}

```

Nota: `Map.groupBy` requiere Node ≥ 21 (Netlify y local usan 22) y `lib: esnext` (ya en `tsconfig.json`).

- [ ] **Step 5: Verificar**

Run: `npm test && npm run type-check && npm run lint && npm run build`
Expected: todo PASS; `/clientes/admin`, `/clientes/admin/revocar` y `/clientes/admin/usuarios/desactivar` aparecen como dinámicas.

- [ ] **Step 6: Commit**

```bash
git add app/clientes/admin components/clientes/CopiarEnlace.tsx lib/clientes/admin-request.ts
git commit -m "feat(clientes): vista admin con enlaces, accesos y revocación"
```

---

### Task 10: Documentación y PR

**Files:**
- Modify: `README.md` (nueva sección "Zona privada de clientes" en Operations), `netlify.toml` (comentario sobre `CLIENTES_SESSION_SECRET` junto a `SECRETS_SCAN_OMIT_KEYS`; no añadir la clave a la lista)

- [ ] **Step 1: README**

Añadir en `README.md`, dentro de la sección de Operations:

```markdown
### Zona privada de clientes (`/clientes`)

Artefactos de claude.ai confidenciales, uno por enlace, con usuario y contraseña
por persona y artefacto. Diseño: `docs/superpowers/specs/2026-11-17-zona-privada-clientes-design.md`.

- **Datos:** Netlify Blobs (`clientes-{artefactos,registro,usuarios}-{production,staging}`). Nada en el repo.
- **Netlify env:** `CLIENTES_SESSION_SECRET` (≥32 caracteres aleatorios; valor distinto en Production y en Deploy previews/Branch deploys). Sin ella, la zona responde "Servicio no disponible".
- **Gestión:** `npm run clientes -- <comando> --entorno production|staging` con `NETLIFY_SITE_ID` y `NETLIFY_AUTH_TOKEN` en el entorno local. Comandos: `publicar`, `republicar`, `dar-acceso`, `quitar-acceso`, `regenerar-password`, `crear-admin`, `listar`, `borrar`. La carpeta del artefacto debe estar fuera del repo.
- **Vista admin:** `/clientes/admin` (solo cuentas admin `@interactius.com`): enlaces, personas con acceso, último acceso, revocar y desactivar.
- **Recomendación:** enviar la contraseña por un canal distinto al enlace.
```

- [ ] **Step 2: Verificación final completa**

Run: `npm test && npm run type-check && npm run lint && npm run build`
Expected: todo PASS.

Run: `git grep -nE "BEGIN PRIVATE|CLIENTES_SESSION_SECRET=|NETLIFY_AUTH_TOKEN=" -- . ':!docs'`
Expected: sin resultados.

- [ ] **Step 3: Commit y push de la rama**

```bash
git add README.md netlify.toml
git commit -m "docs(clientes): operación de la zona privada de clientes"
git push -u origin feat/zona-privada-clientes
```

- [ ] **Step 4: Abrir PR a `staging`** (pedir confirmación al usuario antes; el repo no tiene `gh` instalado, así que se abre desde la web de GitHub con la URL que imprime `git push`). Descripción: resumen, enlace a spec y plan, checklist de pruebas manuales del Task 11, y la línea final `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

---

### Task 11: Puesta en marcha y pruebas manuales en staging (con el usuario)

Requiere acciones de una persona con acceso a Netlify; no la ejecuta un subagente.

- [ ] **Step 1:** En Netlify → Site configuration → Environment variables, crear `CLIENTES_SESSION_SECRET` con un valor para Production y otro distinto para Deploy previews + Branch deploys (+ staging). Generar cada valor con `openssl rand -base64 48`.
- [ ] **Step 2:** En la máquina local, exportar `NETLIFY_SITE_ID` y `NETLIFY_AUTH_TOKEN` (token personal de Netlify, User settings → Applications).
- [ ] **Step 3:** `npm run clientes -- crear-admin --entorno staging --email <admin>@interactius.com`.
- [ ] **Step 4:** Publicar dos artefactos de prueba (HTML mínimo en el scratchpad) en `staging` con cliente `pruebas`, y dar acceso a `a@ejemplo.com` solo al 1 y a `b@ejemplo.com` solo al 2.
- [ ] **Step 5:** En el deploy de staging, comprobar los 9 puntos de la sección 9 de la spec:
  1. A ve solo el 1; B ve solo el 2, en ambos sentidos.
  2. Sin sesión no carga ni la página ni `/clientes/archivos/…` (403).
  3. Revocar a A desde `/clientes/admin` con su sesión abierta → la siguiente recarga muestra "No tienes acceso".
  4. `regenerar-password` de B → su sesión abierta vuelve al login.
  5. 5 contraseñas malas → "Demasiados intentos".
  6. Copiar la URL de `/clientes/archivos/…` y abrirla pasados 15 minutos → 403.
  7. En la consola del iframe, `document.cookie` está vacío y `fetch('/clientes/admin')` no lleva sesión.
  8. `curl -sI` de una página de `/clientes` muestra `x-robots-tag: noindex, nofollow`; `robots.txt` de producción incluye `Disallow: /clientes` tras el merge; `sitemap.xml` no contiene `/clientes`.
  9. Un usuario no admin en `/clientes/admin` ve "No tienes acceso".
- [ ] **Step 6:** `npm run clientes -- borrar --entorno staging --id <id> --si` para los dos artefactos de prueba.
- [ ] **Step 7:** Si todo pasa: PR `staging` → `main`, y después `crear-admin --entorno production` para el equipo.
