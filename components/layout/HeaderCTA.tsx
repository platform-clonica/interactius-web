'use client'

import { useCallback, useEffect, type MouseEvent } from 'react'

import { ButtonPrimary } from '@/components/ui/ButtonPrimary'
import { Link, useRouter } from '@/lib/i18n/routing'
import { usePageCurtainStore } from '@/lib/store/curtain'

/**
 * HeaderCTA — botón "Hablemos" con cortina de transición a /contacto.
 *
 * Renderiza como Link (prefetch automático de Next.js para que el chunk de
 * /contacto esté listo antes del uncover). Click normal → PageCurtain;
 * cmd/ctrl/shift/alt-click → navegación nativa (nueva pestaña).
 */
export function HeaderCTA({ label }: { label: string }) {
  const begin = usePageCurtainStore((s) => s.beginPageCurtain)
  const router = useRouter()

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
    <ButtonPrimary
      as={Link}
      href="/contacto"
      variant="light"
      onClick={handleClick}
    >
      {label}
    </ButtonPrimary>
  )
}
