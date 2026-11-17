import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { leerDirectorioArtefacto, tipoMime } from '@/lib/clientes/cli-files'

describe('cli-files', () => {
  it('tipos MIME por extensión', () => {
    expect(tipoMime('index.html')).toBe('text/html; charset=utf-8')
    expect(tipoMime('a/b.JS')).toBe('text/javascript; charset=utf-8')
    expect(tipoMime('x.webp')).toBe('image/webp')
    expect(tipoMime('x.raro')).toBe('application/octet-stream')
  })

  it('lee recursivamente, con rutas relativas y sin ocultos', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'artefacto-'))
    await writeFile(join(dir, 'index.html'), '<p>hola</p>')
    await mkdir(join(dir, 'css'))
    await writeFile(join(dir, 'css', 'app.css'), 'body{}')
    await writeFile(join(dir, '.DS_Store'), 'x')
    const archivos = await leerDirectorioArtefacto(dir, '/no/es/el/repo')
    expect(archivos.map((f) => f.ruta).sort()).toEqual(['css/app.css', 'index.html'])
  })

  it('rechaza directorios dentro del repo', async () => {
    await expect(leerDirectorioArtefacto(process.cwd(), process.cwd())).rejects.toThrow(/dentro del repo/)
  })
})
