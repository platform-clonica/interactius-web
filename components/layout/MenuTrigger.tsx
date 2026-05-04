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
  //
  // Implementado como SVG (no spans) con `vectorEffect="non-scaling-stroke"`
  // → ambas líneas renderizan a 1.5px exactos en pantalla con el mismo
  // antialiasing en cualquier resolución/DPR. Antes usaba spans con
  // `top:0` vs `bottom:0` que introducían ligera asimetría de subpíxel
  // (el stroke superior se veía más grueso que el inferior en algunas
  // pantallas).
  const duration = open ? 'duration-[900ms]' : 'duration-fast'
  return (
    <svg
      width="40"
      height="10"
      viewBox="0 0 40 10"
      fill="none"
      aria-hidden="true"
      className="block overflow-visible"
    >
      <line
        x1="0"
        y1="0.75"
        x2="40"
        y2="0.75"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        className={`transition-transform ${duration} ease-expo ${
          open ? 'translate-y-[4.25px] rotate-45' : 'translate-y-0 rotate-0'
        }`}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <line
        x1="0"
        y1="9.25"
        x2="40"
        y2="9.25"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        className={`transition-transform ${duration} ease-expo ${
          open ? '-translate-y-[4.25px] -rotate-45' : 'translate-y-0 rotate-0'
        }`}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
    </svg>
  )
}
