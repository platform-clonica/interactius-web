/**
 * Protección CSRF: el POST debe venir de una página de nuestro mismo host.
 *
 * Si hay un Origin real, manda: debe coincidir con el host. Si el navegador lo
 * envía como "null" (p. ej. Chrome con Referrer-Policy no-referrer) o no lo
 * envía, se acepta solo con `Sec-Fetch-Site: same-origin`, que el navegador
 * fija y una página no puede falsificar. Un iframe sandbox (origen opaco) u
 * otra web llegan como cross-site y se rechazan.
 */
export function origenValido(req: Request): boolean {
  const origin = req.headers.get('origin')
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (!host) return false
  if (!origin || origin === 'null') {
    return req.headers.get('sec-fetch-site') === 'same-origin'
  }
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

const DESTINO_RE = /^\/clientes\/(admin|[a-z0-9]+(?:-[a-z0-9]+)*\/[abcdefghijkmnpqrstuvwxyz23456789]{10})$/

/** Evita redirecciones abiertas tras el login: solo rutas de la zona. */
export function destinoSeguro(next: string): string {
  return DESTINO_RE.test(next) ? next : '/clientes/admin'
}

/** Ruta de archivo a partir de los segmentos de la URL, sin `..` ni vacíos. */
export function rutaSegura(segmentos: string[]): string | null {
  if (!segmentos.length) return null
  const partes: string[] = []
  for (const s of segmentos) {
    let d: string
    try {
      d = decodeURIComponent(s)
    } catch {
      return null
    }
    if (!d || d === '.' || d === '..' || d.includes('/') || d.includes('\\')) return null
    partes.push(d)
  }
  return partes.join('/')
}

/**
 * Sin `allow-same-origin`: el artefacto corre con origen opaco y no puede
 * leer la sesión ni actuar como interactius.com. Solo enmarcable por nosotros.
 */
export const CSP_ARTEFACTO =
  "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-downloads; frame-ancestors 'self'"

export const CABECERAS_PRIVADAS: Record<string, string> = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
}

export function noDisponible(): Response {
  return new Response('Servicio no disponible.', { status: 503, headers: CABECERAS_PRIVADAS })
}
