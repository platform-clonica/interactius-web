'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { CurtainLink } from '@/components/layout/CurtainLink'
import type { ComponentProps } from 'react'

type CurtainHref = ComponentProps<typeof CurtainLink>['href']

interface BackLink {
  href: CurtainHref
  label: string
}

interface ShareRowProps {
  /** URL absoluta del artículo. */
  url: string
  /** Mostrado a la izquierda de la fila si no se pasa `backLink`. */
  readingTimeMinutes?: number
  /** Si se pasa, sustituye los minutos de lectura por un link (estilo
   *  hover-wipe-underline) — usado en la fila inferior del artículo. */
  backLink?: BackLink
}

/**
 * Fila de share del artículo: a la izquierda minutos de lectura O un
 * back-link (según props); a la derecha "Compartir" (label) + Copiar enlace
 * (clipboard) + intent de LinkedIn. Líneas separadoras top/bottom canónicas
 * (border-fg/20).
 *
 * Solo LinkedIn: es donde está la audiencia de Miradas. Facebook y Twitter
 * estuvieron aquí y se retiraron — cada intent extra es ruido en la fila y
 * una red que no mueve tráfico a estos artículos.
 */
export function ShareRow({
  url,
  readingTimeMinutes,
  backLink,
}: ShareRowProps) {
  const t = useTranslations('miradas')
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // noop — clipboard puede fallar en contextos no-seguros (http, etc.)
    }
  }

  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`

  return (
    <div className="border-y border-fg/20 py-6">
      <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-3 font-mono text-body-sm text-fg">
        {backLink ? (
          <CurtainLink
            href={backLink.href}
            className="hover-wipe-underline w-fit text-fg"
          >
            {backLink.label}
          </CurtainLink>
        ) : (
          <span>{readingTimeMinutes} {t('article.minRead')}</span>
        )}
        <div className="flex flex-wrap items-center gap-x-10 gap-y-2">
          <span className="text-fg">{t('article.share')}</span>
          <button
            type="button"
            onClick={onCopy}
            aria-label={t('article.copyLinkAriaLabel')}
            className="hover-wipe-underline w-fit text-fg"
          >
            {copied ? t('article.linkCopied') : t('article.copyLink')}
          </button>
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="hover-wipe-underline w-fit text-fg"
          >
            Linkedin
          </a>
        </div>
      </div>
    </div>
  )
}
