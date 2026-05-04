/**
 * Consent — tipos compartidos entre store, helpers y UI.
 * --------------------------------------------------------------------------
 * Diseño alineado con la Guía AEPD 2024 sobre uso de cookies. Cuatro
 * categorías canónicas; `necessary` siempre activa.
 */

export const CONSENT_CATEGORIES = [
  'necessary',
  'preferences',
  'analytics',
  'marketing',
] as const

export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number]

export type ConsentMap = Record<ConsentCategory, boolean>

/**
 * Versión del contrato de consentimiento. Bump cuando cambien las
 * categorías o las finalidades — invalida los consentimientos previos
 * y obliga a re-consentir.
 */
export const CONSENT_VERSION = 'v1'

/**
 * Snapshot persistido en cookie. Usa claves cortas para minimizar
 * el tamaño del header HTTP.
 *  v: version
 *  t: timestamp epoch ms
 *  c: categories map { n, p, a, m } booleans (1 ó 0)
 */
export interface ConsentCookieShape {
  v: string
  t: number
  c: { n: 0 | 1; p: 0 | 1; a: 0 | 1; m: 0 | 1 }
}

/**
 * Snapshot decodificado para uso en aplicación.
 */
export interface ConsentSnapshot {
  version: string
  timestamp: number
  categories: ConsentMap
}

/** Estado por defecto cuando no hay decisión aún. */
export const DEFAULT_CATEGORIES: ConsentMap = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
}
