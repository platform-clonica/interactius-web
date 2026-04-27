'use client'

import { useCallback, useEffect, type MouseEvent } from 'react'

import { ButtonPrimary } from '@/components/ui/ButtonPrimary'
import { Link, useRouter } from '@/lib/i18n/routing'
import { usePageCurtainStore } from '@/lib/store/curtain'

/**
 * FooterNewsletterCTA — botón "Suscríbete" del footer con cortina global a /newsletter.
 *
 * Renderiza como Link para aprovechar el prefetch de Next.js (al hacer hover
 * sobre el botón el chunk de /newsletter se descarga, así la cortina no
 * uncover antes de que la página esté lista). El handler intercepta el click
 * normal y dispara la PageCurtain; cmd/ctrl/shift/alt-click conservan la
 * navegación nativa (abrir en pestaña nueva).
 */
export function FooterNewsletterCTA({ label }: { label: string }) {
  const begin = usePageCurtainStore((s) => s.beginPageCurtain)
  const router = useRouter()

  // Prefetch programático en montaje — el footer puede no estar en viewport.
  useEffect(() => {
    router.prefetch('/newsletter')
  }, [router])

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      e.preventDefault()
      begin('/newsletter')
    },
    [begin],
  )

  return (
    <ButtonPrimary
      as={Link}
      href="/newsletter"
      variant="outline"
      onClick={handleClick}
    >
      {label}
    </ButtonPrimary>
  )
}
