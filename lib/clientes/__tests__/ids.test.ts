import { describe, expect, it } from 'vitest'

import {
  ALFABETO,
  ID_ARTEFACTO_RE,
  esEmailInteractius,
  esEmailValido,
  idAleatorio,
  normalizarEmail,
  validarSlugCliente,
} from '@/lib/clientes/ids'

describe('ids', () => {
  it('el alfabeto tiene 32 caracteres sin ambigüedades', () => {
    expect(ALFABETO).toHaveLength(32)
    expect(ALFABETO).not.toMatch(/[01lo]/)
  })

  it('idAleatorio respeta longitud y alfabeto y no repite', () => {
    const a = idAleatorio(10)
    const b = idAleatorio(10)
    expect(a).toMatch(ID_ARTEFACTO_RE)
    expect(a).not.toBe(b)
    expect(idAleatorio(16)).toHaveLength(16)
  })

  it('valida slugs de cliente', () => {
    expect(validarSlugCliente('caixabank')).toBeNull()
    expect(validarSlugCliente('el-corte-ingles')).toBeNull()
    expect(validarSlugCliente('Caixa')).not.toBeNull()
    expect(validarSlugCliente('caixa--bank')).not.toBeNull()
    expect(validarSlugCliente('')).not.toBeNull()
    for (const r of ['login', 'logout', 'admin', 'archivos']) {
      expect(validarSlugCliente(r)).toMatch(/reservado/)
    }
  })

  it('normaliza y valida emails', () => {
    expect(normalizarEmail('  Ana@Cliente.COM ')).toBe('ana@cliente.com')
    expect(esEmailValido('ana@cliente.com')).toBe(true)
    expect(esEmailValido('ana@cliente')).toBe(false)
    expect(esEmailValido('ana cliente@x.com')).toBe(false)
    expect(esEmailInteractius('Carlos@Interactius.com')).toBe(true)
    expect(esEmailInteractius('carlos@interactius.com.evil.io')).toBe(false)
  })
})
