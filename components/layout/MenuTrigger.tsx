'use client'

import { useMenuStore } from '@/lib/store/menu'

interface MenuTriggerProps {
  /** aria-label localizable (llega del servidor ya traducido) */
  label: string
  /** Id del overlay controlado — para aria-controls */
  controls?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Botón hamburger que toggle-a el MenuOverlay global.
 * Aislado como client component para mantener Sidebar como server.
 */
export function MenuTrigger({
  label,
  controls = 'menu-overlay',
  className,
  style,
}: MenuTriggerProps) {
  const isOpen = useMenuStore((s) => s.isOpen)
  const toggle = useMenuStore((s) => s.toggle)

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-expanded={isOpen}
      aria-controls={controls}
      className={className}
      style={style}
    >
      <HamburgerIcon open={isOpen} />
    </button>
  )
}

/* ==========================================================================
   Icon — dos líneas en reposo, se cruzan en X cuando el menú está abierto.
   Solo CSS transforms, sin JS adicional.
   ========================================================================== */

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span
      className="relative block w-10 h-[10px]"
      aria-hidden="true"
    >
      <span
        className={`absolute left-0 top-0 h-[1.5px] w-10 bg-current origin-center
                    transition-transform duration-fast ease-expo
                    ${open ? 'translate-y-[4.25px] rotate-45' : 'translate-y-0 rotate-0'}`}
      />
      <span
        className={`absolute left-0 bottom-0 h-[1.5px] w-10 bg-current origin-center
                    transition-transform duration-fast ease-expo
                    ${open ? '-translate-y-[4.25px] -rotate-45' : 'translate-y-0 rotate-0'}`}
      />
    </span>
  )
}
