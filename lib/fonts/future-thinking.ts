/* ==========================================================================
   Fuentes de las landings de cliente (Bershka · Future Thinking)
   --------------------------------------------------------------------------
   Cada digest vive fuera de `app/[locale]/`, así que necesita su propio root
   layout con su `<html>`. Para no repetir la configuración de next/font en
   cada uno, se declara aquí una sola vez y los layouts importan `ftFontsClass`.
   ========================================================================== */

import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Serif,
} from 'next/font/google'

const mono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  variable: '--font-ft-mono',
  display: 'swap',
})

const serif = IBM_Plex_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400'],
  variable: '--font-ft-serif',
  display: 'swap',
})

const sans = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  variable: '--font-ft-sans',
  display: 'swap',
})

/** Clases con las CSS variables de las tres familias, para el `<html>`. */
export const ftFontsClass = `${mono.variable} ${serif.variable} ${sans.variable}`
