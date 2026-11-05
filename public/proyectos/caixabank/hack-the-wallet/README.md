# Assets — CaixaBank · Digest "Hack the wallet"

Archivos estáticos de la landing `/proyectos/caixabank/hack-the-wallet`.

| Archivo                                                | Uso                                      |
| ------------------------------------------------------ | ---------------------------------------- |
| `Digest Hack the wallet CaixaBank by Interactius.pdf`  | Descarga del informe (CTA "Descargar informe (PDF)"). 63 páginas, 10,6 MB. |
| `Digest Hack the wallet CaixaBank by Interactius.m4a`  | Audio del resumen (16:51, mono AAC 64 kbps). |
| `hero.jpg`                                             | Imagen hero de la columna derecha (665×832). |
| `caixabank-logo.webp`                                  | Logo centrado sobre el hero; la landing lo pinta en blanco con CSS. 1200×248, fondo transparente. |

Los nombres deben coincidir exactamente con los campos `pdfFile`, `audioFile` y
`heroFile` de `CAIXABANK_HACK_THE_WALLET` en `lib/data/caixabank-digests.ts`. Si
renombras un archivo, actualiza también ese fichero. El peso del PDF que se
muestra en el botón es el `pdfSize` de ese mismo fichero: se actualiza a mano.

Los assets llegaron ya comprimidos (audio de 8,5 MB, hero de 90 KB y PDF de
10,6 MB), así que se copiaron tal cual desde `docs/caixabank-digest/assets/`.
El PDF venía como `informe-hack-the-wallet.pdf`; se renombró siguiendo la
convención de Bershka porque ese nombre es el que recibe quien lo descarga.

El logo llegó como `Logo_CaixaBank.svg`, pero era un WebP de 3840 px con la
extensión cambiada (no un vector). Se reescaló a 1200 px, WebP sin pérdida
(16 KB), con el nombre y la extensión correctos.

## Aviso de seguridad

La página es pública (sin Basic Auth, a diferencia de las de Bershka) y solo
queda fuera de buscadores con `noindex`. Estos archivos se sirven desde
`public/`, así que también son accesibles por URL directa. Si el contenido
pasara a ser confidencial, habría que proteger la ruta en `CLIENT_LANDINGS`
(`middleware.ts`) y servir los archivos desde un route handler con auth,
leyendo de una carpeta fuera de `public/`.
