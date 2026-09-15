# Assets — Bershka · Future Thinking (Q2)

Archivos estáticos de la landing `/proyectos/bershka/future-thinking-digest-q2`.

| Archivo                                       | Uso                                      |
| --------------------------------------------- | ---------------------------------------- |
| `Future Digest Q2 Bershka by Interactius.pdf` | Descarga del informe (CTA "Descargar informe (PDF)"). |
| `Future Digest Q2 Bershka by Interactius.m4a` | Audio del resumen (reproductor inline).  |
| `hero.jpg`                                    | Imagen hero de la columna derecha.       |

Los nombres deben coincidir exactamente con los campos `pdfFile`, `audioFile` y
`heroFile` de la entrada `BERSHKA_Q2` en `lib/data/bershka-digests.ts`. Si
renombras un archivo, actualiza también ese fichero.

## Compresión aplicada

| Asset | Original                  | En repo            |
| ----- | ------------------------- | ------------------ |
| Audio | 40 MB, estéreo 256 kbps   | 10 MB, mono 64 kbps |
| Hero  | 2,5 MB PNG, 1402×1862     | 160 KB JPEG, 1200 px |
| PDF   | 35 MB                     | 16 MB (versión del 15-sep) |

El audio se convirtió con `afconvert` (macOS) en dos pasos: downmix a PCM mono y
recodificación a AAC 64 kbps. La duración se conservó exacta (21:38). La imagen,
con `sips` a JPEG calidad 82; es una foto con barrido de movimiento, sin texto ni
bordes duros, así que el JPEG no introduce artefactos visibles.

Si hay que actualizar el peso del PDF que se muestra en pantalla, el valor está
en `pdfSize` dentro de `lib/data/bershka-digests.ts`.

## Aviso de seguridad

Estos archivos se sirven desde `public/`, por lo que son accesibles por URL
directa. La página además es pública: el Basic Auth se retiró en julio de 2026.
Si el contenido fuera confidencial, habría que servirlos desde un route handler
con auth, leyendo de una carpeta fuera de `public/`.
