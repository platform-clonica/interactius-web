# Zona privada de clientes — diseño

Fecha: 2026-11-17 · Estado: pendiente de revisión

## 1. Objetivo

Publicar en `interactius.com` entregables confidenciales de proyectos para que
solo los vean las personas del cliente autorizadas, con **enlace + usuario +
contraseña**, sin que el contenido pase nunca por el repositorio de GitHub
(que es público).

## 2. Contexto y requisitos

- Los entregables son **Artifacts de claude.ai** (páginas HTML, a veces con
  archivos adicionales). Cada departamento de Interactius los crea en Claude y
  los comparte con la cuenta vinculada a Claude Code.
- La unidad de permiso es **(persona, artefacto)**. Un mismo cliente puede
  tener varios artefactos con personas autorizadas distintas; nadie tiene
  acceso "a todo el cliente" por defecto. El cliente es solo una agrupación y
  un segmento de la URL.
- **Cada artefacto es un enlace independiente.** No hay portada de cliente.
- Interactius **envía a mano** el enlace, el usuario y la contraseña. No hay
  envío de correos desde la web.
- Lo que se publica es una **copia fija** del artefacto. Si el original cambia
  en claude.ai, la web no cambia hasta que se republica explícitamente.
- La gestión (publicar, republicar, dar y quitar accesos, crear usuarios,
  regenerar contraseñas) se hace **pidiéndoselo a Claude**, que usa un script
  del repo. Existe además una **vista de admin** de consulta para el equipo.

### Fuera de alcance (v1)

- Caducidad automática de accesos.
- Cambio de contraseña por parte del cliente.
- Portada de cliente que liste varios artefactos.
- Envío de correos (invitaciones, recuperación).
- Funciones de runtime de Claude dentro del artefacto (`window.claude.*`,
  base de datos, etc.): no funcionan fuera de claude.ai.
- Migrar las landings de Bershka y poner el repo en privado (se recomienda
  aparte; ver §11).

## 3. Arquitectura

```
claude.ai (artefacto compartido)
        │  Claude lee el artefacto (Artifact read / read_file)
        ▼
scratchpad local (fuera del repo)
        │  npm run clientes -- publicar …
        ▼
Netlify Blobs (privado, por entorno)          ◄── vista admin (lectura + revocar)
  ├─ store "clientes-artefactos"  (archivos)
  ├─ store "clientes-registro"    (fichas + permisos)
  └─ store "clientes-usuarios"    (cuentas + intentos fallidos)
        ▲
        │  route handlers Next (runtime Node) — comprueban sesión + permiso
        │
navegador del cliente: /clientes/<cliente>/<id>
```

Piezas, cada una con una responsabilidad:

| Unidad | Responsabilidad | Ubicación prevista |
| --- | --- | --- |
| `storage` | Leer y escribir en los tres stores; nombre del store según entorno | `lib/clientes/storage.ts` |
| `passwords` | Generar contraseñas; hash y verificación con scrypt | `lib/clientes/passwords.ts` |
| `session` | Crear y verificar la cookie firmada (HMAC-SHA256) | `lib/clientes/session.ts` |
| `access` | `canView(user, artifactId)`; registro del último acceso | `lib/clientes/access.ts` |
| `rate-limit` | Contador de fallos y bloqueo por usuario | `lib/clientes/rate-limit.ts` |
| `signed-urls` | Firmar y verificar URLs de archivos internos con caducidad | `lib/clientes/signed-urls.ts` |
| Rutas web | Login, visor, contenido, logout, admin | `app/clientes/…` |
| CLI | Publicar y gestionar desde terminal | `scripts/clientes.mjs` |

`app/clientes/` vive fuera de `app/[locale]/`, igual que `app/proyectos/`, y
necesita el bypass de i18n en `middleware.ts`. La zona es solo en español.

Segmentos reservados (no pueden ser slug de cliente): `login`, `logout`,
`admin`, `archivos`. En Next las rutas estáticas tienen prioridad sobre
`[cliente]`, y la CLI rechaza esos slugs. No se usa un prefijo con `_`
porque en App Router las carpetas `_x` son privadas y no generan ruta.

