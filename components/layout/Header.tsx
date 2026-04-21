import { getTranslations } from 'next-intl/server'

import { Link } from '@/lib/i18n/routing'
import { ButtonPrimary } from '@/components/ui/ButtonPrimary'

/**
 * Header — barra superior fija con CTA "Hablemos".
 *
 * Server Component: no necesita estado ni hooks de cliente.
 * useTranslations → getTranslations (async, server-side).
 */
export async function Header() {
  const t = await getTranslations('common')

  return (
    <header
      role="banner"
      className="fixed top-0 right-0 z-header flex h-20 items-center justify-end
                 px-grid-margin left-0 lg:left-sidebar"
    >
      <ButtonPrimary as={Link} href="/contacto" variant="light">
        {t('header.cta')}
      </ButtonPrimary>
    </header>
  )
}
