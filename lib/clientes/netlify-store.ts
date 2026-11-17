import { getStore, type Store } from '@netlify/blobs'

import { leerConConfirmacion } from './lectura'
import type { AlmacenBlobs, Almacenes } from './store'
import type { Entorno } from './types'

/** Tope de la lectura estricta (ver `lectura.ts`). */
const TOPE_LECTURA_ESTRICTA_MS = 3000

function adaptar(store: Store, enRuntime: boolean): AlmacenBlobs {
  const leer = async <T>(clave: string) => ((await store.get(clave, { type: 'json' })) as T | null) ?? null
  /** Existencia por listado: en runtime, leer una clave inexistente se cuelga.
   *  En runtime el store es `strong`, así que el listado ve al momento lo
   *  recién escrito (un usuario creado hace un segundo puede entrar). */
  const existe = async (clave: string) =>
    (await store.list({ prefix: clave })).blobs.some((b) => b.key === clave)
  return {
    async leerJSON<T>(clave: string) {
      if (!enRuntime) return leer<T>(clave)
      return leerConConfirmacion(() => existe(clave), () => leer<T>(clave), TOPE_LECTURA_ESTRICTA_MS)
    },
    async escribirJSON(clave, valor) {
      await store.setJSON(clave, valor)
    },
    async leerArchivo(clave) {
      if (enRuntime && !(await existe(clave))) return null
      const r = await store.getWithMetadata(clave, { type: 'arrayBuffer' })
      if (!r) return null
      const contentType =
        typeof r.metadata.contentType === 'string'
          ? r.metadata.contentType
          : 'application/octet-stream'
      return { datos: r.data, contentType }
    },
    async escribirArchivo(clave, datos, contentType) {
      await store.set(clave, datos.slice().buffer as ArrayBuffer, { metadata: { contentType } })
    },
    async borrar(clave) {
      await store.delete(clave)
    },
    async listar(prefijo) {
      const { blobs } = await store.list({ prefix: prefijo })
      return blobs.map((b) => b.key).sort()
    },
  }
}

export interface OpcionesNetlify {
  /** Solo fuera de Netlify (CLI): ID del sitio y token personal. */
  siteID?: string
  token?: string
}

/**
 * En runtime (funciones de Netlify) el contexto de Blobs llega solo. Antes
 * de leer cualquier clave se comprueba que existe con un listado (leer una
 * clave inexistente se cuelga, ver `lectura.ts`); fichas y usuarios se leen
 * después en modo estricto, para que una revocación se note al instante. Desde la CLI se accede por API con
 * siteID + token, que ya es consistente; ahí no se pide lectura estricta
 * porque exige un `uncachedEdgeURL` que solo existe en runtime.
 */
export function crearAlmacenesNetlify(
  entorno: Entorno,
  opciones: OpcionesNetlify = {},
): Almacenes {
  const porApi = Boolean(opciones.siteID && opciones.token)
  const crear = (base: string) =>
    adaptar(
      porApi
        ? getStore({ name: `${base}-${entorno}`, siteID: opciones.siteID!, token: opciones.token! })
        : getStore({ name: `${base}-${entorno}`, consistency: 'strong' }),
      !porApi,
    )
  return {
    artefactos: crear('clientes-artefactos'),
    registro: crear('clientes-registro'),
    usuarios: crear('clientes-usuarios'),
  }
}
