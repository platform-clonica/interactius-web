'use client'

import { useCallback, useEffect, type MouseEvent, type ReactNode } from 'react'

import { Link, useRouter } from '@/lib/i18n/navigation'
import { usePageCurtainStore } from '@/lib/store/curtain'

/**
 * SidebarLogoLink — wrapper client del logo del Sidebar.
 *
 * Intercepta el click para disparar la PageCurtain global hacia "/" con la
 * misma transición que cualquier otra navegación interna. Cmd/Ctrl/Shift/Alt
 * click conservan el comportamiento nativo (abrir en pestaña). Prefetch
 * programático del home en montaje para evitar hold en la primera navegación.
 */
export function SidebarLogoLink({
  ariaLabel,
  children,
}: {
  ariaLabel: string
  children: ReactNode
}) {
  const begin = usePageCurtainStore((s) => s.beginPageCurtain)
  const router = useRouter()

  useEffect(() => {
    router.prefetch('/')
  }, [router])

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      // Si ya estamos en home, no disparar la cortina (sería navegación a la
      // misma ruta, el pathname no cambiaría y la cortina aguantaría hasta
      // MAX_HOLD_MS).
      if (window.location.pathname === '/') return
      e.preventDefault()
      begin('/')
    },
    [begin],
  )

  return (
    <Link
      href="/"
      data-sidebar-logo=""
      onClick={handleClick}
      className="absolute top-20 -translate-x-1/2 pointer-events-auto
                 transition-opacity duration-fast ease-expo hover:opacity-70"
      style={{ left: 'calc(50% - 3px)', filter: 'brightness(0) invert(1)' }}
      aria-label={ariaLabel}
    >
      {/* Máscara line-reveal (overflow hidden). El reveal/unreveal del logo
          vertical en el swap del menú (home-arriba) lo conduce el CSS vía
          data-hero-logo: el inner traslada en Y dentro de esta máscara. En el
          resto de páginas el inner queda en su sitio (revelado). */}
      <span data-sidebar-logo-mask style={{ display: 'block', overflow: 'hidden' }}>
        <span data-sidebar-logo-inner style={{ display: 'block' }}>
          {children}
        </span>
      </span>
    </Link>
  )
}
