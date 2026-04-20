import { getTranslations } from 'next-intl/server'

import { Link } from '@/lib/i18n/routing'
import { Logo } from '@/components/ui/Logo'

import { MenuTrigger } from './MenuTrigger'

/**
 * Sidebar — barra fija vertical izquierda.
 *
 * Especificación Figma (node 435:1602 "side-margin"):
 * - 128px de ancho, 100vh de alto, fijo al borde izquierdo.
 * - Hamburguesa arriba (top ~26px, centrada).
 * - Logo rotado -90° desde top: 80px, centrado.
 * - Oculto bajo 901px — la CSS var --sidebar-w pasa a 0 en ese breakpoint.
 */
export async function Sidebar() {
  const t = await getTranslations('common')

  return (
    <aside
      className="fixed left-0 top-0 z-sidebar hidden h-screen w-sidebar
                 border-r border-muted bg-bg overflow-hidden lg:block"
      aria-label={t('sidebar.label')}
    >
      {/* Hamburger — top center, ~26px from top */}
      <div className="absolute left-1/2 top-[26px] -translate-x-1/2">
        <MenuTrigger
          label={t('menu.open')}
          controls="menu-overlay"
          className="flex size-10 items-center justify-center
                     text-fg transition-colors duration-fast ease-expo
                     hover:opacity-70"
        />
      </div>

      {/* Logo vertical — top: 80px, centered, rotated -90deg */}
      <Link
        href="/"
        className="absolute left-1/2 top-20 -translate-x-1/2
                   transition-opacity duration-fast ease-expo hover:opacity-70"
        aria-label={t('logo.home')}
      >
        {/*
          Container matches post-rotation visual dimensions:
          w = logo height (30.975px), h = logo width (219.195px)
          flex centers the rotated logo within this box.
        */}
        <span
          className="flex items-center justify-center"
          style={{ width: '30.975px', height: '219.195px' }}
        >
          <span className="-rotate-90 flex-none">
            <Logo variant="wordmark" className="h-[30.975px] w-auto" />
          </span>
        </span>
      </Link>
    </aside>
  )
}
