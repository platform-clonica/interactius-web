/* accent — el color de cada pieza, atado al servicio que le corresponde.

   `lib/tokens.ts` del manual de marca es tajante: los tres acentos NO son
   decorativos. Cada uno identifica un servicio:

     Opal      #B0B5B0   Pensamiento estratégico
     Burdeos   #99335F   Diseño de experiencias
     Esmeralda #5999A6   Transformación cultural

   Aquí se usan exactamente para eso. Cada artículo se pinta con el acento de
   su `parentCategory`, que es un dato del frontmatter del MDX y no una
   elección estética, y cada clave con el del servicio al que remite su
   pregunta final. Si un artículo cambia de categoría madre, su color cambia
   solo.

   POR QUÉ SON FONDOS Y NO COLOR DE TEXTO
   --------------------------------------
   Medido contra el fondo de la web (#F5F2ED), como color de texto solo
   Burdeos es legible:

     Opal       1,87 : 1   ✗   (hace falta 4,5)
     Burdeos    6,28 : 1   ✓
     Esmeralda  2,88 : 1   ✗

   Como relleno de etiqueta, en cambio, los tres pasan de sobra eligiendo bien
   el color del texto encima:

     Opal       texto oscuro  8,34 : 1
     Burdeos    texto claro   6,28 : 1
     Esmeralda  texto oscuro  5,40 : 1

   De ahí que cada acento traiga su propio `chipTexto`: no es una preferencia,
   es lo único que deja la etiqueta legible en cada caso. */

export type Servicio = 'pensamiento-estrategico' | 'diseno-experiencias' | 'transformacion-cultural'

export interface Acento {
  /** Relleno de la etiqueta y del filete superior. */
  fondo: string
  /** Color del texto que va encima del relleno. Ver tabla de contraste arriba. */
  chipTexto: string
}

/* Las clases se escriben enteras, sin interpolar, porque Tailwind rastrea el
   código buscando literales: `bg-${x}` no llegaría nunca al CSS final. */
export const ACENTO: Record<Servicio, Acento> = {
  'pensamiento-estrategico': { fondo: 'bg-opal', chipTexto: 'text-dark' },
  'diseno-experiencias': { fondo: 'bg-bordeaux', chipTexto: 'text-warm-light' },
  'transformacion-cultural': { fondo: 'bg-emerald', chipTexto: 'text-dark' },
}

/** Devuelve el juego de clases de un servicio, con Opal como red de seguridad. */
export function acento(servicio: string | undefined): Acento {
  return ACENTO[servicio as Servicio] ?? ACENTO['pensamiento-estrategico']
}
