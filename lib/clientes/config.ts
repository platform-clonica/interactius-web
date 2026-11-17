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
