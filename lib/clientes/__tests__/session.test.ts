import { describe, expect, it } from 'vitest'

import {
  DURACION_SESION_MS,
  crearTokenSesion,
  leerTokenSesion,
} from '@/lib/clientes/session'

const S = 'x'.repeat(32)
const T0 = 1_800_000_000_000

describe('session', () => {
  it('ida y vuelta', () => {
    const t = crearTokenSesion('ana@cliente.com', T0, S)
    expect(leerTokenSesion(t, T0 + 1000, S)).toEqual({
      email: 'ana@cliente.com',
      emitidaEn: T0,
      expira: T0 + DURACION_SESION_MS,
    })
  })

  it('caduca a los 7 días', () => {
    const t = crearTokenSesion('ana@cliente.com', T0, S)
    expect(leerTokenSesion(t, T0 + DURACION_SESION_MS + 1, S)).toBeNull()
  })

  it('rechaza otro secreto, manipulación y basura', () => {
    const t = crearTokenSesion('ana@cliente.com', T0, S)
    expect(leerTokenSesion(t, T0, 'y'.repeat(32))).toBeNull()
    const [, emitida, expira, firma] = t.split('.')
    const otro = Buffer.from('luis@cliente.com').toString('base64url')
    expect(leerTokenSesion([otro, emitida, expira, firma].join('.'), T0, S)).toBeNull()
    expect(leerTokenSesion(undefined, T0, S)).toBeNull()
    expect(leerTokenSesion('a.b.c', T0, S)).toBeNull()
  })
})
