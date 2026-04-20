import { getTranslations } from 'next-intl/server'

import { Link } from '@/lib/i18n/routing'
import { Logo } from '@/components/ui/Logo'

import { MenuTrigger } from './MenuTrigger'

/**
 * Sidebar — barra fija vertical izquierda.
 *
 * Especificación:
 * - position: fixed, 60px de ancho, 100vh de alto, pegado al borde izquierdo.
 * - Hamburguesa arriba (24px del top).
 * - Logo rotado -90° abajo-centro (40px del bottom), link a home.
 * - Oculto bajo 901px — la CSS var --sidebar-w pasa a 0 en ese breakpoint
 *   y body deja de compensar con padding-left.
 *
 * Server component — solo el MenuTrigger es client.
 */
export async function Sidebar() {
  const t = await getTranslations('common')

  return (
    <aside
      className="fixed left-0 top-0 z-sidebar hidden h-screen w-sidebar
                 border-r border-muted bg-bg lg:block"
      aria-label={t('sidebar.label')}
    >
      {/* Trigger del menú — anclado arriba */}
      <div className="absolute left-1/2 top-6 -translate-x-1/2">
        <MenuTrigger
          label={t('menu.open')}
          controls="menu-overlay"
          className="flex size-10 items-center justify-center
                     text-fg transition-colors duration-fast ease-expo
                     hover:opacity-70"
        />
      </div>

      {/* Logo vertical — anclado abajo, link a home */}
      <Link
        href="/"
        className="absolute left-1/2 bottom-10 -translate-x-1/2
                   transition-opacity duration-fast ease-expo hover:opacity-70"
        aria-label={t('logo.home')}
      >
        <span className="block rotate-[-90deg] origin-center">
          <Logo variant="wordmark-sm" />
        </span>
      </Link>
    </aside>
  )
}
