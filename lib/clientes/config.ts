import { crearAlmacenesNetlify } from './netlify-store'
import type { Almacenes } from './store'
import type { Entorno } from './types'

/** Algo esencial falta o falla: la zona no autentica a nadie (fail-closed). */
export class ZonaNoDisponible extends Error {}

/**
 * Por defecto `staging`: solo el host de producción exacto usa los stores de producción,
 * así un deploy mal configurado o con URL inesperada nunca toca datos reales.
 * Escrita literal (`process.env.NEXT_PUBLIC_SITE_URL`) para que Next la inyecte.
 */
export function entornoActual(): Entorno {
  const url = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/+$/, '')
  return url === 'https://www.interactius.com' || url === 'https://interactius.com' ? 'production' : 'staging'
}

export function secretoSesion(): string {
  // Escrita literal a propósito (ver comentario equivalente en middleware.ts).
  const s = process.env.CLIENTES_SESSION_SECRET
  if (!s || s.length < 32) throw new ZonaNoDisponible('Falta CLIENTES_SESSION_SECRET (mín. 32 caracteres).')
  return s
}

/** Sin caché de módulo: se crean en cada llamada (getStore es barato y evita contexto obsoleto en instancias calientes). */
export function almacenes(): Almacenes {
  try {
    return crearAlmacenesNetlify(entornoActual())
  } catch (e) {
    console.error('[clientes] Netlify Blobs no disponible', e)
    throw new ZonaNoDisponible('Netlify Blobs no disponible.')
  }
}
