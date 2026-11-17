import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { leerDirectorioArtefacto, tipoMime } from '@/lib/clientes/cli-files'

async function raizTemporal() {
  return mkdtemp(join(tmpdir(), 'repo-'))
}

describe('cli-files', () => {
  it('tipos MIME por extensión', () => {
    expect(tipoMime('index.html')).toBe('text/html; charset=utf-8')
    expect(tipoMime('a/b.JS')).toBe('text/javascript; charset=utf-8')
    expect(tipoMime('x.webp')).toBe('image/webp')
    expect(tipoMime('x.raro')).toBe('application/octet-stream')
  })

  it('lee recursivamente, con rutas relativas y sin ocultos', async () => {
    const repo = await raizTemporal()
    const dir = await mkdtemp(join(tmpdir(), 'artefacto-'))
    await writeFile(join(dir, 'index.html'), '<p>hola</p>')
    await mkdir(join(dir, 'css'))
    await writeFile(join(dir, 'css', 'app.css'), 'body{}')
    await writeFile(join(dir, '.DS_Store'), 'x')
    const archivos = await leerDirectorioArtefacto(dir, repo)
    expect(archivos.map((f) => f.ruta).sort()).toEqual(['css/app.css', 'index.html'])
  })

  it('rechaza directorios dentro del repo', async () => {
    const repo = await raizTemporal()
    await expect(leerDirectorioArtefacto(repo, repo)).rejects.toThrow(/dentro del repo/)
  })

  it('rechaza subcarpetas del repo', async () => {
    const repo = await raizTemporal()
    await mkdir(join(repo, 'sub'))
    await expect(leerDirectorioArtefacto(join(repo, 'sub'), repo)).rejects.toThrow(/dentro del repo/)
  })

  it('rechaza carpetas cuyo nombre empieza por ".." dentro del repo', async () => {
    const repo = await raizTemporal()
    await mkdir(join(repo, '..x'))
    await expect(leerDirectorioArtefacto(join(repo, '..x'), repo)).rejects.toThrow(/dentro del repo/)
  })

  it('falla cerrado si la raíz del repo no existe', async () => {
    const repo = await raizTemporal()
    const dir = await mkdtemp(join(tmpdir(), 'artefacto-'))
    await expect(leerDirectorioArtefacto(dir, join(repo, 'no-existe'))).rejects.toThrow(/raíz del repo/)
  })
})
