import { describe, expect, it, vi } from 'vitest'

import { leerConConfirmacion } from '@/lib/clientes/lectura'

const esperar = <T,>(ms: number, v: T) => new Promise<T>((r) => setTimeout(() => r(v), ms))

describe('leerConConfirmacion', () => {
  it('si la clave no existe, no llega a leerla (leer claves inexistentes se cuelga en Netlify)', async () => {
    const estricta = vi.fn(async () => ({ v: 1 }))
    expect(await leerConConfirmacion(async () => false, estricta, 50)).toBeNull()
    expect(estricta).not.toHaveBeenCalled()
  })

  it('si existe, devuelve la lectura estricta (la más reciente)', async () => {
    expect(await leerConConfirmacion(async () => true, async () => ({ v: 'nueva' }), 50)).toEqual({
      v: 'nueva',
    })
  })

  it('si la estricta tarda demasiado, responde null (fail-closed)', async () => {
    expect(await leerConConfirmacion(async () => true, () => esperar(200, { v: 2 }), 20)).toBeNull()
  })

  it('si la estricta dice que ya no existe, responde null', async () => {
    expect(await leerConConfirmacion(async () => true, async () => null, 50)).toBeNull()
  })

  it('si la estricta falla, propaga el error (la zona responde Servicio no disponible)', async () => {
    await expect(
      leerConConfirmacion(async () => true, async () => { throw new Error('caída') }, 50),
    ).rejects.toThrow('caída')
  })
})