## 4. Modelo de datos

Todos los identificadores aleatorios usan `crypto.randomBytes` codificado en
base32 sin ambigüedades (minúsculas, sin `0/o/1/l`).

**Artefacto** — `clientes-registro`, clave `artefactos/<id>`

```json
{
  "id": "k7f3q9xm2p",
  "cliente": "caixabank",
  "titulo": "PoC microinteracciones",
  "origen": "https://claude.ai/artifact/…",
  "version": 3,
  "publicadoEn": "2026-11-20T10:00:00Z",
  "publicadoPor": "claude-code",
  "entrada": "index.html",
  "avisos": ["usa window.claude: funciones de Claude no disponibles"],
  "accesos": {
    "ana@cliente.com": { "concedidoEn": "…", "ultimoAcceso": "…" }
  }
}
```

- `id`: 10 caracteres aleatorios (~50 bits). Junto a `cliente` forma la URL
  `/clientes/<cliente>/<id>`. El visor comprueba que `cliente` coincide; si
  no, responde como "no tienes acceso".
- `version` se incrementa en cada republicación; los archivos se guardan bajo
  `artefactos/<id>/v<version>/…` y la versión anterior se borra después de
  escribir la nueva (no hay estado intermedio visible).

**Archivos** — `clientes-artefactos`, clave `<id>/v<version>/<ruta>`, con su
`contentType` como metadato.

**Usuario** — `clientes-usuarios`, clave `usuarios/<email-normalizado>`

```json
{
  "email": "ana@cliente.com",
  "hash": "scrypt$N=16384,r=8,p=1$<salt-b64>$<hash-b64>",
  "admin": false,
  "creadoEn": "…",
  "credencialesEn": "…",
  "fallos": 0,
  "bloqueadoHasta": null
}
```

- El email se normaliza a minúsculas y sin espacios.
- `credencialesEn` cambia al regenerar la contraseña; las sesiones emitidas
  antes de esa fecha dejan de ser válidas.
- Los permisos viven en el artefacto (`accesos`), no en el usuario: así una
  republicación o revocación es una sola escritura. Para "artefactos de un
  usuario" la vista admin recorre los artefactos (volumen esperado: decenas).

**Índice** — `clientes-registro`, clave `indice`: lista de `{id, cliente,
titulo}` para la vista admin. Se reescribe en cada alta y baja.

## 5. Rutas

| Ruta | Método | Comportamiento |
| --- | --- | --- |
| `/clientes/<cliente>/<id>` | GET | Sin sesión: formulario de login. Con sesión y permiso: página del visor (cabecera mínima con marca Interactius + "cerrar sesión" + iframe a `/clientes/archivos/<id>/<t>/<entrada>`). Con sesión sin permiso o artefacto inexistente: "No tienes acceso a este contenido" con botón de cerrar sesión. Actualiza `ultimoAcceso`. |
| `/clientes/login` | POST | Valida credenciales, aplica rate limit, emite cookie, redirige al `next` (solo rutas internas `/clientes/…`). |
| `/clientes/logout` | POST | Borra la cookie. |
| `/clientes/archivos/<id>/<t>/<ruta…>` | GET | Sirve un archivo del artefacto. Requiere que el token `<t>` de la ruta sea válido y no haya caducado. Respuesta con cabeceras de aislamiento (§6.5). |
| `/clientes/admin` | GET | Solo `admin: true`. Lista artefactos agrupados por cliente: título, enlace con botón copiar, versión, fecha, avisos, personas con acceso y su último acceso. |
| `/clientes/admin/revocar` | POST | Solo admin. Quita una persona de un artefacto. |
| `/clientes/admin/usuarios/desactivar` | POST | Solo admin. Borra el hash del usuario (no puede entrar en nada) sin borrar el histórico. |

Todas las páginas de `/clientes` llevan `robots: noindex, nofollow`,
`Cache-Control: private, no-store` y `Referrer-Policy: no-referrer`.
`app/robots.ts` añade `Disallow: /clientes`; `app/sitemap.ts` no las incluye.

