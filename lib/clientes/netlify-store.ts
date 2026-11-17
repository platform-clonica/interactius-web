import { getStore, type Store } from '@netlify/blobs'

import { leerConConfirmacion } from './lectura'
import type { AlmacenBlobs, Almacenes } from './store'
import type { Entorno } from './types'

/** Tope de la lectura estricta (ver `lectura.ts`). */
const TOPE_LECTURA_ESTRICTA_MS = 3000

function adaptar(store: Store, estricta: boolean): AlmacenBlobs {
  const leer = async <T>(clave: string, consistency?: 'strong') =>
    ((await store.get(clave, { type: 'json', ...(consistency ? { consistency } : {}) })) as T | null) ?? null
  return {
    async leerJSON<T>(clave: string) {
      if (!estricta) return leer<T>(clave)
      return leerConConfirmacion(
        () => leer<T>(clave),
        () => leer<T>(clave, 'strong'),
        TOPE_LECTURA_ESTRICTA_MS,
      )
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
 * En runtime (funciones de Netlify) el contexto de Blobs llega solo. Las
 * fichas y usuarios se leen en dos pasos (`lectura.ts`): normal y, si existen,
 * estricta, para que una revocación se note al instante sin colgarse con
 * claves inexistentes. Archivos y listados usan la lectura normal (los
 * archivos de una versión no cambian). Desde la CLI se accede por API con
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
        : getStore({ name: `${base}-${entorno}` }),
      !porApi,
    )
  return {
    artefactos: crear('clientes-artefactos'),
    registro: crear('clientes-registro'),
    usuarios: crear('clientes-usuarios'),
  }
}
