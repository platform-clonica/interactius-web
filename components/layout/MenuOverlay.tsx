'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

import { Link, type RouteId } from '@/lib/i18n/routing'
import { useMenuStore } from '@/lib/store/menu'
import { useFocusTrap } from '@/components/motion/useFocusTrap'

import { LocaleSwitcher } from './LocaleSwitcher'

/* ==========================================================================
   Navegación principal — 7 items canónicos en orden de aparición
   ========================================================================== */

const NAV_ITEMS: { route: RouteId; labelKey: string }[] = [
  { route: '/pensamiento-estrategico', labelKey: 'nav.pensamiento' },
  { route: '/activacion-de-soluciones', labelKey: 'nav.activacion' },
  { route: '/transformacion-cultural', labelKey: 'nav.transformacion' },
  { route: '/identidad', labelKey: 'nav.identidad' },
  { route: '/miradas', labelKey: 'nav.miradas' },
  { route: '/contacto', labelKey: 'nav.contacto' },
  { route: '/aviso-legal', labelKey: 'nav.legal' },
]

/* ==========================================================================
   MenuOverlay
   ========================================================================== */

export function MenuOverlay() {
  const t = useTranslations()
  const isOpen = useMenuStore((s) => s.isOpen)
  const close = useMenuStore((s) => s.close)
  const containerRef = useRef<HTMLDivElement>(null)

  // Focus trap + Escape handler — solo activos cuando está abierto.
  useFocusTrap(containerRef, isOpen, close)

  // Auto-close en cambio de pathname (ver PageTransition o navegación manual).
  // Si el usuario clica un link y la URL cambia, cerramos. Lo forzamos aquí
  // para cubrir el caso en que el Link no triggeree el onClick.
  useEffect(() => {
    if (!isOpen) return
    const handlePopState = () => close()
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isOpen, close])

  return (
    <div
      id="menu-overlay"
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('common.menu.label')}
      aria-hidden={!isOpen}
      {...(!isOpen ? { inert: true } : {})}
      className={`fixed inset-0 z-menu-overlay overflow-hidden bg-warm-light
                  ${isOpen ? '' : 'hidden'}`}
    >
      <div className="section-inner h-full pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="grid h-full grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-grid-gutter">
          {/* ----- Columna izquierda: navegación principal ----- */}
          <nav
            aria-label={t('common.menu.primaryNav')}
            className="lg:col-span-8"
          >
            <ul className="flex flex-col gap-4 lg:gap-6">
              {NAV_ITEMS.map(({ route, labelKey }) => (
                <li key={route}>
                  <Link
                    href={route as Exclude<RouteId, '/miradas/[cat]/[slug]'>}
                    onClick={close}
                    className="inline-block font-serif text-title-sm lg:text-section
                               text-fg hover:opacity-60 focus-visible:opacity-60"
                  >
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ----- Columna derecha: info, social, locale switcher ----- */}
          <aside
            className="flex flex-col justify-between gap-12 lg:col-span-4"
            aria-label={t('common.menu.contactInfo')}
          >
            {/* Dirección + contacto */}
            <div className="flex flex-col gap-6 font-mono text-body-sm">
              <address className="not-italic">
                <p>Pau Claris, 100 Planta 2</p>
                <p>08009 Barcelona</p>
              </address>

              <ul className="flex flex-col gap-2">
                <li>
                  <a
                    href="mailto:hola@interactius.com"
                    className="transition-opacity duration-fast ease-expo hover:opacity-60"
                  >
                    hola@interactius.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+34936243913"
                    className="transition-opacity duration-fast ease-expo hover:opacity-60"
                  >
                    +34 936 24 39 13
                  </a>
                </li>
              </ul>
            </div>

            {/* Social */}
            <ul className="flex flex-col gap-2 font-mono text-body-sm">
              <li>
                <a
                  href="https://www.linkedin.com/company/interactius"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity duration-fast ease-expo hover:opacity-60"
                >
                  LinkedIn
                  <span className="sr-only"> {t('common.newWindow')}</span>
                  <span aria-hidden="true"> ↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/interactius"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity duration-fast ease-expo hover:opacity-60"
                >
                  Instagram
                  <span className="sr-only"> {t('common.newWindow')}</span>
                  <span aria-hidden="true"> ↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@interactius"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity duration-fast ease-expo hover:opacity-60"
                >
                  YouTube
                  <span className="sr-only"> {t('common.newWindow')}</span>
                  <span aria-hidden="true"> ↗</span>
                </a>
              </li>
            </ul>

            {/* Locale switcher */}
            <div className="mt-auto">
              <LocaleSwitcher />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
