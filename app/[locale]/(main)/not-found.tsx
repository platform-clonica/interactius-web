import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

/**
 * Not Found — se activa cuando notFound() es llamado desde una page.tsx
 * o cuando la URL no coincide con ninguna ruta. Server Component.
 */
export default async function NotFoundPage() {
  const t = await getTranslations('common')

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg px-grid-margin">
      <div className="flex flex-col gap-8 max-w-[44ch]">
        <p className="font-mono text-body-sm text-fg/40">404</p>

        <h1 className="font-serif font-light text-title text-fg leading-none tracking-[-0.02em]">
          {t('notFound.title')}
        </h1>

        <p className="font-mono text-body-sm text-fg leading-[1.6]">
          {t('notFound.body')}
        </p>

        <div className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-body-sm text-fg">
          <Link href="/" className="hover-wipe-underline w-fit text-fg">
            {t('actions.back')}
          </Link>
        </div>
      </div>
    </div>
  )
}
