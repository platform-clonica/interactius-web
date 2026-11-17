/* ==========================================================================
   Zona privada de clientes — tipos compartidos
   --------------------------------------------------------------------------
   Ver docs/superpowers/specs/2026-11-17-zona-privada-clientes-design.md.
   Estos datos viven en Netlify Blobs, nunca en el repo.
   ========================================================================== */

export type Entorno = 'production' | 'staging'

export interface Acceso {
  concedidoEn: string
}

export interface Artefacto {
  id: string
  cliente: string
  titulo: string
  /** URL del artefacto original en claude.ai. */
  origen: string
  version: number
  publicadoEn: string
  publicadoPor: string
  /** Ruta del HTML de entrada dentro del artefacto, p. ej. `index.html`. */
  entrada: string
  avisos: string[]
  /** Clave: email normalizado. */
  accesos: Record<string, Acceso>
}

export interface Usuario {
  email: string
  /** `null` = desactivado: no puede entrar en nada. */
  hash: string | null
  admin: boolean
  creadoEn: string
  /** Las sesiones emitidas antes de esta fecha no valen. */
  credencialesEn: string
  fallos: number
  bloqueadoHasta: string | null
}

export interface ArchivoArtefacto {
  ruta: string
  datos: Uint8Array
  contentType: string
}
