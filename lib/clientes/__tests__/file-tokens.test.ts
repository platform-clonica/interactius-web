import { describe, expect, it } from 'vitest'

import {
  DURACION_TOKEN_ARCHIVO_MS,
  crearTokenArchivo,
  verificarTokenArchivo,
} from '@/lib/clientes/file-tokens'

const S = 'x'.repeat(32)
const T0 = 1_800_000_000_000

describe('file-tokens', () => {
  it('válido para su artefacto y versión durante 15 minutos', () => {
    const { token, expira } = crearTokenArchivo('k7f3q9xm2p', 2, T0, S)
    expect(expira).toBe(T0 + DURACION_TOKEN_ARCHIVO_MS)
    expect(token).toMatch(/^[A-Za-z0-9_.-]+$/)
    expect(verificarTokenArchivo(token, 'k7f3q9xm2p', 2, T0 + 60_000, S)).toBe(true)
    expect(verificarTokenArchivo(token, 'k7f3q9xm2p', 2, expira + 1, S)).toBe(false)
  })

  it('no sirve para otro artefacto, otra versión u otro secreto', () => {
    const { token } = crearTokenArchivo('k7f3q9xm2p', 2, T0, S)
    expect(verificarTokenArchivo(token, 'aaaaaaaaaa', 2, T0, S)).toBe(false)
    expect(verificarTokenArchivo(token, 'k7f3q9xm2p', 3, T0, S)).toBe(false)
    expect(verificarTokenArchivo(token, 'k7f3q9xm2p', 2, T0, 'y'.repeat(32))).toBe(false)
    expect(verificarTokenArchivo('basura', 'k7f3q9xm2p', 2, T0, S)).toBe(false)
  })
})
