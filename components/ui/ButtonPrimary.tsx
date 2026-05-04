import { forwardRef, type ElementType, type ComponentPropsWithRef } from 'react'

/* ==========================================================================
   Types
   ========================================================================== */

type ButtonVariant = 'light' | 'dark' | 'outline'

interface ButtonOwnProps {
  variant?: ButtonVariant
  underline?: boolean
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

type ButtonPrimaryProps<T extends ElementType = 'button'> = ButtonOwnProps & {
  as?: T
} & Omit<ComponentPropsWithRef<T>, keyof ButtonOwnProps | 'as'>

/* ==========================================================================
   Variant styles
   ========================================================================== */

const VARIANT_CLASSES: Record<ButtonVariant, { base: string; text: string }> = {
  light: {
    base: 'bg-pure-white hover:bg-dark',
    text: 'text-dark hover:text-pure-white',
  },
  dark: {
    base: 'bg-dark hover:bg-pure-white',
    text: 'text-pure-white hover:text-dark',
  },
  outline: {
    base: 'bg-pure-white border border-dark hover:bg-dark',
    text: 'text-dark hover:text-pure-white',
  },
}

/* ==========================================================================
   Component
   ========================================================================== */

function ButtonPrimaryComponent<T extends ElementType = 'button'>(
  {
    as,
    variant = 'light',
    underline = false,
    disabled = false,
    className = '',
    children,
    ...rest
  }: ButtonPrimaryProps<T>,
  ref: React.Ref<Element>,
) {
  const Tag = (as ?? 'button') as ElementType
  const styles = VARIANT_CLASSES[variant]

  const defaultType =
    Tag === 'button' && !('type' in rest) ? { type: 'button' as const } : {}

  return (
    <Tag
      ref={ref as React.Ref<never>}
      aria-disabled={disabled || undefined}
      {...(Tag === 'button' ? { disabled } : {})}
      {...defaultType}
      {...rest}
      className={`
        inline-flex items-center justify-center
        px-4 py-[6px]
        font-mono text-body-sm leading-none
        ${styles.base} ${styles.text}
        ${underline ? 'underline underline-offset-4' : ''}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </Tag>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ButtonPrimary = (forwardRef(ButtonPrimaryComponent as any) as unknown) as <
  T extends ElementType = 'button',
>(
  props: ButtonPrimaryProps<T> & { ref?: React.Ref<Element> },
) => React.ReactElement | null
