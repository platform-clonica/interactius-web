/**
 * Almacenamiento clave-valor mínimo que necesita la zona de clientes. En
 * producción lo implementa Netlify Blobs (`netlify-store.ts`); en los tests,
 * un Map (`memory-store.ts`).
 */
export interface AlmacenBlobs {
  leerJSON<T>(clave: string): Promise<T | null>
  escribirJSON(clave: string, valor: unknown): Promise<void>
  leerArchivo(clave: string): Promise<{ datos: ArrayBuffer; contentType: string } | null>
  escribirArchivo(clave: string, datos: Uint8Array, contentType: string): Promise<void>
  borrar(clave: string): Promise<void>
  listar(prefijo: string): Promise<string[]>
}

export interface Almacenes {
  /** Archivos de los artefactos: `<id>/v<version>/<ruta>`. */
  artefactos: AlmacenBlobs
  /** Fichas (`artefactos/<id>`) y últimos accesos (`ultimos-accesos/<id>/<email>`). */
  registro: AlmacenBlobs
  /** Cuentas: `usuarios/<email>`. */
  usuarios: AlmacenBlobs
}
