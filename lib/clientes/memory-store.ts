import type { AlmacenBlobs, Almacenes } from './store'

function crearAlmacen(): AlmacenBlobs {
  const json = new Map<string, string>()
  const archivos = new Map<string, { datos: Uint8Array; contentType: string }>()
  return {
    async leerJSON<T>(clave: string) {
      const v = json.get(clave)
      return v === undefined ? null : (JSON.parse(v) as T)
    },
    async escribirJSON(clave, valor) {
      json.set(clave, JSON.stringify(valor))
    },
    async leerArchivo(clave) {
      const v = archivos.get(clave)
      if (!v) return null
      return { datos: v.datos.slice().buffer as ArrayBuffer, contentType: v.contentType }
    },
    async escribirArchivo(clave, datos, contentType) {
      archivos.set(clave, { datos: datos.slice(), contentType })
    },
    async borrar(clave) {
      json.delete(clave)
      archivos.delete(clave)
    },
    async listar(prefijo) {
      return [...json.keys(), ...archivos.keys()].filter((k) => k.startsWith(prefijo)).sort()
    },
  }
}

export function crearAlmacenesEnMemoria(): Almacenes {
  return { artefactos: crearAlmacen(), registro: crearAlmacen(), usuarios: crearAlmacen() }
}
