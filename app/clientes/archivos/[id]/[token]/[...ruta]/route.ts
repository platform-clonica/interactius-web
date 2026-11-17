import { almacenes, secretoSesion } from '@/lib/clientes/config'
import { verificarTokenArchivo } from '@/lib/clientes/file-tokens'
import { CABECERAS_PRIVADAS, CSP_ARTEFACTO, noDisponible, rutaSegura } from '@/lib/clientes/http'
import { ID_ARTEFACTO_RE } from '@/lib/clientes/ids'
import { claveArchivo, leerArtefacto } from '@/lib/clientes/repo'

export const dynamic = 'force-dynamic'

const prohibido = () => new Response('Forbidden', { status: 403, headers: CABECERAS_PRIVADAS })

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; token: string; ruta: string[] }> },
) {
  const { id, token, ruta } = await params
  const rutaArchivo = rutaSegura(ruta)
  if (!ID_ARTEFACTO_RE.test(id) || !rutaArchivo) return prohibido()

  try {
    const secreto = secretoSesion()
    const a = almacenes()
    const art = await leerArtefacto(a, id)
    if (!art || !verificarTokenArchivo(token, id, art.version, Date.now(), secreto)) {
      return prohibido()
    }
    const archivo = await a.artefactos.leerArchivo(claveArchivo(id, art.version, rutaArchivo))
    if (!archivo) return new Response('Not found', { status: 404, headers: CABECERAS_PRIVADAS })
    return new Response(archivo.datos, {
      headers: {
        ...CABECERAS_PRIVADAS,
        'Content-Type': archivo.contentType,
        'Content-Security-Policy': CSP_ARTEFACTO,
        // El documento enmarcado tiene origen opaco: sus scripts de módulo y
        // fuentes piden CORS. La autorización es el token, no la cookie, así
        // que permitir cualquier origen no amplía el acceso.
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e) {
    console.error('[clientes] archivo', e)
    return noDisponible()
  }
}
