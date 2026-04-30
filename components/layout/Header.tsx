import { getTranslations } from 'next-intl/server'

import { HeaderCTA } from './HeaderCTA'

/**
 * Header — barra superior fija con CTA "Hablemos".
 *
 * Server Component: resuelve traducciones y delega la interacción al
 * subcomponente cliente HeaderCTA, que dispara la cortina global de
 * transición a /contacto.
 */
export async function Header() {
  const t = await getTranslations('common')

  return (
    <header
      role="banner"
      className="fixed top-0 right-0 z-header flex h-20 items-center justify-end
                 pr-[26px] left-0 pointer-events-none"
      style={{ mixBlendMode: 'difference' }}
    >
      <div data-header-cta="" className="pointer-events-auto">
        <HeaderCTA label={t('header.cta')} />
      </div>
    </header>
  )
}
