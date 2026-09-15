/* ==========================================================================
   Datos de los digests de cliente — Bershka · Future Thinking
   --------------------------------------------------------------------------
   Cada trimestre es una entrada de este fichero. La landing que los pinta es
   `components/proyectos/FutureThinkingLanding.tsx`: si hay que cambiar diseño
   se toca allí una vez y aplica a todos los trimestres.

   Para añadir un trimestre nuevo:
     1. Añade su entrada aquí.
     2. Crea `app/proyectos/bershka/<ruta>/{layout,page}.tsx` copiando los de
        `future-thinking-digest-q2` y apuntando a la entrada nueva.
     3. Deja los assets en `public/<assetBase>/` con los nombres exactos.
   El middleware ya hace bypass de i18n para todo `/proyectos/bershka`.
   ========================================================================== */

export type Digest = {
  /** Parte en negrita de la etiqueta superior, p.ej. `[Future Thinking]`. */
  labelTag: string
  /** Resto de la etiqueta, en peso normal, p.ej. `Resultados Q1 2026`. */
  labelRest: string
  /** Titular principal (h1). */
  title: string
  /** Entradilla bajo el titular. */
  lead: string
  /** Cliente al que se restringe el acceso (se pinta en el footer). */
  client: string
  /** Año del copyright del footer. */
  year: number
  /** Carpeta de los assets dentro de `public/`, sin barra final. */
  assetBase: string
  /** Nombre exacto del PDF dentro de `assetBase`. */
  pdfFile: string
  /**
   * Peso del PDF tal como se muestra al usuario. Es literal a propósito:
   * `public/` no es legible de forma fiable en runtime serverless, así que
   * se actualiza a mano cuando se reemplaza el archivo.
   */
  pdfSize: string
  /** Nombre exacto del audio dentro de `assetBase`. */
  audioFile: string
  /** MIME del audio. `.m4a` → `audio/mp4`; `.mp3` → `audio/mpeg`. */
  audioType: string
  /** Nombre exacto de la imagen hero dentro de `assetBase`. */
  heroFile: string
  /** Alt de la imagen hero. */
  heroAlt: string
  /** Título de la pestaña del navegador. */
  metaTitle: string
  /** Meta description. */
  metaDescription: string
}

export const BERSHKA_Q1: Digest = {
  labelTag: '[Future Thinking]',
  labelRest: 'Resultados Q1 2026',
  title: 'El futuro de la interacción en el e-commerce',
  lead:
    'Un recorrido por los aprendizajes del primer trimestre. Puedes escuchar ' +
    'el resumen en formato podcast o descargar el informe completo en PDF.',
  client: 'Bershka',
  year: 2026,
  assetBase: '/proyectos/bershka/future-thinking',
  pdfFile: 'Future Digest Bershka by Interactius.pdf',
  pdfSize: '29 MB',
  audioFile: 'Future Digest Bershka by Interactius.m4a',
  audioType: 'audio/mp4',
  heroFile: 'hero.png',
  heroAlt: 'Composición visual del informe Future Thinking',
  metaTitle: 'Future Thinking — Resultados Q1 · Interactius',
  metaDescription: 'Informe de resultados Q1 para Bershka. Acceso restringido.',
}

export const BERSHKA_Q2: Digest = {
  labelTag: '[Future Thinking]',
  labelRest: 'Resultados Q2 2026',
  title: 'El futuro de la interacción en el e-commerce',
  lead:
    'Un recorrido por los aprendizajes del segundo trimestre. Puedes escuchar ' +
    'el resumen en formato podcast o descargar el informe completo en PDF.',
  client: 'Bershka',
  year: 2026,
  assetBase: '/proyectos/bershka/future-thinking-digest-q2',
  pdfFile: 'Future Digest Q2 Bershka by Interactius.pdf',
  pdfSize: '16 MB',
  audioFile: 'Future Digest Q2 Bershka by Interactius.m4a',
  audioType: 'audio/mp4',
  heroFile: 'hero.jpg',
  heroAlt: 'Composición visual del informe Future Thinking del segundo trimestre',
  metaTitle: 'Future Thinking — Resultados Q2 · Interactius',
  metaDescription: 'Informe de resultados Q2 para Bershka. Acceso restringido.',
}
