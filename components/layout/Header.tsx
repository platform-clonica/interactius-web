'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/lib/i18n/routing'
import { ButtonPrimary } from '@/components/ui/ButtonPrimary'
import { useScrollDirection } from '@/components/motion/useScrollDirection'
import { useMenuStore } from '@/lib/store/menu'

/**
 * Header — fixed top, 80px alto, hide-on-scroll-down.
 *
 * Especificación:
 * - left: var(--sidebar-w) → se alinea con el borde interno del sidebar
 *   en desktop y con el viewport en móvil (la var cambia a 0 bajo 901px).
 * - Única acción: botón "Hablemos ↗" → /contacto (variant dark).
 * - Hide al hacer scroll hacia abajo > 80px. Show al hacer scroll hacia arriba.
 * - Cuando el menú overlay está abierto, el header no se oculta — el usuario
 *   debe poder cerrar el overlay y llegar a "Hablemos" sin fricción.
 * - z-header = 200 → por encima del overlay (150) y de cualquier contenido.
 */
export function Header() {
  const t = useTranslations('common')
  const direction = useScrollDirection({ threshold: 80 })
  const menuOpen = useMenuStore((s) => s.isOpen)

  const hidden = !menuOpen && direction === 'down'

  return (
    <header
      role="banner"
      className={`fixed top-0 right-0 z-header flex h-20 items-center justify-end
                  px-grid-margin
                  left-0 lg:left-sidebar
                  transition-transform duration-mid ease-expo
                  ${hidden ? '-translate-y-full' : 'translate-y-0'}`}
    >
      <ButtonPrimary as={Link} href="/contacto" variant="dark">
        {t('header.cta')} <span aria-hidden="true">↗</span>
      </ButtonPrimary>
    </header>
  )
}
