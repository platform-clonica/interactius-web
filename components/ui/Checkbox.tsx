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
}

/* ==========================================================================
   Component
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

    const borderClass = error ? 'border-alert' : 'border-dark'
    const labelColorClass = error ? 'text-alert' : 'text-fg'

    return (
      <div className={`w-full ${className ?? ''}`}>
        <label
          htmlFor={id}
          className={`flex items-start gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          {/* Wrapper relativo del checkbox visual — contiene input nativo + tick */}
          <span className="relative flex size-5 shrink-0 items-center justify-center">
            <input
              ref={ref}
              id={id}
              type="checkbox"
              required={required}
              disabled={disabled}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              className={`
                peer size-5 m-0 cursor-inherit appearance-none
                border ${borderClass} bg-transparent
                transition-colors duration-fast ease-expo
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark
              `}
              {...rest}
            />
            {/* Tick SVG — aparece con opacity+scale cuando el peer está :checked */}
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="
                pointer-events-none absolute size-4
                text-purple
                opacity-0 scale-50
                transition-[opacity,transform] duration-fast ease-expo
                peer-checked:opacity-100 peer-checked:scale-100
              "
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
            className={`font-mono text-body-sm leading-snug ${labelColorClass}`}
          >
            {children ?? label}
            {required && !children && (
              <span aria-hidden="true" className="ml-1 text-fg/60">
                *
              </span>
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
