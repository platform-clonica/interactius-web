/**
 * Wordmark — marca Interactius en formato display grande.
 *
 * ⚠ PLACEHOLDER. Actualmente renderiza el wordmark como <text> SVG en
 * IBM Plex Serif Light. Cuando llegue el asset de marca definitivo:
 *
 * 1. Sustituir el <text> por los <path d="..." /> exportados.
 * 2. Actualizar el viewBox según dimensiones reales del asset.
 * 3. Recalcular la proporción intrínseca (constante `INTRINSIC_RATIO`).
 * 4. Retirar este bloque de comentario.
 *
 * La API pública (height, variant, aria-label) queda fijada y no debe
 * cambiar con el swap.
 *
 * Uso canónico: footer (height 95), potencialmente MenuOverlay mobile
 * grande, pantallas de transición de marca.
 */

/** Relación width/height intrínseca del wordmark — "Interactius" a ~4:1. */
const INTRINSIC_RATIO = 4

/** ViewBox base — las unidades son relativas, no px. */
const VIEWBOX_HEIGHT = 100
const VIEWBOX_WIDTH = VIEWBOX_HEIGHT * INTRINSIC_RATIO

interface WordmarkProps {
  /** Altura en píxeles. El width se calcula automáticamente. */
  height?: number
  /**
   * Color del wordmark.
   * - light (default): texto dark — uso sobre fondos claros.
   * - dark: texto pure-white — uso sobre fondos oscuros.
   * Se puede sobrescribir pasando className="text-X" ya que el SVG
   * usa currentColor.
   */
  variant?: 'light' | 'dark'
  className?: string
  /**
   * Si se pasa, el SVG se anuncia como imagen con ese label.
   * Si no, se marca aria-hidden — el wrapper ya debería etiquetar.
   */
  'aria-label'?: string
}

export function Wordmark({
  height = 95,
  variant = 'light',
  className,
  'aria-label': ariaLabel,
}: WordmarkProps) {
  const width = Math.round(height * INTRINSIC_RATIO)

  const variantClass =
    variant === 'dark' ? 'text-pure-white' : 'text-dark'

  const accessibility = ariaLabel
    ? { role: 'img' as const, 'aria-label': ariaLabel }
    : { 'aria-hidden': true as const }

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      width={width}
      height={height}
      fill="currentColor"
      className={`block ${variantClass} ${className ?? ''}`}
      preserveAspectRatio="xMinYMid meet"
      {...accessibility}
    >
      <text
        x="0"
        y="78"
        fontFamily="var(--font-ibm-plex-serif), Georgia, serif"
        fontSize="95"
        fontWeight="300"
        letterSpacing="-0.04em"
      >
        Interactius
      </text>
    </svg>
  )
}
