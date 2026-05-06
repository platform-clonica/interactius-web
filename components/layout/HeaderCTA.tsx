'use client'

import { useCallback, useEffect, type MouseEvent } from 'react'

import { Link, useRouter } from '@/lib/i18n/navigation'
import { usePageCurtainStore } from '@/lib/store/curtain'
import { useMenuStore } from '@/lib/store/menu'

/**
 * HeaderCTA — link "Hablemos" con cortina de transición a /contacto.
 *
 * Estilo canónico de link con underline y hover-wipe (mismo lenguaje que
 * los secondary nav links del menú). Color adaptativo al fondo vía el
 * pipeline canónico del chrome:
 *   1. Texto inicial color dark (`text-fg`).
 *   2. `filter: brightness(0) invert(1)` lo convierte en blanco puro.
 *   3. `mix-blend-mode: difference` (en el wrapper data-header-cta del
 *      Header.tsx) compone el blanco contra el fondo → contraste correcto
 *      sobre cualquier color de página.
 */
export function HeaderCTA({ label }: { label: string }) {
  const begin = usePageCurtainStore((s) => s.beginPageCurtain)
  const router = useRouter()
  // En mobile/tablet (<lg) el MenuOverlay es fullscreen y ya tiene "Contacto"
  // entre los secondary links → ocultamos el CTA "Hablemos" cuando el menú
  // está abierto para evitar duplicado encima del LocaleSwitcher.
  const isMenuOpen = useMenuStore((s) => s.isOpen)

  // Prefetch programático en montaje. El Link prefetcha en intersección con
  // viewport, pero el header está fixed: garantizamos que /contacto esté
  // caliente desde la primera carga.
  useEffect(() => {
    router.prefetch('/contacto')
  }, [router])

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      e.preventDefault()
      begin('/contacto')
    },
    [begin],
  )

  return (
    <Link
      href="/contacto"
      onClick={handleClick}
      className={`hover-wipe-underline inline-block w-fit font-mono text-body-sm text-fg${isMenuOpen ? ' max-lg:hidden' : ''}`}
      style={{ filter: 'brightness(0) invert(1)' }}
    >
      {label}
    </Link>
  )
}
