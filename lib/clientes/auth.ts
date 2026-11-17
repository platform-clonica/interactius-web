import { HASH_FICTICIO, verificarPassword } from './passwords'
import { guardarUsuario, leerUsuario } from './repo'
import type { Almacenes } from './store'
import type { Usuario } from './types'

export const MAX_FALLOS = 5
export const BLOQUEO_MS = 15 * 60 * 1000

export type ResultadoLogin =
  | { ok: true; usuario: Usuario }
  | { ok: false; motivo: 'credenciales' | 'bloqueado' }

export async function autenticar(
  a: Almacenes,
  email: string,
  password: string,
  ahora: number,
): Promise<ResultadoLogin> {
  const usuario = await leerUsuario(a, email)

  if (!usuario || !usuario.hash) {
    // Mismo coste que una verificación real: no revelar si el usuario existe.
    await verificarPassword(password, HASH_FICTICIO)
    return { ok: false, motivo: 'credenciales' }
  }

  if (usuario.bloqueadoHasta && Date.parse(usuario.bloqueadoHasta) > ahora) {
    return { ok: false, motivo: 'bloqueado' }
  }

  if (!(await verificarPassword(password, usuario.hash))) {
    const fallos = usuario.fallos + 1
    const bloquear = fallos >= MAX_FALLOS
    await guardarUsuario(a, {
      ...usuario,
      fallos: bloquear ? 0 : fallos,
      bloqueadoHasta: bloquear ? new Date(ahora + BLOQUEO_MS).toISOString() : null,
    })
    return { ok: false, motivo: bloquear ? 'bloqueado' : 'credenciales' }
  }

  if (usuario.fallos !== 0 || usuario.bloqueadoHasta) {
    await guardarUsuario(a, { ...usuario, fallos: 0, bloqueadoHasta: null })
  }
  return { ok: true, usuario: { ...usuario, fallos: 0, bloqueadoHasta: null } }
}
