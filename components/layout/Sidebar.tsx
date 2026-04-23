import { getTranslations } from 'next-intl/server'

import { Link } from '@/lib/i18n/routing'
import { RotatedLogo } from '@/components/ui/RotatedLogo'

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
                 bg-bg overflow-hidden lg:block"
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
        className="absolute top-20 -translate-x-1/2
                   transition-opacity duration-fast ease-expo hover:opacity-70"
        style={{ left: 'calc(50% - 3px)' }}
        aria-label={t('logo.home')}
      >
        <RotatedLogo />
      </Link>
    </aside>
  )
}
