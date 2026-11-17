import { readdir, readFile, realpath } from 'node:fs/promises'
import { extname, isAbsolute, join, relative, sep } from 'node:path'

import { ErrorOperacion } from './operations'
import type { ArchivoArtefacto, Entorno } from './types'

export const URL_BASE: Record<Entorno, string> = {
  production: 'https://www.interactius.com',
  staging: 'https://staging.interactius.com',
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
}

export function tipoMime(ruta: string): string {
  return MIME[extname(ruta).toLowerCase()] ?? 'application/octet-stream'
}

/**
 * Lee la carpeta del artefacto. Se niega a leer dentro del repo: los
 * artefactos son confidenciales y no deben acabar en un commit.
 */
export async function leerDirectorioArtefacto(
  dir: string,
  raizRepo: string,
): Promise<ArchivoArtefacto[]> {
  const real = await realpath(dir)
  let repo: string
  try {
    repo = await realpath(raizRepo)
  } catch {
    // Fail closed: sin raíz resuelta no podemos garantizar que la carpeta esté fuera.
    throw new ErrorOperacion(`No se pudo resolver la raíz del repo: ${raizRepo}.`)
  }
  const rel = relative(repo, real)
  const fueraDelRepo = rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)
  if (!fueraDelRepo) {
    throw new ErrorOperacion(
      `La carpeta ${real} está dentro del repo. Copia el artefacto a un directorio temporal fuera del repo (p. ej. el scratchpad).`,
    )
  }

  const archivos: ArchivoArtefacto[] = []
  async function recorrer(actual: string) {
    for (const entrada of await readdir(actual, { withFileTypes: true })) {
      if (entrada.name.startsWith('.')) continue
      const ruta = join(actual, entrada.name)
      if (entrada.isDirectory()) await recorrer(ruta)
      else if (entrada.isFile()) {
        const rutaRel = relative(real, ruta).split(sep).join('/')
        archivos.push({
          ruta: rutaRel,
          datos: new Uint8Array(await readFile(ruta)),
          contentType: tipoMime(rutaRel),
        })
      }
    }
  }
  await recorrer(real)
  return archivos
}