## 6. Seguridad

### 6.1 Contraseñas
- Generadas por la CLI: 16 caracteres del alfabeto base32 sin ambigüedades
  (~80 bits), agrupadas de 4 en 4 para dictarlas (`k7f3-q9xm-2pab-r4dz`).
- Hash con `crypto.scrypt` (N=16384, r=8, p=1, salt 16 bytes). Comparación
  con `timingSafeEqual`.
- La contraseña en claro solo aparece una vez, en la salida de la CLI.

### 6.2 Sesiones
- Cookie `__Host-ia_clientes`: `HttpOnly`, `Secure`, `SameSite=Lax`,
  `Path=/`, 7 días.
- Contenido: `email.emitidaEn.expira` + HMAC-SHA256 con `CLIENTES_SESSION_SECRET`.
- En **cada petición** se verifica la firma, la caducidad, que el usuario
  existe y tiene hash, que `emitidaEn >= credencialesEn` y el permiso sobre
  el artefacto. Revocar o regenerar surte efecto inmediato.

### 6.3 Intentos fallidos
- 5 fallos consecutivos de un usuario lo bloquean 15 minutos; un login
  correcto pone el contador a 0.
- Para usuarios inexistentes se ejecuta igualmente un scrypt de una
  contraseña ficticia, para que el tiempo de respuesta no revele si existen.
- Mensaje único: "Usuario o contraseña incorrectos" (también cuando está
  bloqueado: "Demasiados intentos. Prueba de nuevo en unos minutos").

### 6.4 Admin y CSRF
- Las acciones POST de admin y el login comprueban que la cabecera `Origin`
  coincide con el host. Sin `Origin` válido → 403.

### 6.5 Aislamiento del artefacto
- `/clientes/archivos/…` responde con
  `Content-Security-Policy: sandbox allow-scripts allow-popups allow-forms allow-modals allow-downloads`
  (sin `allow-same-origin`): el documento corre con origen opaco, no puede
  leer cookies de `interactius.com` ni hacer peticiones con su sesión.
- Como un iframe con origen opaco no envía la cookie `SameSite=Lax` en sus
  subrecursos, la autorización de `/clientes/archivos/…` no usa la cookie sino
  un **token firmado en la ruta**: `t = base64url(HMAC(secret, id|version|expira))`,
  válida 15 minutos y común a todos los archivos de esa versión. La página del
  visor (que sí comprobó sesión y permiso) genera la URL del iframe. El token
  va en la ruta (`/clientes/archivos/<id>/<t>/<ruta>`) y no en la query para
  que las rutas relativas del HTML lo hereden.
- Consecuencia aceptada: una URL de archivo copiada funciona como máximo 15
  minutos.
- Recursos externos permitidos: los que el artefacto ya cargaba en claude.ai
  (CDNs de scripts y Google Fonts). No se añade CSP restrictiva de red en v1.

### 6.6 Secretos y entornos
- Variables en Netlify: `CLIENTES_SESSION_SECRET` (32+ bytes aleatorios,
  distinta por contexto). Netlify Blobs se usa con las credenciales
  automáticas del sitio en runtime; la CLI usa `NETLIFY_AUTH_TOKEN` y
  `NETLIFY_SITE_ID` del entorno local (nunca en el repo).
- Los stores llevan sufijo por contexto: `clientes-…-production` en
  producción y `clientes-…-staging` en el resto. La CLI exige
  `--entorno production|staging` explícito.
- **Fail-closed:** sin `CLIENTES_SESSION_SECRET` o sin acceso a Blobs, toda la
  zona responde 503 "Servicio no disponible" y no autentica a nadie.

### 6.7 Nada confidencial en el repo
- La CLI trabaja solo con archivos en un directorio fuera del repo (por
  defecto el scratchpad de la sesión) y **rechaza** rutas de origen dentro del
  working tree.
- `.gitignore` añade `/.clientes-tmp/` por si alguien usa un directorio local.
- La CLI nunca escribe credenciales en disco; solo las imprime.

## 7. CLI — `npm run clientes -- <comando>`

