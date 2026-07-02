# Assets — Bershka · Future Thinking

Coloca aquí los archivos estáticos de la landing
`/proyectos/bershka/future-thinking`:

| Archivo                                    | Uso                                  |
| ------------------------------------------ | ------------------------------------ |
| `Future Digest Bershka by Interactius.pdf` | Descarga del informe (CTA "Descargar informe (PDF)"). |
| `Future Digest Bershka by Interactius.m4a` | Audio del resumen (reproductor inline). |
| `hero.png`                                 | Imagen hero de la columna derecha.   |

Los nombres deben coincidir exactamente con las constantes de
`app/proyectos/bershka/future-thinking/page.tsx` (`PDF_FILE`, `AUDIO_FILE`,
`HERO_FILE`). Si renombras un archivo, actualiza también esa constante.

## Aviso de seguridad

Estos archivos se sirven desde `public/`, por lo que **NO pasan por el Basic
Auth de `middleware.ts`** (el matcher excluye rutas con extensión). Es decir,
son accesibles por URL directa aunque la página esté protegida.

Si el informe o el podcast son sensibles, hay que servirlos a través de un
route handler con auth (leyendo de una carpeta fuera de `public/`). Esa
protección de assets quedó pendiente de forma intencionada.
