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
  const open = useMenuStore((s) => s.open)
  const requestCurtainClose = useMenuStore((s) => s.requestCurtainClose)

  // Abrir: directo. Cerrar: solicita cortina (MenuOverlay la corre).
  const handleClick = () => (isOpen ? requestCurtainClose() : open())

  return (
    <button
      type="button"
      onClick={handleClick}
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
  // Duración asimétrica: apertura lenta (0.9s, match panel reveal) para que
  // el morph se perciba; cierre rápido (0.15s) — así la X→hamburger es inmediata
  // y no queda flotando durante la cortina de cierre.
  const duration = open ? 'duration-[900ms]' : 'duration-fast'
  return (
    <span
      className="relative block w-10 h-[10px]"
      aria-hidden="true"
    >
      <span
        className={`absolute left-0 top-0 h-[1.5px] w-10 bg-current origin-center
                    transition-transform ${duration} ease-expo
                    ${open ? 'translate-y-[4.25px] rotate-45' : 'translate-y-0 rotate-0'}`}
      />
      <span
        className={`absolute left-0 bottom-0 h-[1.5px] w-10 bg-current origin-center
                    transition-transform ${duration} ease-expo
                    ${open ? '-translate-y-[4.25px] -rotate-45' : 'translate-y-0 rotate-0'}`}
      />
    </span>
  )
}
