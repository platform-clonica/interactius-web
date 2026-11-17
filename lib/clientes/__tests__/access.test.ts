import { describe, expect, it } from 'vitest'

import { puedeVer, registrarAcceso, usuarioDeSesion } from '@/lib/clientes/access'
import { crearAlmacenesEnMemoria } from '@/lib/clientes/memory-store'
import { guardarUsuario, leerUltimoAcceso } from '@/lib/clientes/repo'
import { crearTokenSesion } from '@/lib/clientes/session'
import type { Artefacto, Usuario } from '@/lib/clientes/types'

const S = 'x'.repeat(32)
const T0 = Date.UTC(2026, 10, 20)

const base: Usuario = {
  email: 'ana@cliente.com', hash: 'h', admin: false, creadoEn: 'c',
  credencialesEn: new Date(T0).toISOString(), fallos: 0, bloqueadoHasta: null,
}

const art = (accesos: string[]): Artefacto => ({
  id: 'aaaaaaaaaa', cliente: 'caixabank', titulo: 't', origen: 'o', version: 1,
  publicadoEn: 'p', publicadoPor: 'x', entrada: 'index.html', avisos: [],
  accesos: Object.fromEntries(accesos.map((e) => [e, { concedidoEn: 'c' }])),
})

describe('usuarioDeSesion', () => {
  it('devuelve el usuario con sesión válida', async () => {
    const a = crearAlmacenesEnMemoria()
    await guardarUsuario(a, base)
    const t = crearTokenSesion('ana@cliente.com', T0 + 1, S)
    expect((await usuarioDeSesion(a, t, T0 + 2, S))?.email).toBe('ana@cliente.com')
  })

  it('invalida sesiones anteriores a regenerar credenciales', async () => {
    const a = crearAlmacenesEnMemoria()
    const t = crearTokenSesion('ana@cliente.com', T0 + 1, S)
    await guardarUsuario(a, { ...base, credencialesEn: new Date(T0 + 10).toISOString() })
    expect(await usuarioDeSesion(a, t, T0 + 20, S)).toBeNull()
  })

  it('usuario desactivado o borrado no tiene sesión', async () => {
    const a = crearAlmacenesEnMemoria()
    const t = crearTokenSesion('ana@cliente.com', T0 + 1, S)
    expect(await usuarioDeSesion(a, t, T0 + 2, S)).toBeNull()
    await guardarUsuario(a, { ...base, hash: null })
    expect(await usuarioDeSesion(a, t, T0 + 2, S)).toBeNull()
  })
})

describe('puedeVer', () => {
  it('solo las personas asignadas, y los admin', () => {
    expect(puedeVer(base, art(['ana@cliente.com']))).toBe(true)
    expect(puedeVer(base, art(['luis@cliente.com']))).toBe(false)
    expect(puedeVer({ ...base, email: 'eq@interactius.com', admin: true }, art([]))).toBe(true)
  })
})

describe('registrarAcceso', () => {
  it('guarda la fecha del último acceso', async () => {
    const a = crearAlmacenesEnMemoria()
    await registrarAcceso(a, 'aaaaaaaaaa', 'ana@cliente.com', T0)
    expect(await leerUltimoAcceso(a, 'aaaaaaaaaa', 'ana@cliente.com')).toBe(new Date(T0).toISOString())
  })
})
