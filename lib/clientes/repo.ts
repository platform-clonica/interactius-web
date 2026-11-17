import { normalizarEmail } from './ids'
import type { Almacenes } from './store'
import type { Artefacto, Usuario } from './types'

const PREFIJO_ARTEFACTOS = 'artefactos/'
const PREFIJO_USUARIOS = 'usuarios/'
const PREFIJO_ULTIMOS = 'ultimos-accesos/'

export const claveArchivo = (id: string, version: number, ruta: string) =>
  `${id}/v${version}/${ruta}`

export async function leerArtefacto(a: Almacenes, id: string) {
  return a.registro.leerJSON<Artefacto>(`${PREFIJO_ARTEFACTOS}${id}`)
}

export async function guardarArtefacto(a: Almacenes, art: Artefacto) {
  await a.registro.escribirJSON(`${PREFIJO_ARTEFACTOS}${art.id}`, art)
}

export async function borrarFichaArtefacto(a: Almacenes, id: string) {
  await a.registro.borrar(`${PREFIJO_ARTEFACTOS}${id}`)
}

/** Por cliente (A→Z) y, dentro, el más reciente primero. */
export async function listarArtefactos(a: Almacenes): Promise<Artefacto[]> {
  const claves = await a.registro.listar(PREFIJO_ARTEFACTOS)
  const fichas = await Promise.all(claves.map((k) => a.registro.leerJSON<Artefacto>(k)))
  return fichas
    .filter((f): f is Artefacto => f !== null)
    .sort(
      (x, y) =>
        x.cliente.localeCompare(y.cliente) || y.publicadoEn.localeCompare(x.publicadoEn),
    )
}

export async function leerUsuario(a: Almacenes, email: string) {
  return a.usuarios.leerJSON<Usuario>(`${PREFIJO_USUARIOS}${normalizarEmail(email)}`)
}

export async function guardarUsuario(a: Almacenes, u: Usuario) {
  await a.usuarios.escribirJSON(`${PREFIJO_USUARIOS}${normalizarEmail(u.email)}`, u)
}

export async function listarUsuarios(a: Almacenes): Promise<Usuario[]> {
  const claves = await a.usuarios.listar(PREFIJO_USUARIOS)
  const usuarios = await Promise.all(claves.map((k) => a.usuarios.leerJSON<Usuario>(k)))
  return usuarios
    .filter((u): u is Usuario => u !== null)
    .sort((x, y) => x.email.localeCompare(y.email))
}

export async function registrarUltimoAcceso(
  a: Almacenes,
  id: string,
  email: string,
  ahora: number,
) {
  await a.registro.escribirJSON(`${PREFIJO_ULTIMOS}${id}/${normalizarEmail(email)}`, {
    en: new Date(ahora).toISOString(),
  })
}

export async function leerUltimoAcceso(a: Almacenes, id: string, email: string) {
  const v = await a.registro.leerJSON<{ en: string }>(
    `${PREFIJO_ULTIMOS}${id}/${normalizarEmail(email)}`,
  )
  return v?.en ?? null
}

export async function borrarUltimosAccesos(a: Almacenes, id: string) {
  const claves = await a.registro.listar(`${PREFIJO_ULTIMOS}${id}/`)
  await Promise.all(claves.map((k) => a.registro.borrar(k)))
}
