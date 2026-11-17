import { firmaValida, firmar } from './hmac'

/** `__Host-` obliga a Secure, Path=/ y sin Domain: no se comparte con subdominios. */
export const COOKIE_SESION = '__Host-ia_clientes'
export const DURACION_SESION_MS = 7 * 24 * 60 * 60 * 1000

export interface Sesion {
  email: string
  emitidaEn: number
  expira: number
}

/** Formato: `<email b64url>.<emitidaEn>.<expira>.<firma>`. */
export function crearTokenSesion(email: string, ahora: number, secreto: string): string {
  const carga = [
    Buffer.from(email).toString('base64url'),
    String(ahora),
    String(ahora + DURACION_SESION_MS),
  ].join('.')
  return `${carga}.${firmar(`sesion|${carga}`, secreto)}`
}

export function leerTokenSesion(
  token: string | undefined,
  ahora: number,
  secreto: string,
): Sesion | null {
  if (!token) return null
  const partes = token.split('.')
  if (partes.length !== 4) return null
  const [emailB64, emitidaStr, expiraStr, firma] = partes
  const carga = `${emailB64}.${emitidaStr}.${expiraStr}`
  if (!firmaValida(`sesion|${carga}`, firma, secreto)) return null
  const emitidaEn = Number(emitidaStr)
  const expira = Number(expiraStr)
  if (!Number.isFinite(emitidaEn) || !Number.isFinite(expira) || ahora > expira) return null
  return { email: Buffer.from(emailB64, 'base64url').toString('utf8'), emitidaEn, expira }
}
