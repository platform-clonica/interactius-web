import {
  forwardRef,
  type ElementType,
  type ComponentPropsWithRef,
} from 'react'

/* ==========================================================================
   Types
   ========================================================================== */

type ButtonVariant = 'light' | 'dark'

interface ButtonOwnProps {
  variant?: ButtonVariant
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

type ButtonSecondaryProps<T extends ElementType = 'button'> = ButtonOwnProps & {
  as?: T
} & Omit<ComponentPropsWithRef<T>, keyof ButtonOwnProps | 'as'>

/* ==========================================================================
   Variant styles
   ========================================================================== */

const VARIANT_CLASSES: Record<ButtonVariant, { text: string; line: string }> = {
  light: {
    text: 'text-dark',
    line: 'border-dark',
  },
  dark: {
    text: 'text-pure-white',
    line: 'border-pure-white',
  },
}

/* ==========================================================================
   Component
   ========================================================================== */

function ButtonSecondaryComponent<T extends ElementType = 'button'>(
  {
    as,
    variant = 'light',
    disabled = false,
    className = '',
    children,
    ...rest
  }: ButtonSecondaryProps<T>,
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
      {...defaultType}
      {...rest}
      className={`
        relative inline-flex items-center justify-center
        px-1 py-3
        font-mono text-body-sm leading-none
        border-b ${styles.line} ${styles.text}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </Tag>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ButtonSecondary = (forwardRef(ButtonSecondaryComponent as any) as unknown) as <
  T extends ElementType = 'button',
>(
  props: ButtonSecondaryProps<T> & { ref?: React.Ref<Element> },
) => React.ReactElement | null
