import { getTranslations } from 'next-intl/server'

import { HeaderCTA } from './HeaderCTA'
import { MenuTrigger } from './MenuTrigger'

/**
 * Header — barra superior fija con CTA "Hablemos" + hamburger mobile.
 *
 * Server Component: resuelve traducciones y delega la interacción a los
 * subcomponentes cliente. En mobile (<lg) renderiza el hamburger a la
 * izquierda (el Sidebar está oculto). En desktop el hamburger lo aporta
 * el Sidebar y aquí solo queda el CTA.
 */
export async function Header() {
  const t = await getTranslations('common')

  return (
    <header
      role="banner"
      className="fixed top-0 left-0 right-0 z-header h-20 pointer-events-none"
      style={{ mixBlendMode: 'difference' }}
    >
      {/* Hamburger mobile — top-left a 26px (mismo eje que la X close
          del MenuOverlay y que el hamburger desktop del Sidebar) */}
      <div className="absolute left-[26px] top-[26px] pointer-events-auto lg:hidden">
        <MenuTrigger
          label={t('menu.open')}
          controls="menu-overlay"
          className="flex size-10 items-center justify-center
                     text-fg transition-opacity duration-fast ease-expo
                     hover:opacity-70"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </div>

      {/* CTA "Hablemos" — top-right siempre visible */}
      <div
        data-header-cta=""
        className="absolute right-[26px] top-1/2 -translate-y-1/2 pointer-events-auto"
      >
        <HeaderCTA label={t('header.cta')} />
      </div>
    </header>
  )
}
