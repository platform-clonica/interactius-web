import { beforeEach, describe, expect, it, vi } from 'vitest'

import { autenticar } from '@/lib/clientes/auth'
import { crearAlmacenesEnMemoria } from '@/lib/clientes/memory-store'
import { HASH_FICTICIO, hashPassword, verificarPassword } from '@/lib/clientes/passwords'
import { guardarUsuario } from '@/lib/clientes/repo'

// Envolvemos verificarPassword con un espía que conserva la implementación real.
vi.mock('@/lib/clientes/passwords', async (orig) => {
  const real = await orig<typeof import('@/lib/clientes/passwords')>()
  return { ...real, verificarPassword: vi.fn(real.verificarPassword) }
})

const T0 = Date.UTC(2026, 10, 20)
const PW = 'aaaa-bbbb-cccc-dddd'

describe('autenticar: cuenta bloqueada', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ejecuta una verificación ficticia antes de responder bloqueado', async () => {
    const a = crearAlmacenesEnMemoria()
    await guardarUsuario(a, {
      email: 'ana@cliente.com', hash: await hashPassword(PW), admin: false, creadoEn: 'c',
      credencialesEn: new Date(T0).toISOString(), fallos: 0, bloqueadoHasta: null,
    })
    for (let i = 0; i < 5; i++) await autenticar(a, 'ana@cliente.com', 'x', T0)

    vi.clearAllMocks()
    expect(await autenticar(a, 'ana@cliente.com', PW, T0 + 1000)).toEqual({ ok: false, motivo: 'bloqueado' })
    expect(verificarPassword).toHaveBeenCalledWith(PW, HASH_FICTICIO)
  })
})
