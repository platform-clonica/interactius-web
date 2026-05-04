'use client'

import { useCallback, useEffect, type MouseEvent } from 'react'

import { Link, useRouter } from '@/lib/i18n/navigation'
import { usePageCurtainStore } from '@/lib/store/curtain'

/**
 * FooterNewsletterCTA — link "Suscríbete" del footer con cortina global a /newsletter.
 *
 * Estilo: underline canónico (hover-wipe-underline), no botón con borde.
 * El handler intercepta el click normal y dispara la PageCurtain;
 * cmd/ctrl/shift/alt-click conservan la navegación nativa.
 */
export function FooterNewsletterCTA({ label }: { label: string }) {
  const begin = usePageCurtainStore((s) => s.beginPageCurtain)
  const router = useRouter()

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
    <Link
      href="/newsletter"
      onClick={handleClick}
      className="hover-wipe-underline w-fit font-mono text-body-sm text-warm-light"
    >
      {label}
    </Link>
  )
}
