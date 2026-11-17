import { getStore, type Store } from '@netlify/blobs'

import type { AlmacenBlobs, Almacenes } from './store'
import type { Entorno } from './types'

function adaptar(store: Store): AlmacenBlobs {
  return {
    async leerJSON<T>(clave: string) {
      return ((await store.get(clave, { type: 'json' })) as T | null) ?? null
    },
    async escribirJSON(clave, valor) {
      await store.setJSON(clave, valor)
    },
    async leerArchivo(clave) {
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
 * En runtime (funciones de Netlify) el contexto de Blobs llega solo y pedimos
 * consistencia fuerte para que una revocación se note al instante. Desde la
 * CLI se accede por API con siteID + token, que ya es consistente; ahí no se
 * pasa `consistency` porque exige un `uncachedEdgeURL` que solo existe en
 * runtime.
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
    )
  return {
    artefactos: crear('clientes-artefactos'),
    registro: crear('clientes-registro'),
    usuarios: crear('clientes-usuarios'),
  }
}
