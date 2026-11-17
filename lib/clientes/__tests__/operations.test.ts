import { describe, expect, it } from 'vitest'

import { autenticar } from '@/lib/clientes/auth'
import { crearAlmacenesEnMemoria } from '@/lib/clientes/memory-store'
import {
  ErrorOperacion,
  borrarArtefacto,
  crearAdmin,
  darAcceso,
  desactivarUsuario,
  detectarAvisos,
  publicar,
  quitarAcceso,
  regenerarPassword,
  republicar,
  resumenAdmin,
} from '@/lib/clientes/operations'
import { claveArchivo, leerArtefacto, leerUsuario } from '@/lib/clientes/repo'
import type { ArchivoArtefacto } from '@/lib/clientes/types'

const T0 = Date.UTC(2026, 10, 20)
const html = (s: string): ArchivoArtefacto => ({
  ruta: 'index.html', datos: new TextEncoder().encode(s), contentType: 'text/html; charset=utf-8',
})
const datosBase = {
  cliente: 'caixabank', titulo: 'PoC', origen: 'https://claude.ai/artifact/x',
  entrada: 'index.html', avisos: [], publicadoPor: 'test',
}

describe('detectarAvisos', () => {
  it('avisa si el artefacto usa window.claude', () => {
    expect(detectarAvisos([html('<script>window.claude.ask()</script>')])).toHaveLength(1)
    expect(detectarAvisos([html('<p>hola</p>')])).toEqual([])
  })
})

describe('publicar y republicar', () => {
  it('publica v1 con id aleatorio', async () => {
    const a = crearAlmacenesEnMemoria()
    const art = await publicar(a, { ...datosBase, archivos: [html('v1')] }, T0)
    expect(art.version).toBe(1)
    expect(art.id).toMatch(/^[a-z2-9]{10}$/)
    expect(await a.artefactos.leerArchivo(claveArchivo(art.id, 1, 'index.html'))).not.toBeNull()
  })

  it('rechaza cliente reservado y entrada inexistente', async () => {
    const a = crearAlmacenesEnMemoria()
    await expect(publicar(a, { ...datosBase, cliente: 'admin', archivos: [html('x')] }, T0)).rejects.toThrow(ErrorOperacion)
    await expect(publicar(a, { ...datosBase, entrada: 'otra.html', archivos: [html('x')] }, T0)).rejects.toThrow(/entrada/)
  })

  it('republica: sube versión, conserva accesos y borra la anterior', async () => {
    const a = crearAlmacenesEnMemoria()
    const art = await publicar(a, { ...datosBase, archivos: [html('v1')] }, T0)
    await darAcceso(a, art.id, 'ana@cliente.com', T0)
    const v2 = await republicar(a, art.id, { archivos: [html('v2')], avisos: [], publicadoPor: 'test' }, T0 + 1)
    expect(v2.version).toBe(2)
    expect(Object.keys(v2.accesos)).toEqual(['ana@cliente.com'])
    expect(await a.artefactos.leerArchivo(claveArchivo(art.id, 1, 'index.html'))).toBeNull()
    expect(await a.artefactos.leerArchivo(claveArchivo(art.id, 2, 'index.html'))).not.toBeNull()
  })
})

describe('accesos', () => {
  it('crea el usuario la primera vez y solo entonces devuelve contraseña', async () => {
    const a = crearAlmacenesEnMemoria()
    const art = await publicar(a, { ...datosBase, archivos: [html('x')] }, T0)
    const otro = await publicar(a, { ...datosBase, archivos: [html('y')] }, T0)
    const r1 = await darAcceso(a, art.id, ' Ana@Cliente.com', T0)
    expect(r1.email).toBe('ana@cliente.com')
    expect(r1.password).toMatch(/^[a-z2-9-]{19}$/)
    expect((await autenticar(a, 'ana@cliente.com', r1.password!, T0)).ok).toBe(true)
    const r2 = await darAcceso(a, otro.id, 'ana@cliente.com', T0)
    expect(r2.password).toBeNull()
  })

  it('quitar acceso afecta solo a ese artefacto', async () => {
    const a = crearAlmacenesEnMemoria()
    const x = await publicar(a, { ...datosBase, archivos: [html('x')] }, T0)
    const y = await publicar(a, { ...datosBase, archivos: [html('y')] }, T0)
    await darAcceso(a, x.id, 'ana@cliente.com', T0)
    await darAcceso(a, y.id, 'ana@cliente.com', T0)
    expect(await quitarAcceso(a, x.id, 'ana@cliente.com')).toBe(true)
    expect((await leerArtefacto(a, x.id))?.accesos).toEqual({})
    expect(Object.keys((await leerArtefacto(a, y.id))!.accesos)).toEqual(['ana@cliente.com'])
    expect(await quitarAcceso(a, x.id, 'ana@cliente.com')).toBe(false)
  })

  it('rechaza emails inválidos y artefactos inexistentes', async () => {
    const a = crearAlmacenesEnMemoria()
    const x = await publicar(a, { ...datosBase, archivos: [html('x')] }, T0)
    await expect(darAcceso(a, x.id, 'no-es-email', T0)).rejects.toThrow(ErrorOperacion)
    await expect(darAcceso(a, 'nonononono', 'ana@cliente.com', T0)).rejects.toThrow(/no existe/)
  })
})

