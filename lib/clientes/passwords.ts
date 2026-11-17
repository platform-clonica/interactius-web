import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

import { idAleatorio } from './ids'

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>

const N = 16384
const R = 8
const P = 1
const KEYLEN = 32

/**
 * Hash con forma válida pero que no corresponde a ninguna contraseña. Se usa
 * para gastar el mismo tiempo cuando el usuario no existe.
 */
export const HASH_FICTICIO = `scrypt$N=${N},r=${R},p=${P}$${'A'.repeat(22)}==$${'A'.repeat(43)}=`

/** `k7f3-q9xm-2pab-r4dz`: ~80 bits. */
export function generarPassword(): string {
  return idAleatorio(16).match(/.{4}/g)!.join('-')
}

/** Las contraseñas son generadas: ignoramos mayúsculas, espacios y guiones. */
function normalizar(pw: string): string {
  return pw.normalize('NFKC').toLowerCase().replace(/[\s-]/g, '')
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scrypt(normalizar(pw), salt, KEYLEN, { N, r: R, p: P })
  return `scrypt$N=${N},r=${R},p=${P}$${salt.toString('base64')}$${hash.toString('base64')}`
}

export async function verificarPassword(
  pw: string,
  almacenado: string,
): Promise<boolean> {
  const partes = almacenado.split('$')
  if (partes.length !== 4 || partes[0] !== 'scrypt') return false
  const params = Object.fromEntries(
    partes[1].split(',').map((kv) => kv.split('=') as [string, string]),
  )
  const n = Number(params.N)
  const r = Number(params.r)
  const p = Number(params.p)
  if (!n || !r || !p) return false
  const salt = Buffer.from(partes[2], 'base64')
  const esperado = Buffer.from(partes[3], 'base64')
  if (salt.length === 0 || esperado.length === 0) return false
  const calculado = await scrypt(normalizar(pw), salt, esperado.length, { N: n, r, p })
  return timingSafeEqual(calculado, esperado)
}
