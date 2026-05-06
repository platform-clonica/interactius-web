'use client'

import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref,
} from 'react'

/* ==========================================================================
   Types
   ========================================================================== */


interface BaseProps {
  /**
   * Texto del label (siempre visible, floating según estado).
   * Debe ser descriptivo aunque sea corto.
   */
  label: string
  /**
   * Identificador único. Si no se pasa, se genera con useId.
   * Necesario para htmlFor/id pair.
   */
  id?: string
  /**
   * Mensaje de error. Si está presente el field pasa a estado error.
   */
  error?: string
  /**
   * Texto de ayuda (hint) bajo el field. No confundir con error.
   */
  hint?: string
  /**
   * Nombre del campo — imprescindible para react-hook-form.
   */
  name: string
  /**
   * Si `true`, el field es required y se añade asterisco al label.
   */
  required?: boolean
  /**
   * Auto-grow del textarea. Solo aplica cuando as='textarea'.
   */
  autoResize?: boolean
  disabled?: boolean
  className?: string
  /**
   * Children solo se usa cuando as='select' para pasar <option>s.
   */
  children?: ReactNode
}

type InputProps = BaseProps & {
  as?: 'input'
} & Omit<ComponentPropsWithoutRef<'input'>, keyof BaseProps | 'as' | 'placeholder'>

type TextareaProps = BaseProps & {
  as: 'textarea'
} & Omit<
  ComponentPropsWithoutRef<'textarea'>,
  keyof BaseProps | 'as' | 'placeholder'
>

type SelectProps = BaseProps & {
  as: 'select'
} & Omit<ComponentPropsWithoutRef<'select'>, keyof BaseProps | 'as'>

type FormFieldProps = InputProps | TextareaProps | SelectProps

/* ==========================================================================
   Component
   ========================================================================== */

function FormFieldComponent(
  props: FormFieldProps,
  ref: Ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
) {
  const {
    as = 'input',
    label,
    id: idProp,
    error,
    hint,
    name,
    required,
    disabled,
    autoResize,
    className,
    children,
    ...rest
  } = props

  const generatedId = useId()
  const id = idProp ?? `field-${generatedId}`
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy =
    [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined

  // Clases compartidas del control (input/textarea/select).
  // outline-none por defecto para no romper la estética con mouse;
  // focus-visible reactiva un outline fino solo cuando el foco viene por
  // teclado (WCAG 2.4.7 Focus Visible). offset-2 deja respiración respecto
  // a la línea inferior del field.
  const controlBase = `
    peer
    w-full bg-transparent
    font-mono text-body-sm text-fg
    placeholder:text-transparent
    outline-none
    focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-fg
    disabled:cursor-not-allowed
    pt-6 pb-2
  `

  // Color del border según estado
  const borderColorClass = error
    ? 'border-alert'
    : 'border-dark/40 focus-within:border-dark'

  // Clases del label (floating). Canónico: text-fg/40 mientras no hay focus
  // ni contenido (estado idle), text-fg al focus o cuando hay texto.
  const labelBase = `
    pointer-events-none absolute left-0 top-5
    font-mono text-body-sm text-fg/40
    transition-all duration-fast ease-expo
    peer-focus:top-0 peer-focus:text-micro peer-focus:text-fg
    peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-micro peer-[:not(:placeholder-shown)]:text-fg
  `

  const wrapperClass = `
    relative w-full
    border-b transition-colors duration-fast ease-expo
    ${borderColorClass}
    ${disabled ? 'opacity-50' : ''}
    ${className ?? ''}
  `

  const renderLabel = () => (
    <label htmlFor={id} className={labelBase}>
      {label}
      {required && (
        <sup aria-hidden="true" className="ml-0.5 text-fg/60 text-[0.6em] align-super">
          *
        </sup>
      )}
    </label>
  )

  const renderMessages = () => (
    <>
      {hint && !error && (
        <p
          id={hintId}
          className="mt-2 font-mono text-micro text-fg/60"
        >
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 font-mono text-micro text-alert"
        >
          {error}
        </p>
      )}
    </>
  )

  if (as === 'textarea') {
    const textareaProps = rest as ComponentPropsWithoutRef<'textarea'>
    return (
      <div className={wrapperClass}>
        <textarea
          ref={ref as Ref<HTMLTextAreaElement>}
          id={id}
          name={name}
          placeholder=" "
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onInput={
            autoResize
              ? (e) => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = `${el.scrollHeight}px`
                }
              : undefined
          }
          className={`${controlBase} resize-none min-h-[120px]`}
          {...textareaProps}
        />
        {renderLabel()}
        {renderMessages()}
      </div>
    )
  }

  if (as === 'select') {
    const selectProps = rest as ComponentPropsWithoutRef<'select'>
    return (
      <div className={wrapperClass}>
        <select
          ref={ref as Ref<HTMLSelectElement>}
          id={id}
          name={name}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${controlBase} appearance-none pr-8 [&:not(:has(option[value='']:checked))~label]:top-0 [&:not(:has(option[value='']:checked))~label]:text-micro`}
          defaultValue={selectProps.defaultValue ?? ''}
          {...selectProps}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-0 top-5 text-fg/60"
          aria-hidden="true"
        />
        {renderLabel()}
        {renderMessages()}
      </div>
    )
  }

  // Default: input
  const inputProps = rest as ComponentPropsWithoutRef<'input'>
  return (
    <div className={wrapperClass}>
      <input
        ref={ref as Ref<HTMLInputElement>}
        id={id}
        name={name}
        type={inputProps.type ?? 'text'}
        placeholder=" "
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={controlBase}
        {...inputProps}
      />
      {renderLabel()}
      {renderMessages()}
    </div>
  )
}

export const FormField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  FormFieldProps
>(FormFieldComponent)

FormField.displayName = 'FormField'

/* ==========================================================================
   Inline chevron — sin dependencia externa
   ========================================================================== */

function ChevronDown({
  className,
  ...rest
}: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}
