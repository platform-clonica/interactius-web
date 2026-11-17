/**
 * Lectura segura para Netlify Blobs en runtime.
 *
 * En las funciones de Netlify, LEER una clave que no existe (con cualquier
 * consistencia) no devuelve 404: el edge responde 5xx, @netlify/blobs lo
 * reintenta 5 veces × 5 s y la función acaba en 504. Pasaba al dar acceso a
 * un usuario nuevo, en el login de un correo inexistente (con fuga de
 * existencia por tiempo) y en el visor de un artefacto inexistente.
 * LISTAR, en cambio, responde bien (el panel admin lo usa).
 *
 * 1. `existe()`: comprobación por listado; si no existe, null al momento.
 * 2. Solo si existe, lectura estricta (la versión más reciente, p. ej. una
 *    revocación de hace un segundo), con un tope de tiempo. Si se pasa del
 *    tope, null: ante la duda, nadie entra.
 */
export async function leerConConfirmacion<T>(
  existe: () => Promise<boolean>,
  estricta: () => Promise<T | null>,
  topeMs: number,
): Promise<T | null> {
  if (!(await existe())) return null

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
