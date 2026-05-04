'use client'

import { useEffect, useRef } from 'react'

import { usePathname } from '@/lib/i18n/navigation'
import { useMenuStore } from '@/lib/store/menu'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const closeMenu = useMenuStore((s) => s.close)
  const firstMount = useRef(true)

  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false
      return
    }
    // Si la cortina está corriendo, no interrumpir: gestionará el close al final.
    if (!useMenuStore.getState().curtainActive) {
      closeMenu()
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, closeMenu])

  return <>{children}</>
}
