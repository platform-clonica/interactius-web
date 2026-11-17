import { describe, expect, it, vi } from 'vitest'

import { leerConConfirmacion } from '@/lib/clientes/lectura'

const esperar = <T,>(ms: number, v: T) => new Promise<T>((r) => setTimeout(() => r(v), ms))

describe('leerConConfirmacion', () => {
  it('si la lectura rápida no encuentra nada, no hace la estricta (que se cuelga con claves inexistentes)', async () => {
    const estricta = vi.fn(async () => ({ v: 1 }))
    expect(await leerConConfirmacion(async () => null, estricta, 50)).toBeNull()
    expect(estricta).not.toHaveBeenCalled()
  })

  it('si existe, devuelve la versión estricta (la más reciente)', async () => {
    expect(await leerConConfirmacion(async () => ({ v: 'vieja' }), async () => ({ v: 'nueva' }), 50)).toEqual({
      v: 'nueva',
    })
  })

  it('si la estricta tarda demasiado, responde null (fail-closed)', async () => {
    expect(await leerConConfirmacion(async () => ({ v: 1 }), () => esperar(200, { v: 2 }), 20)).toBeNull()
  })

  it('si la estricta dice que ya no existe, responde null', async () => {
    expect(await leerConConfirmacion(async () => ({ v: 1 }), async () => null, 50)).toBeNull()
  })

  it('si la estricta falla, propaga el error (la zona responde Servicio no disponible)', async () => {
    await expect(
      leerConConfirmacion(async () => ({ v: 1 }), async () => { throw new Error('caída') }, 50),
    ).rejects.toThrow('caída')
  })
})
