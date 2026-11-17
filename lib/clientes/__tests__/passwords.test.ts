import { describe, expect, it } from 'vitest'

import {
  HASH_FICTICIO,
  generarPassword,
  hashPassword,
  verificarPassword,
} from '@/lib/clientes/passwords'

describe('passwords', () => {
  it('genera 16 caracteres en grupos de 4', () => {
    expect(generarPassword()).toMatch(
      /^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/,
    )
  })

  it('verifica la contraseña correcta y rechaza otra', async () => {
    const pw = generarPassword()
    const hash = await hashPassword(pw)
    expect(hash).toMatch(/^scrypt\$N=16384,r=8,p=1\$/)
    expect(hash).not.toContain(pw)
    expect(await verificarPassword(pw, hash)).toBe(true)
    expect(await verificarPassword(generarPassword(), hash)).toBe(false)
  })

  it('tolera mayúsculas, espacios y guiones al teclear', async () => {
    const hash = await hashPassword('k7f3-q9xm-2pab-r4dz')
    expect(await verificarPassword(' K7F3 Q9XM 2PAB R4DZ ', hash)).toBe(true)
    expect(await verificarPassword('k7f3q9xm2pabr4dz', hash)).toBe(true)
  })

  it('dos hashes de la misma contraseña son distintos (salt)', async () => {
    expect(await hashPassword('a')).not.toBe(await hashPassword('a'))
  })

  it('rechaza hashes mal formados y el ficticio', async () => {
    expect(await verificarPassword('x', 'basura')).toBe(false)
    expect(await verificarPassword('x', 'scrypt$N=0,r=8,p=1$AA==$AA==')).toBe(false)
    expect(await verificarPassword('x', HASH_FICTICIO)).toBe(false)
  })
})
