'use client'

import { forwardRef, type ElementType, type ComponentPropsWithRef } from 'react'
import { motion, type Variants } from 'framer-motion'

import { useReducedMotion } from '@/components/motion/useReducedMotion'

/* ==========================================================================
   Types — polymorphic component pattern
   ========================================================================== */

type ButtonVariant = 'light' | 'dark' | 'outline'

interface ButtonOwnProps {
  variant?: ButtonVariant
  /** Activa subrayado en el texto. Off por defecto — el relleno ya distingue. */
  underline?: boolean
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Tipos polymorphic — prop `as` determina el tag o componente destino.
 * Inferimos los props del destino y los mezclamos con los propios,
 * asegurando que props como `href` (cuando as={Link} o as="a") sean
 * required si el destino los requiere.
 */
type ButtonPrimaryProps<T extends ElementType = 'button'> = ButtonOwnProps & {
  as?: T
} & Omit<ComponentPropsWithRef<T>, keyof ButtonOwnProps | 'as'>

/* ==========================================================================
   Variants — estilos por variant
   ========================================================================== */

const VARIANT_CLASSES: Record<
  ButtonVariant,
  { base: string; text: string; overlay: string; textInverted: string }
> = {
  light: {
    base: 'bg-pure-white',
    text: 'text-dark',
    overlay: 'bg-dark',
    textInverted: 'text-pure-white',
  },
  dark: {
    base: 'bg-dark',
    text: 'text-pure-white',
    overlay: 'bg-pure-white',
    textInverted: 'text-dark',
  },
  outline: {
    base: 'bg-transparent border border-dark',
    text: 'text-dark',
    overlay: 'bg-dark',
    textInverted: 'text-pure-white',
  },
}

/* ==========================================================================
   Animation variants
   ========================================================================== */

const overlayVariants: Variants = {
  rest: {
    clipPath: 'inset(0 100% 0 0)',
  },
  hover: {
    clipPath: 'inset(0 0% 0 0)',
  },
}

const TRANSITION = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1] as const,
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
  const reduced = useReducedMotion()
  const styles = VARIANT_CLASSES[variant]

  const MotionTag = motion(Tag)

  const transition = reduced ? { duration: 0 } : TRANSITION

  // Si el destino es un <button> nativo y no hay type, asumimos 'button'
  // para evitar que actúe como submit dentro de formularios.
  const defaultType =
    Tag === 'button' && !('type' in rest) ? { type: 'button' as const } : {}

  return (
    <MotionTag
      ref={ref as React.Ref<never>}
      initial="rest"
      animate="rest"
      whileHover={disabled ? 'rest' : 'hover'}
      whileFocus={disabled ? 'rest' : 'hover'}
      aria-disabled={disabled || undefined}
      {...defaultType}
      {...rest}
      className={`
        relative inline-flex items-center justify-center overflow-hidden
        px-4 py-[6px]
        font-mono text-body-sm leading-none
        transition-colors duration-fast ease-expo
        ${styles.base} ${styles.text}
        ${underline ? 'underline underline-offset-4' : ''}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* Texto base — visible siempre, colorado según variant */}
      <span className="relative z-[2]">{children}</span>

      {/* Overlay animado — el clip-path barre de izq→dcha en hover */}
      <motion.span
        aria-hidden="true"
        variants={overlayVariants}
        transition={transition}
        className={`absolute inset-0 z-[1] ${styles.overlay}`}
        style={{ willChange: 'clip-path' }}
      />

      {/* Texto invertido — mismo contenido, color contrario, enmascarado
          por el mismo clip-path para sincronizar con el overlay */}
      <motion.span
        aria-hidden="true"
        variants={overlayVariants}
        transition={transition}
        className={`
          absolute inset-0 z-[3] flex items-center justify-center
          px-4 py-[6px]
          font-mono text-body-sm leading-none
          ${styles.textInverted}
          ${underline ? 'underline underline-offset-4' : ''}
        `}
        style={{ willChange: 'clip-path' }}
      >
        {children}
      </motion.span>
    </MotionTag>
  )
}

export const ButtonPrimary = forwardRef(ButtonPrimaryComponent) as <
  T extends ElementType = 'button',
>(
  props: ButtonPrimaryProps<T> & { ref?: React.Ref<Element> },
) => React.ReactElement | null
