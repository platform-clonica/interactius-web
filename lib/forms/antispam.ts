/**
 * Antispam para los cuatro formularios públicos (contacto, newsletter,
 * testers, bdw).
 *
 * Los endpoints no tenían ninguna defensa: aceptaban cualquier POST con la
 * forma correcta, y la validación solo miraba longitudes mínimas. Un bot con
 * "Zsqcvmj Aelstfj" y un gmail cualquiera pasaba sin esfuerzo.
 *
 * Dos trampas, las dos invisibles para quien rellena el formulario de verdad.
 * Ninguna añade un tercero ni una cookie, así que no tocan el consentimiento
 * del banner AEPD:
 *
 *   1. HONEYPOT — un campo que existe en el DOM pero no se ve. Los bots
 *      genéricos rellenan todo input que encuentran; una persona no puede
 *      rellenar lo que no ve. Si llega con contenido, es un bot.
 *
 *   2. TRAMPA DE TIEMPO — el cliente mide cuánto tardó entre montar el
 *      formulario y enviarlo. Nadie escribe nombre, apellido, empresa, email
 *      y un mensaje de diez caracteres en menos de tres segundos.
 *
 * Se mide el tiempo TRANSCURRIDO en el cliente (`elapsedMs`) y no un
 * timestamp absoluto a propósito: un timestamp obligaría a comparar el reloj
 * del visitante con el del servidor, y un reloj adelantado daría diferencias
 * negativas que se leerían como envío instantáneo — descartando a una persona
 * real por tener la hora mal puesta.
 *
 * Ninguna de las dos para a un bot hecho a medida para este formulario: las
 * dos se pueden sortear leyendo el HTML. Paran el spam automatizado corriente,
 * que es el que llega por barrido. Si aparece spam dirigido, el siguiente paso
 * es una verificación de navegador (Cloudflare Turnstile, que tampoco usa
 * cookies de tracking).
 */

import { z } from 'zod'

/**
 * Nombre del campo trampa. Suena a campo real —un formulario de contacto bien
 * puede tener un asunto— así que el bot lo rellena, pero ningún gestor de
 * contraseñas ni autocompletado del navegador lo toca: eso evita que el
 * autofill de una persona real lo rellene y la marque como bot.
 *
 * Si algún día hace falta un campo "asunto" de verdad, hay que renombrar esta
 * trampa ANTES de añadirlo.
 */
export const HONEYPOT_FIELD = 'subject'

/** Por debajo de esto, el envío no lo ha escrito una persona. */
export const MIN_ELAPSED_MS = 3000

/**
 * Campos que todo formulario público añade a su payload. Opcionales en el
 * esquema para que un envío sin ellos no muera con un 422 visible: se descarta
 * en silencio en `spamReason()`, que es lo que conviene frente a un bot.
 */
export const antiSpamFields = {
  [HONEYPOT_FIELD]: z.string().optional(),
  elapsedMs: z.number().int().nonnegative().optional(),
}

export type AntiSpamInput = {
  [HONEYPOT_FIELD]?: string
  elapsedMs?: number
}

/**
 * Devuelve el motivo por el que el envío parece spam, o `null` si parece
 * legítimo. El motivo es para el log del servidor, nunca para la respuesta:
 * decirle a un bot cuál de las dos trampas ha pisado es enseñarle a evitarla.
 */
export function spamReason(input: AntiSpamInput): string | null {
  const honeypot = input[HONEYPOT_FIELD]
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    return 'honeypot_filled'
  }

  // Ausente = el cliente no ejecutó nuestro JS, así que no pasó por el
  // formulario. Un POST directo al endpoint entra por aquí.
  if (typeof input.elapsedMs !== 'number') {
    return 'elapsed_missing'
  }

  if (input.elapsedMs < MIN_ELAPSED_MS) {
    return `too_fast_${input.elapsedMs}ms`
  }

  return null
}
