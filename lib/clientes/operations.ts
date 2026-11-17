/* ==========================================================================
   Operaciones de gestión de la zona de clientes
   --------------------------------------------------------------------------
   Las usan la CLI (`scripts/clientes.ts`) y las acciones de la vista admin.
   No dependen de Next ni de Netlify: reciben los `Almacenes` por parámetro.
   ========================================================================== */

import {
  esEmailInteractius,
  esEmailValido,
  idAleatorio,
  normalizarEmail,
  validarSlugCliente,
} from './ids'
import { generarPassword, hashPassword } from './passwords'
import {
  borrarFichaArtefacto,
  borrarUltimosAccesos,
  claveArchivo,
  guardarArtefacto,
  guardarUsuario,
  leerArtefacto,
  leerUltimoAcceso,
  leerUsuario,
  listarArtefactos,
  listarUsuarios,
} from './repo'
import type { Almacenes } from './store'
import type { ArchivoArtefacto, Artefacto, Usuario } from './types'

export class ErrorOperacion extends Error {}

const iso = (ms: number) => new Date(ms).toISOString()

const EXTENSIONES_TEXTO = /\.(html?|m?js|css|svg|json|txt)$/i

/** Señales de que el artefacto usa funciones que solo existen en claude.ai. */
export function detectarAvisos(archivos: ArchivoArtefacto[]): string[] {
  const avisos = new Set<string>()
  const decoder = new TextDecoder()
  for (const f of archivos) {
    if (!EXTENSIONES_TEXTO.test(f.ruta)) continue
    if (/window\.claude\b/.test(decoder.decode(f.datos))) {
      avisos.add(
        'Usa funciones de Claude (window.claude): esas partes no funcionarán fuera de claude.ai.',
      )
    }
  }
  return [...avisos]
}

async function exigirArtefacto(a: Almacenes, id: string): Promise<Artefacto> {
  const art = await leerArtefacto(a, id)
  if (!art) throw new ErrorOperacion(`El artefacto ${id} no existe.`)
  return art
}

function exigirEmail(email: string): string {
  const e = normalizarEmail(email)
  if (!esEmailValido(e)) throw new ErrorOperacion(`"${email}" no es un correo válido.`)
  return e
}

function exigirEntrada(archivos: ArchivoArtefacto[], entrada: string) {
  if (!archivos.some((f) => f.ruta === entrada)) {
    throw new ErrorOperacion(`No hay ningún archivo de entrada "${entrada}" en el artefacto.`)
  }
}

function comprobarRutas(archivos: ArchivoArtefacto[]) {
  for (const f of archivos) {
    if (f.ruta.startsWith('/') || f.ruta.split('/').some((s) => s === '..' || s === '')) {
      throw new ErrorOperacion(`Ruta de archivo no válida: "${f.ruta}".`)
    }
  }
}

async function subirArchivos(a: Almacenes, id: string, version: number, archivos: ArchivoArtefacto[]) {
  await Promise.all(
    archivos.map((f) =>
      a.artefactos.escribirArchivo(claveArchivo(id, version, f.ruta), f.datos, f.contentType),
    ),
  )
}

async function borrarVersion(a: Almacenes, id: string, version: number) {
  const claves = await a.artefactos.listar(`${id}/v${version}/`)
  await Promise.all(claves.map((k) => a.artefactos.borrar(k)))
}

export async function publicar(
  a: Almacenes,
  datos: {
    cliente: string
    titulo: string
    origen: string
    entrada: string
    archivos: ArchivoArtefacto[]
    avisos: string[]
    publicadoPor: string
  },
  ahora: number,
): Promise<Artefacto> {
  const errorSlug = validarSlugCliente(datos.cliente)
  if (errorSlug) throw new ErrorOperacion(errorSlug)
  if (!datos.titulo.trim()) throw new ErrorOperacion('Falta el título.')
  comprobarRutas(datos.archivos)
  exigirEntrada(datos.archivos, datos.entrada)

  let id = idAleatorio(10)
  while (await leerArtefacto(a, id)) id = idAleatorio(10)

  await subirArchivos(a, id, 1, datos.archivos)
  const art: Artefacto = {
    id,
    cliente: datos.cliente,
    titulo: datos.titulo.trim(),
    origen: datos.origen,
    version: 1,
    publicadoEn: iso(ahora),
    publicadoPor: datos.publicadoPor,
    entrada: datos.entrada,
    avisos: datos.avisos,
    accesos: {},
  }
  await guardarArtefacto(a, art)
  return art
}

/** Sube la versión nueva, apunta la ficha a ella y solo entonces borra la anterior. */
export async function republicar(
  a: Almacenes,
  id: string,
  datos: { archivos: ArchivoArtefacto[]; avisos: string[]; entrada?: string; publicadoPor: string },
  ahora: number,
): Promise<Artefacto> {
  const art = await exigirArtefacto(a, id)
  const entrada = datos.entrada ?? art.entrada
  comprobarRutas(datos.archivos)
  exigirEntrada(datos.archivos, entrada)
  const anterior = art.version
  const nueva = anterior + 1
  await subirArchivos(a, id, nueva, datos.archivos)
  const actualizado: Artefacto = {
    ...art,
    version: nueva,
    entrada,
    avisos: datos.avisos,
    publicadoEn: iso(ahora),
    publicadoPor: datos.publicadoPor,
  }
  await guardarArtefacto(a, actualizado)
  await borrarVersion(a, id, anterior)
  return actualizado
}

