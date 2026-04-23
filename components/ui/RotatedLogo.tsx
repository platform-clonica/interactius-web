/**
 * RotatedLogo — Logo vertical rotado -90°, usado en Sidebar y MenuOverlay.
 *
 * Encapsula el patrón duplicado en ambos componentes:
 *   <span style={{ width: '30.975px', height: '219.195px' }}>
 *     <span className="-rotate-90 flex-none">
 *       <Logo variant="wordmark" className="h-[30.975px] w-auto" />
 *     </span>
 *   </span>
 *
 * Las dimensiones del container coinciden con las dimensiones POST-rotación
 * del logo (w = altura del logo, h = anchura del logo). Este truco evita
 * que el elemento rotado se salga del flujo y produce el efecto de texto
 * vertical sin recálculo manual.
 *
 * Especificación Figma: node 435:1602 "side-margin" — 30.975 × 219.195 px.
 */

interface RotatedLogoProps {
  className?: string
}

// Dimensiones extraídas de Figma × 0.8
const LOGO_H = '24.78px'   // 30.975 × 0.8
const LOGO_W = '175.356px' // 219.195 × 0.8

export function RotatedLogo({ className = '' }: RotatedLogoProps) {
  return (
    <span
      className={`flex items-center justify-center ${className}`}
      style={{ width: LOGO_H, height: LOGO_W }}
    >
      <span className="-rotate-90 flex-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo/interactius.svg"
          alt=""
          aria-hidden="true"
          style={{ height: LOGO_H, width: 'auto' }}
        />
      </span>
    </span>
  )
}
