'use client'

import { useEffect } from 'react'

/**
 * Los archivos del artefacto se sirven con un token de 15 minutos. Si la
 * pestaña vuelve a primer plano después de que caduque, recargamos la página
 * para obtener uno nuevo (la sesión de 7 días sigue valiendo).
 */
export function RecargaAlCaducar({ expira }: { expira: number }) {
  useEffect(() => {
    const comprobar = () => {
      if (document.visibilityState === 'visible' && Date.now() > expira - 30_000) {
        window.location.reload()
      }
    }
    document.addEventListener('visibilitychange', comprobar)
    return () => document.removeEventListener('visibilitychange', comprobar)
  }, [expira])
  return null
}
