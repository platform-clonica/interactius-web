import { describe, expect, it } from 'vitest'

import { BLOQUEO_MS, MAX_FALLOS, autenticar } from '@/lib/clientes/auth'
import { crearAlmacenesEnMemoria } from '@/lib/clientes/memory-store'
import { hashPassword } from '@/lib/clientes/passwords'
import { guardarUsuario, leerUsuario } from '@/lib/clientes/repo'

const T0 = Date.UTC(2026, 10, 20)

async function conUsuario(hash: string | null = null) {
  const a = crearAlmacenesEnMemoria()
  await guardarUsuario(a, {
    email: 'ana@cliente.com',
    hash: hash ?? (await hashPassword('aaaa-bbbb-cccc-dddd')),
    admin: false, creadoEn: 'c', credencialesEn: new Date(T0).toISOString(),
    fallos: 0, bloqueadoHasta: null,
  })
  return a
}

describe('autenticar', () => {
  it('acepta credenciales correctas', async () => {
    const a = await conUsuario()
    const r = await autenticar(a, 'ANA@cliente.com', 'aaaa-bbbb-cccc-dddd', T0)
    expect(r.ok).toBe(true)
  })

  it('usuario inexistente y contraseña mala dan el mismo motivo', async () => {
    const a = await conUsuario()
    expect(await autenticar(a, 'nadie@x.com', 'x', T0)).toEqual({ ok: false, motivo: 'credenciales' })
    expect(await autenticar(a, 'ana@cliente.com', 'x', T0)).toEqual({ ok: false, motivo: 'credenciales' })
  })

  it(`bloquea tras ${MAX_FALLOS} fallos y desbloquea a los 15 min`, async () => {
    const a = await conUsuario()
    for (let i = 1; i < MAX_FALLOS; i++) {
      expect((await autenticar(a, 'ana@cliente.com', 'x', T0)).ok).toBe(false)
    }
    expect(await autenticar(a, 'ana@cliente.com', 'x', T0)).toEqual({ ok: false, motivo: 'bloqueado' })
    // Ni la contraseña buena entra mientras dura el bloqueo.
    expect(await autenticar(a, 'ana@cliente.com', 'aaaa-bbbb-cccc-dddd', T0 + 1000)).toEqual({ ok: false, motivo: 'bloqueado' })
    expect((await autenticar(a, 'ana@cliente.com', 'aaaa-bbbb-cccc-dddd', T0 + BLOQUEO_MS + 1)).ok).toBe(true)
    expect((await leerUsuario(a, 'ana@cliente.com'))?.bloqueadoHasta).toBeNull()
  })

  it('un login correcto pone el contador a cero', async () => {
    const a = await conUsuario()
    await autenticar(a, 'ana@cliente.com', 'x', T0)
    await autenticar(a, 'ana@cliente.com', 'aaaa-bbbb-cccc-dddd', T0)
    expect((await leerUsuario(a, 'ana@cliente.com'))?.fallos).toBe(0)
  })

  it('un usuario desactivado no entra', async () => {
    const a = crearAlmacenesEnMemoria()
    await guardarUsuario(a, {
      email: 'ana@cliente.com', hash: null, admin: false, creadoEn: 'c',
      credencialesEn: 'c', fallos: 0, bloqueadoHasta: null,
    })
    expect(await autenticar(a, 'ana@cliente.com', 'x', T0)).toEqual({ ok: false, motivo: 'credenciales' })
  })
})
