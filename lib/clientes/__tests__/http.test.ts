import { describe, expect, it } from 'vitest'

import { destinoSeguro, origenValido, rutaSegura } from '@/lib/clientes/http'

const req = (headers: Record<string, string>) =>
  new Request('https://www.interactius.com/clientes/login', { method: 'POST', headers })

describe('origenValido', () => {
  it('acepta el mismo host y rechaza otros o ausencia', () => {
    expect(origenValido(req({ origin: 'https://www.interactius.com', host: 'www.interactius.com' }))).toBe(true)
    expect(origenValido(req({ origin: 'https://evil.io', host: 'www.interactius.com' }))).toBe(false)
    expect(origenValido(req({ host: 'www.interactius.com' }))).toBe(false)
    expect(origenValido(req({ origin: 'null', host: 'www.interactius.com' }))).toBe(false)
  })
})

describe('destinoSeguro', () => {
  it('solo rutas de la zona', () => {
    expect(destinoSeguro('/clientes/caixabank/k7f3q9xm2p')).toBe('/clientes/caixabank/k7f3q9xm2p')
    expect(destinoSeguro('/clientes/admin')).toBe('/clientes/admin')
    expect(destinoSeguro('https://evil.io')).toBe('/clientes/admin')
    expect(destinoSeguro('//evil.io/clientes/x/y')).toBe('/clientes/admin')
    expect(destinoSeguro('/clientes/caixabank/k7f3q9xm2p?x=1')).toBe('/clientes/admin')
  })
})

describe('rutaSegura', () => {
  it('une segmentos y rechaza escapes', () => {
    expect(rutaSegura(['css', 'app.css'])).toBe('css/app.css')
    expect(rutaSegura(['mi%20archivo.png'])).toBe('mi archivo.png')
    expect(rutaSegura(['..', 'x'])).toBeNull()
    expect(rutaSegura(['%2e%2e', 'x'])).toBeNull()
    expect(rutaSegura([])).toBeNull()
  })
})
