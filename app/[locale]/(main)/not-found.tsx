import { getTranslations } from 'next-intl/server'

import { Link } from '@/lib/i18n/navigation'
import { ButtonPrimary } from '@/components/ui/ButtonPrimary'

/**
 * Not Found — se activa cuando notFound() es llamado desde una page.tsx
 * o cuando la URL no coincide con ninguna ruta.
 *
 * Server Component — puede usar getTranslations directamente.
 */

export default async function NotFoundPage() {
  const t = await getTranslations('common')

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg px-grid-margin">
      <div className="flex flex-col gap-8 max-w-[40ch]">
        {/* Decorative code */}
        <p className="font-mono text-micro text-fg/40">404</p>

        <h1 className="font-serif font-light text-title text-fg leading-none tracking-[-0.02em]">
          {t('notFound.title')}
        </h1>

        <p className="font-mono text-body-sm text-fg/60 leading-[1.5]">
          {t('notFound.body')}
        </p>

        <ButtonPrimary as={Link} href="/" variant="dark">
          {t('actions.back')}
        </ButtonPrimary>
      </div>
    </div>
  )
}
