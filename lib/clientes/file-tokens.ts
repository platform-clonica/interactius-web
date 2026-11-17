import { firmaValida, firmar } from './hmac'

export const DURACION_TOKEN_ARCHIVO_MS = 15 * 60 * 1000

/**
 * El iframe del artefacto corre con origen opaco (CSP sandbox) y no envía la
 * cookie en sus subrecursos; por eso los archivos se autorizan con este token
 * en la ruta. Formato: `<expira base36>.<firma>`.
 */
export function crearTokenArchivo(
  id: string,
  version: number,
  ahora: number,
  secreto: string,
): { token: string; expira: number } {
  const expira = ahora + DURACION_TOKEN_ARCHIVO_MS
  const firma = firmar(`archivo|${id}|${version}|${expira}`, secreto)
  return { token: `${expira.toString(36)}.${firma}`, expira }
}

export function verificarTokenArchivo(
  token: string,
  id: string,
  version: number,
  ahora: number,
  secreto: string,
): boolean {
  const partes = token.split('.')
  if (partes.length !== 2) return false
  const expira = parseInt(partes[0], 36)
  if (!Number.isFinite(expira) || ahora > expira) return false
  return firmaValida(`archivo|${id}|${version}|${expira}`, partes[1], secreto)
}
