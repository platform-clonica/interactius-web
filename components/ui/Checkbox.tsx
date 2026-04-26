'use client'

import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'

/* ==========================================================================
   Types
   ========================================================================== */

interface CheckboxProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'children'> {
  /**
   * Label del checkbox. Si se pasa children, children tiene prioridad
   * (útil para labels con enlaces embebidos, p.ej. "Acepto la <a>política</a>").
   */
  label?: string
  children?: ReactNode
  /** Mensaje de error. Activa estilo error en border y label. */
  error?: string
  /** Texto de ayuda bajo el checkbox. */
  hint?: string
  /** Id del input. Si no se pasa, se genera con useId. */
  id?: string
  className?: string
  /** Override de clases del span del label (para tamaño/color específico). */
  labelClassName?: string
}

/* ==========================================================================
   Component
   --------------------------------------------------------------------------
   Custom visual: el <input> nativo va sr-only (sigue siendo accesible y
   recibe focus); un <span> dibuja el cuadrado y un <svg> el tick. Toggle
   visual basado en `peer-checked:`. Más predecible que estilizar el input
   con appearance-none entre navegadores.
   ========================================================================== */

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      label,
      children,
      error,
      hint,
      id: idProp,
      required,
      disabled,
      className,
      labelClassName,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId()
    const id = idProp ?? `chk-${generatedId}`
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    const describedBy =
      [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined

    const labelColorClass = error ? 'text-alert' : 'text-fg'

    // Borde reposo: gris fino. Cuando el peer (input) está :checked, pasa a fg.
    // Estado error: borde alert siempre.
    const boxBorderClass = error
      ? 'border-alert'
      : 'border-fg/30 peer-checked:border-fg peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-fg'

    return (
      <div className={`w-full ${className ?? ''}`}>
        <label
          htmlFor={id}
          className={`flex items-start gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          {/* Wrapper relativo del checkbox visual */}
          <span className="relative flex size-5 shrink-0 items-center justify-center">
            {/* Input nativo — sr-only, sigue accesible y recibe focus */}
            <input
              ref={ref}
              id={id}
              type="checkbox"
              required={required}
              disabled={disabled}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              className="peer sr-only"
              {...rest}
            />
            {/* Cuadrado visible — borde + transición */}
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 border bg-transparent transition-colors duration-fast ease-expo ${boxBorderClass}`}
            />
            {/* Tick SVG — fade-in + scale al hacer :checked en el peer */}
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="pointer-events-none relative size-4 text-fg opacity-0 scale-50 transition-[opacity,transform] duration-fast ease-expo peer-checked:opacity-100 peer-checked:scale-100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 10.5l4 4 8-9" />
            </svg>
          </span>

          {/* Label text */}
          <span
            className={labelClassName ?? `font-mono text-body-sm leading-snug ${labelColorClass}`}
          >
            {children ?? label}
            {required && !children && (
              <sup aria-hidden="true" className="ml-0.5 text-fg/60 text-[0.6em] align-super">
                *
              </sup>
            )}
          </span>
        </label>

        {/* Mensajes bajo el checkbox, alineados al texto (margin-left compensa el cuadro + gap) */}
        {(hint || error) && (
          <div className="ml-[32px] mt-1 font-mono text-micro">
            {hint && !error && (
              <p id={hintId} className="text-fg/60">
                {hint}
              </p>
            )}
            {error && (
              <p id={errorId} role="alert" className="text-alert">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'
