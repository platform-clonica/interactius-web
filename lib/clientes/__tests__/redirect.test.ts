import { describe, expect, it } from 'vitest'

import { redirigir } from '@/lib/clientes/redirect'

describe('redirigir', () => {
  it('303 con Location relativa: el navegador la resuelve contra el host público', () => {
    const res = redirigir('/clientes/pruebas/k7f3q9xm2p?error=credenciales')
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('/clientes/pruebas/k7f3q9xm2p?error=credenciales')
  })

  it('rechaza destinos que no son rutas internas', () => {
    expect(() => redirigir('https://evil.io')).toThrow()
    expect(() => redirigir('//evil.io/x')).toThrow()
  })
})
