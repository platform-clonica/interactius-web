import { createHmac, timingSafeEqual } from 'node:crypto'

export function firmar(datos: string, secreto: string): string {
  return createHmac('sha256', secreto).update(datos).digest('base64url')
}

export function firmaValida(datos: string, firma: string, secreto: string): boolean {
  const esperada = Buffer.from(firmar(datos, secreto))
  const recibida = Buffer.from(firma)
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida)
}
