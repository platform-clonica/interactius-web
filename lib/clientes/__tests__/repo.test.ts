import { describe, expect, it } from 'vitest'

import { crearAlmacenesEnMemoria } from '@/lib/clientes/memory-store'
import {
  borrarUltimosAccesos,
  claveArchivo,
  guardarArtefacto,
  guardarUsuario,
  leerArtefacto,
  leerUltimoAcceso,
  leerUsuario,
  listarArtefactos,
  listarUsuarios,
  registrarUltimoAcceso,
} from '@/lib/clientes/repo'
import type { Artefacto, Usuario } from '@/lib/clientes/types'

const art = (id: string, cliente: string, publicadoEn: string): Artefacto => ({
  id, cliente, titulo: id, origen: 'https://claude.ai/artifact/x', version: 1,
  publicadoEn, publicadoPor: 'test', entrada: 'index.html', avisos: [], accesos: {},
})

const usuario: Usuario = {
  email: 'ana@cliente.com', hash: 'h', admin: false, creadoEn: 'c',
  credencialesEn: 'c', fallos: 0, bloqueadoHasta: null,
}

describe('repo', () => {
  it('guarda y lee artefactos, ordenados por cliente y fecha desc', async () => {
    const a = crearAlmacenesEnMemoria()
    await guardarArtefacto(a, art('bbbbbbbbbb', 'zara', '2026-01-01'))
    await guardarArtefacto(a, art('aaaaaaaaaa', 'caixabank', '2026-01-01'))
    await guardarArtefacto(a, art('cccccccccc', 'caixabank', '2026-02-01'))
    expect((await leerArtefacto(a, 'aaaaaaaaaa'))?.cliente).toBe('caixabank')
    expect(await leerArtefacto(a, 'nonononono')).toBeNull()
    expect((await listarArtefactos(a)).map((x) => x.id)).toEqual([
      'cccccccccc', 'aaaaaaaaaa', 'bbbbbbbbbb',
    ])
  })

  it('usuarios por email normalizado', async () => {
    const a = crearAlmacenesEnMemoria()
    await guardarUsuario(a, usuario)
    expect((await leerUsuario(a, ' ANA@cliente.com'))?.email).toBe('ana@cliente.com')
    expect(await listarUsuarios(a)).toHaveLength(1)
  })

  it('último acceso separado de la ficha', async () => {
    const a = crearAlmacenesEnMemoria()
    await registrarUltimoAcceso(a, 'aaaaaaaaaa', 'ana@cliente.com', Date.UTC(2026, 0, 2))
    expect(await leerUltimoAcceso(a, 'aaaaaaaaaa', 'ana@cliente.com')).toBe('2026-01-02T00:00:00.000Z')
    await borrarUltimosAccesos(a, 'aaaaaaaaaa')
    expect(await leerUltimoAcceso(a, 'aaaaaaaaaa', 'ana@cliente.com')).toBeNull()
  })

  it('archivos con contentType', async () => {
    const a = crearAlmacenesEnMemoria()
    const clave = claveArchivo('aaaaaaaaaa', 2, 'css/app.css')
    expect(clave).toBe('aaaaaaaaaa/v2/css/app.css')
    await a.artefactos.escribirArchivo(clave, new TextEncoder().encode('body{}'), 'text/css')
    const leido = await a.artefactos.leerArchivo(clave)
    expect(leido?.contentType).toBe('text/css')
    expect(new TextDecoder().decode(leido!.datos)).toBe('body{}')
    expect(await a.artefactos.listar('aaaaaaaaaa/v2/')).toEqual([clave])
  })
})
