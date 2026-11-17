import { describe, expect, it } from 'vitest'

import { autenticar } from '@/lib/clientes/auth'
import { crearAlmacenesEnMemoria } from '@/lib/clientes/memory-store'
import { desactivarUsuario, publicar } from '@/lib/clientes/operations'
import { darAccesoPanel } from '@/lib/clientes/panel'
import { leerArtefacto } from '@/lib/clientes/repo'

const T0 = Date.UTC(2026, 10, 20)
const archivo = { ruta: 'index.html', datos: new TextEncoder().encode('<p>x</p>'), contentType: 'text/html' }

async function preparar() {
  const a = crearAlmacenesEnMemoria()
  const art = await publicar(
    a,
    { cliente: 'caixabank', titulo: 'Prueba', origen: 'o', entrada: 'index.html', archivos: [archivo], avisos: [], publicadoPor: 't' },
    T0,
  )
  return { a, art }
}

describe('darAccesoPanel', () => {
  it('crea el usuario y devuelve la contraseña una vez, con el enlace', async () => {
    const { a, art } = await preparar()
    const r = await darAccesoPanel(a, art.id, ' Ana@CaixaBank.com ', T0, 'https://www.interactius.com')
    expect(r).toMatchObject({ ok: true, email: 'ana@caixabank.com', nuevo: true })
    if (!r.ok) throw new Error()
    expect(r.enlace).toBe(`https://www.interactius.com/clientes/caixabank/${art.id}`)
    expect((await autenticar(a, 'ana@caixabank.com', r.password!, T0)).ok).toBe(true)
    expect(Object.keys((await leerArtefacto(a, art.id))!.accesos)).toEqual(['ana@caixabank.com'])
  })

  it('a un usuario existente solo le añade el acceso (sin contraseña)', async () => {
    const { a, art } = await preparar()
    await darAccesoPanel(a, art.id, 'ana@caixabank.com', T0, 'https://x')
    const r = await darAccesoPanel(a, art.id, 'ana@caixabank.com', T0, 'https://x')
    expect(r).toMatchObject({ ok: true, nuevo: false, password: null })
  })

  it('no reactiva usuarios desactivados desde el panel', async () => {
    const { a, art } = await preparar()
    await darAccesoPanel(a, art.id, 'ana@caixabank.com', T0, 'https://x')
    await desactivarUsuario(a, 'ana@caixabank.com', T0 + 1)
    const r = await darAccesoPanel(a, art.id, 'ana@caixabank.com', T0 + 2, 'https://x')
    expect(r).toEqual({ ok: false, mensaje: expect.stringMatching(/desactivad/) })
  })

  it('errores legibles para correo inválido y artefacto inexistente', async () => {
    const { a, art } = await preparar()
    expect(await darAccesoPanel(a, art.id, 'no-es-correo', T0, 'https://x')).toEqual({
      ok: false,
      mensaje: expect.stringMatching(/correo/),
    })
    expect(await darAccesoPanel(a, 'aaaaaaaaaa', 'ana@caixabank.com', T0, 'https://x')).toEqual({
      ok: false,
      mensaje: expect.stringMatching(/no existe/),
    })
  })
})