async function nuevasCredenciales(
  base: Omit<Usuario, 'hash' | 'credencialesEn' | 'fallos' | 'bloqueadoHasta'>,
  ahora: number,
): Promise<{ usuario: Usuario; password: string }> {
  const password = generarPassword()
  return {
    password,
    usuario: {
      ...base,
      hash: await hashPassword(password),
      credencialesEn: iso(ahora),
      fallos: 0,
      bloqueadoHasta: null,
    },
  }
}

/** Crea o reactiva al usuario si hace falta; solo entonces devuelve contraseña. */
export async function darAcceso(
  a: Almacenes,
  id: string,
  email: string,
  ahora: number,
): Promise<{ artefacto: Artefacto; email: string; password: string | null }> {
  const e = exigirEmail(email)
  const art = await exigirArtefacto(a, id)

  let password: string | null = null
  const existente = await leerUsuario(a, e)
  if (!existente || !existente.hash) {
    const r = await nuevasCredenciales(
      { email: e, admin: existente?.admin ?? false, creadoEn: existente?.creadoEn ?? iso(ahora) },
      ahora,
    )
    await guardarUsuario(a, r.usuario)
    password = r.password
  }

  const actualizado: Artefacto = {
    ...art,
    accesos: { ...art.accesos, [e]: art.accesos[e] ?? { concedidoEn: iso(ahora) } },
  }
  await guardarArtefacto(a, actualizado)
  return { artefacto: actualizado, email: e, password }
}

export async function quitarAcceso(a: Almacenes, id: string, email: string): Promise<boolean> {
  const e = normalizarEmail(email)
  const art = await exigirArtefacto(a, id)
  if (!Object.hasOwn(art.accesos, e)) return false
  const { [e]: _quitado, ...resto } = art.accesos
  await guardarArtefacto(a, { ...art, accesos: resto })
  return true
}

export async function regenerarPassword(a: Almacenes, email: string, ahora: number): Promise<string> {
  const existente = await leerUsuario(a, email)
  if (!existente) throw new ErrorOperacion(`No existe el usuario ${normalizarEmail(email)}.`)
  const r = await nuevasCredenciales(
    { email: existente.email, admin: existente.admin, creadoEn: existente.creadoEn },
    ahora,
  )
  await guardarUsuario(a, r.usuario)
  return r.password
}

export async function crearAdmin(a: Almacenes, email: string, ahora: number): Promise<string> {
  const e = exigirEmail(email)
  if (!esEmailInteractius(e)) {
    throw new ErrorOperacion('Solo se pueden crear admins con correos @interactius.com.')
  }
  const existente = await leerUsuario(a, e)
  const r = await nuevasCredenciales(
    { email: e, admin: true, creadoEn: existente?.creadoEn ?? iso(ahora) },
    ahora,
  )
  await guardarUsuario(a, r.usuario)
  return r.password
}

export async function desactivarUsuario(a: Almacenes, email: string, ahora: number): Promise<void> {
  const existente = await leerUsuario(a, email)
  if (!existente) throw new ErrorOperacion(`No existe el usuario ${normalizarEmail(email)}.`)
  await guardarUsuario(a, { ...existente, hash: null, credencialesEn: iso(ahora) })
}

export async function borrarArtefacto(a: Almacenes, id: string): Promise<void> {
  await exigirArtefacto(a, id)
  const claves = await a.artefactos.listar(`${id}/`)
  await Promise.all(claves.map((k) => a.artefactos.borrar(k)))
  await borrarUltimosAccesos(a, id)
  await borrarFichaArtefacto(a, id)
}

export interface PersonaConAcceso {
  email: string
  concedidoEn: string
  ultimoAcceso: string | null
  activo: boolean
}

export interface FilaAdmin {
  artefacto: Artefacto
  personas: PersonaConAcceso[]
}

export type UsuarioPublico = Omit<Usuario, 'hash'> & { activo: boolean }

export async function resumenAdmin(
  a: Almacenes,
): Promise<{ artefactos: FilaAdmin[]; usuarios: UsuarioPublico[] }> {
  const [artefactos, usuarios] = await Promise.all([listarArtefactos(a), listarUsuarios(a)])
  const activos = new Map(usuarios.map((u) => [u.email, u.hash !== null]))
  const filas = await Promise.all(
    artefactos.map(async (artefacto) => ({
      artefacto,
      personas: await Promise.all(
        Object.entries(artefacto.accesos)
          .sort(([x], [y]) => x.localeCompare(y))
          .map(async ([email, acceso]) => ({
            email,
            concedidoEn: acceso.concedidoEn,
            ultimoAcceso: await leerUltimoAcceso(a, artefacto.id, email),
            activo: activos.get(email) ?? false,
          })),
      ),
    })),
  )
  return {
    artefactos: filas,
    usuarios: usuarios.map(({ hash, ...resto }) => ({ ...resto, activo: hash !== null })),
  }
}
