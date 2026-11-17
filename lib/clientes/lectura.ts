/**
 * Lectura en dos pasos para Netlify Blobs en runtime.
 *
 * La lectura con `consistency: 'strong'` de una clave que NO existe no
 * devuelve 404: el edge sin caché responde un error que la librería trata
 * como reintentable (5 intentos × 5 s) y la función acaba en 504. Pasaba al
 * dar acceso a un usuario nuevo y pasaría en el login de un correo
 * inexistente (además, el tiempo delataría qué cuentas existen).
 *
 * 1. Lectura normal (eventual): responde al momento, también si no existe.
 * 2. Solo si existe, lectura estricta para tener la versión más reciente
 *    (p. ej. una revocación de hace un segundo), con un tope de tiempo.
 *    Si se pasa del tope, null: ante la duda, nadie entra.
 */
export async function leerConConfirmacion<T>(
  rapida: () => Promise<T | null>,
  estricta: () => Promise<T | null>,
  topeMs: number,
): Promise<T | null> {
  const encontrada = await rapida()
  if (encontrada === null) return null

  let temporizador: ReturnType<typeof setTimeout> | undefined
  const agotado = new Promise<null>((resolver) => {
    temporizador = setTimeout(() => resolver(null), topeMs)
  })
  try {
    return await Promise.race([estricta(), agotado])
  } finally {
    clearTimeout(temporizador)
  }
}