describe('usuarios', () => {
  it('regenerar invalida la contraseña anterior y actualiza credencialesEn', async () => {
    const a = crearAlmacenesEnMemoria()
    const x = await publicar(a, { ...datosBase, archivos: [html('x')] }, T0)
    const { password } = await darAcceso(a, x.id, 'ana@cliente.com', T0)
    const { password: nueva } = await regenerarPassword(a, 'ana@cliente.com', T0 + 5)
    expect((await autenticar(a, 'ana@cliente.com', password!, T0 + 6)).ok).toBe(false)
    expect((await autenticar(a, 'ana@cliente.com', nueva, T0 + 6)).ok).toBe(true)
    expect((await leerUsuario(a, 'ana@cliente.com'))?.credencialesEn).toBe(new Date(T0 + 5).toISOString())
  })

  it('desactivar impide entrar y dar acceso no reactiva sin --reactivar', async () => {
    const a = crearAlmacenesEnMemoria()
    const x = await publicar(a, { ...datosBase, archivos: [html('x')] }, T0)
    const { password } = await darAcceso(a, x.id, 'ana@cliente.com', T0)
    await desactivarUsuario(a, 'ana@cliente.com', T0 + 1)
    expect((await leerUsuario(a, 'ana@cliente.com'))?.hash).toBeNull()
    expect((await autenticar(a, 'ana@cliente.com', password!, T0 + 2)).ok).toBe(false)
    await expect(darAcceso(a, x.id, 'ana@cliente.com', T0 + 2)).rejects.toThrow(/desactivado/)
    expect((await leerUsuario(a, 'ana@cliente.com'))?.hash).toBeNull()
  })

  it('darAcceso con reactivar devuelve contraseña y los artefactos que recupera', async () => {
    const a = crearAlmacenesEnMemoria()
    const x = await publicar(a, { ...datosBase, titulo: 'Primero', archivos: [html('x')] }, T0)
    const y = await publicar(a, { ...datosBase, titulo: 'Segundo', archivos: [html('y')] }, T0)
    await darAcceso(a, x.id, 'ana@cliente.com', T0)
    await desactivarUsuario(a, 'ana@cliente.com', T0 + 1)
    const r = await darAcceso(a, y.id, 'ana@cliente.com', T0 + 2, { reactivar: true })
    expect(r.password).not.toBeNull()
    expect([...r.reactivados].sort()).toEqual(['Primero', 'Segundo'])
    expect((await autenticar(a, 'ana@cliente.com', r.password!, T0 + 3)).ok).toBe(true)
  })

  it('darAcceso a usuario activo no marca reactivados', async () => {
    const a = crearAlmacenesEnMemoria()
    const x = await publicar(a, { ...datosBase, archivos: [html('x')] }, T0)
    const r = await darAcceso(a, x.id, 'ana@cliente.com', T0)
    expect(r.reactivados).toEqual([])
  })

  it('regenerarPassword de un desactivado exige reactivar', async () => {
    const a = crearAlmacenesEnMemoria()
    const x = await publicar(a, { ...datosBase, archivos: [html('x')] }, T0)
    await darAcceso(a, x.id, 'ana@cliente.com', T0)
    await desactivarUsuario(a, 'ana@cliente.com', T0 + 1)
    await expect(regenerarPassword(a, 'ana@cliente.com', T0 + 2)).rejects.toThrow(/desactivado/)
    const r = await regenerarPassword(a, 'ana@cliente.com', T0 + 3, { reactivar: true })
    expect(r.reactivados).toEqual(['PoC'])
    expect((await autenticar(a, 'ana@cliente.com', r.password, T0 + 4)).ok).toBe(true)
  })

  it('admin solo con correo de Interactius', async () => {
    const a = crearAlmacenesEnMemoria()
    await expect(crearAdmin(a, 'ana@cliente.com', T0)).rejects.toThrow(/interactius/)
    const pw = await crearAdmin(a, 'Equipo@Interactius.com', T0)
    expect((await leerUsuario(a, 'equipo@interactius.com'))?.admin).toBe(true)
    expect((await autenticar(a, 'equipo@interactius.com', pw, T0)).ok).toBe(true)
  })
})

describe('borrar y resumen', () => {
  it('borra archivos, ficha y últimos accesos; el resumen lista personas', async () => {
    const a = crearAlmacenesEnMemoria()
    const x = await publicar(a, { ...datosBase, archivos: [html('x')] }, T0)
    await darAcceso(a, x.id, 'ana@cliente.com', T0)
    const r = await resumenAdmin(a)
    expect(r.artefactos[0].personas).toEqual([
      { email: 'ana@cliente.com', concedidoEn: new Date(T0).toISOString(), ultimoAcceso: null, activo: true },
    ])
    expect(r.usuarios.map((u) => u.email)).toEqual(['ana@cliente.com'])
    expect(r.usuarios[0]).not.toHaveProperty('hash')
    await borrarArtefacto(a, x.id)
    expect(await leerArtefacto(a, x.id)).toBeNull()
    expect(await a.artefactos.listar(`${x.id}/`)).toEqual([])
  })
})
