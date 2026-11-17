import { randomBytes } from 'node:crypto'

/** 32 símbolos sin `0/o/1/l`: fáciles de dictar y copiar. */
export const ALFABETO = 'abcdefghijkmnpqrstuvwxyz23456789'

export const ID_ARTEFACTO_RE = /^[abcdefghijkmnpqrstuvwxyz23456789]{10}$/

/** 256 es múltiplo de 32, así que `b & 31` es uniforme. */
export function idAleatorio(longitud: number): string {
  let out = ''
  for (const b of randomBytes(longitud)) out += ALFABETO[b & 31]
  return out
}

export const SLUGS_RESERVADOS = ['login', 'logout', 'admin', 'archivos'] as const

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Devuelve el motivo del error o `null` si el slug es válido. */
export function validarSlugCliente(slug: string): string | null {
  if (!SLUG_RE.test(slug)) {
    return 'El cliente debe ir en minúsculas, con letras, números y guiones simples.'
  }
  if ((SLUGS_RESERVADOS as readonly string[]).includes(slug)) {
    return `"${slug}" es un nombre reservado por la zona de clientes.`
  }
  return null
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function esEmailInteractius(email: string): boolean {
  return normalizarEmail(email).endsWith('@interactius.com')
}
