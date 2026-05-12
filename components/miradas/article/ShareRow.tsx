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
  title: string
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
 * (clipboard) + LinkedIn / Facebook / Twitter intents. Líneas separadoras
 * top/bottom canónicas (border-fg/20).
 */
export function ShareRow({
  title,
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

  const encUrl = encodeURIComponent(url)
  const encTitle = encodeURIComponent(title)
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`
  const twitter = `https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`

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
          <a
            href={facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="hover-wipe-underline w-fit text-fg"
          >
            Facebook
          </a>
          <a
            href={twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="hover-wipe-underline w-fit text-fg"
          >
            Twitter
          </a>
        </div>
      </div>
    </div>
  )
}