Todas las órdenes requieren `--entorno`.

| Comando | Efecto |
| --- | --- |
| `publicar --cliente <slug> --titulo "<t>" --origen <url-claude> --dir <carpeta> [--entrada index.html]` | Crea artefacto nuevo, sube archivos, imprime enlace. |
| `republicar --id <id> --dir <carpeta>` | Sube nueva versión, mantiene enlace y accesos. |
| `dar-acceso --id <id> --email <e>` | Crea el usuario si no existe (imprime contraseña) y lo añade al artefacto. Imprime enlace + usuario (+ contraseña si es nuevo). |
| `quitar-acceso --id <id> --email <e>` | Lo quita del artefacto. |
| `regenerar-password --email <e>` | Nueva contraseña; invalida sesiones previas. |
| `crear-admin --email <e@interactius.com>` | Usuario admin. Solo se aceptan correos `@interactius.com`. |
| `listar [--cliente <slug>]` | Lo mismo que la vista admin, en texto. |
| `borrar --id <id>` | Borra archivos y ficha. Pide confirmación con `--si`. |

Flujo de publicación que sigue Claude:
1. `Artifact read`/`list_files`/`read_file` del artefacto compartido → archivos
   al scratchpad.
2. Detecta usos de `window.claude` u otras capacidades de runtime y avisa al
   usuario antes de publicar; si se publica igual, el aviso queda en `avisos`.
3. `publicar` → `dar-acceso` por cada persona.
4. Devuelve al usuario, por persona: enlace, usuario y contraseña, con la
   recomendación de enviar la contraseña por otro canal.

## 8. Errores

| Situación | Respuesta |
| --- | --- |
| Falta secreto o falla Blobs | 503 genérico; detalle solo en logs. |
| Sin sesión | Formulario de login (200). |
| Sesión válida, sin permiso / artefacto inexistente / cliente no coincide | Misma pantalla "No tienes acceso" (404 de status). |
| Token de archivo caducado | 403. Lo ya cargado sigue funcionando; si la pestaña vuelve a primer plano tras más de 15 min, el visor recarga la página para obtener un token nuevo. |
| Artefacto no legible desde claude.ai | La CLI no se llega a ejecutar; Claude explica qué falta. |

## 9. Pruebas

- Añadir **Vitest** (solo devDependency y script `test`) con tests unitarios de
  `passwords`, `session`, `access`, `rate-limit` y `signed-urls`, usando un
  store en memoria en lugar de Blobs.
- `npm run type-check && npm run lint && npm test` antes de cada PR.
- Prueba manual en el deploy de staging con dos usuarios y dos artefactos
  cruzados:
  1. A ve solo el artefacto 1; B ve solo el 2, en ambos sentidos.
  2. Sin sesión no carga ni la página ni `/clientes/archivos/…`.
  3. Revocar con sesión abierta corta el acceso en la siguiente petición.
  4. Regenerar contraseña invalida la sesión abierta.
  5. 5 fallos bloquean 15 minutos.
  6. Una URL de archivo copiada deja de funcionar tras 15 minutos.
  7. El artefacto no puede leer `document.cookie` de la zona ni llamar a
     `/clientes/admin` con sesión.
  8. `/clientes` tiene `noindex`, está en `Disallow` y no está en el sitemap.
  9. Un usuario no admin recibe "no tienes acceso" en `/clientes/admin`.

## 10. Entrega

Rama `feat/zona-privada-clientes` → PR a `staging` → pruebas manuales en
`staging.interactius.com` → PR de `staging` a `main`. Antes del primer deploy,
crear `CLIENTES_SESSION_SECRET` en Netlify (producción y staging, valores
distintos) y la primera cuenta admin con la CLI.

## 11. Recomendaciones fuera de este proyecto

- **Poner `platform-clonica/interactius-web` en privado.** Los PDF y audios de
  Bershka en `public/proyectos/bershka/` están hoy en un repo público y en su
  historial; la Basic Auth de la landing no los protege.
- Más adelante, migrar las landings de Bershka a esta zona privada.
