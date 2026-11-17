import { leerUsuario, registrarUltimoAcceso } from './repo'
import { leerTokenSesion } from './session'
import type { Almacenes } from './store'
import type { Artefacto, Usuario } from './types'

/**
 * Se llama en CADA petición: además de la firma, comprueba que el usuario
 * sigue existiendo, activo, y que la sesión es posterior a su última
 * regeneración de contraseña. Así revocar o regenerar surte efecto al momento.
 */
export async function usuarioDeSesion(
  a: Almacenes,
  token: string | undefined,
  ahora: number,
  secreto: string,
): Promise<Usuario | null> {
  const sesion = leerTokenSesion(token, ahora, secreto)
  if (!sesion) return null
  const usuario = await leerUsuario(a, sesion.email)
  if (!usuario || !usuario.hash) return null
  if (sesion.emitidaEn < Date.parse(usuario.credencialesEn)) return null
  return usuario
}

/** Los admin de Interactius pueden revisar cualquier artefacto. */
export function puedeVer(usuario: Usuario, artefacto: Artefacto): boolean {
  return usuario.admin || Object.hasOwn(artefacto.accesos, usuario.email)
}

export async function registrarAcceso(
  a: Almacenes,
  id: string,
  email: string,
  ahora: number,
): Promise<void> {
  await registrarUltimoAcceso(a, id, email, ahora)
}
