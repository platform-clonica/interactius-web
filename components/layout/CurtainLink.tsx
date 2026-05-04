'use client'

import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react'

import { Link } from '@/lib/i18n/navigation'
import { usePageCurtainStore } from '@/lib/store/curtain'

/* ==========================================================================
   CurtainLink — Link i18n + disparo de PageCurtain
   --------------------------------------------------------------------------
   Wrapper canónico para CUALQUIER navegación interna que deba pasar por la
   cortina. Reemplaza el patrón duplicado:

     <Link href={X} onClick={(e) => { e.preventDefault(); begin(X) }}>

   Si el usuario hace cmd/ctrl/shift/alt + click o middle-click, dejamos que
   el browser abra en pestaña nueva (no preventDefault). En el resto de
   casos, disparamos la cortina.
   ========================================================================== */

type LinkProps = ComponentPropsWithoutRef<typeof Link>

interface CurtainLinkProps extends Omit<LinkProps, 'onClick' | 'children'> {
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

export function CurtainLink({
  href,
  children,
  onClick,
  ...rest
}: CurtainLinkProps) {
  const begin = usePageCurtainStore((s) => s.beginPageCurtain)

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    begin(href as string)
  }

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  )
}
