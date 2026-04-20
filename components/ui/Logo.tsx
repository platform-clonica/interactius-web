/**
 * Logo — marca Interactius.
 *
 * ⚠ PLACEHOLDER. Actualmente renderiza el wordmark como texto SVG usando
 * IBM Plex Serif. Cuando llegue el asset de marca definitivo:
 *
 * 1. Añadir los <path d="..." /> exportados desde Figma/Illustrator.
 * 2. Actualizar `viewBox` según las dimensiones del asset real.
 * 3. Eliminar los <text> y el font-family reference.
 * 4. Retirar este bloque de comentario.
 *
 * La API pública (props, variantes, comportamiento aria) queda fijada aquí
 * y no debe cambiar con el swap.
 */

interface LogoProps {
  /**
   * Tipo de logo a renderizar.
   * - wordmark-sm: para sidebar y lugares compactos.
   * - wordmark-lg: para MenuOverlay mobile o pantallas intermedias.
   * - symbol: solo el ícono, útil para favicon inline y espacios pequeños.
   */
  variant?: 'wordmark-sm' | 'wordmark-lg' | 'symbol'
  className?: string
  /**
   * Si se pasa, el SVG se anuncia como imagen accesible con ese label.
   * Si no, se marca aria-hidden — el elemento es decorativo (el consumidor
   * ya ha etiquetado el link/botón que lo contiene).
   */
  'aria-label'?: string
}

export function Logo({
  variant = 'wordmark-sm',
  className,
  'aria-label': ariaLabel,
}: LogoProps) {
  const accessibility = ariaLabel
    ? { role: 'img' as const, 'aria-label': ariaLabel }
    : { 'aria-hidden': true as const }

  switch (variant) {
    case 'wordmark-sm':
      return (
        <svg
          viewBox="0 0 120 16"
          width="120"
          height="16"
          fill="currentColor"
          className={className}
          {...accessibility}
        >
          <text
            x="0"
            y="12"
            fontFamily="var(--font-ibm-plex-serif), Georgia, serif"
            fontSize="14"
            fontWeight="400"
            letterSpacing="-0.02em"
          >
            Interactius
          </text>
        </svg>
      )

    case 'wordmark-lg':
      return (
        <svg
          viewBox="0 0 360 48"
          width="360"
          height="48"
          fill="currentColor"
          className={className}
          {...accessibility}
        >
          <text
            x="0"
            y="36"
            fontFamily="var(--font-ibm-plex-serif), Georgia, serif"
            fontSize="42"
            fontWeight="400"
            letterSpacing="-0.02em"
          >
            Interactius
          </text>
        </svg>
      )

    case 'symbol':
      return (
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="currentColor"
          className={className}
          {...accessibility}
        >
          <text
            x="12"
            y="18"
            textAnchor="middle"
            fontFamily="var(--font-ibm-plex-serif), Georgia, serif"
            fontSize="20"
            fontWeight="400"
          >
            I
          </text>
        </svg>
      )
  }
}
