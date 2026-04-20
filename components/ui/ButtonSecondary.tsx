'use client'

import {
  forwardRef,
  useState,
  type ElementType,
  type ComponentPropsWithRef,
} from 'react'
import { motion, type Variants } from 'framer-motion'

import { useReducedMotion } from '@/components/motion/useReducedMotion'

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
   Variants
   ========================================================================== */

const VARIANT_CLASSES: Record<ButtonVariant, { text: string; line: string }> = {
  light: {
    text: 'text-dark',
    line: 'bg-dark',
  },
  dark: {
    text: 'text-pure-white',
    line: 'bg-pure-white',
  },
}

/* ==========================================================================
   Animation — state machine de 3 fases
   --------------------------------------------------------------------------
   idle     : underline visible (scaleX 1), origin left.
   leaving  : hover entró → underline colapsa a scaleX 0 con origin right.
              Parece que sale por la derecha.
   arriving : hover salió → con scaleX=0 (invisible) cambiamos origin a left,
              y animamos scaleX a 1. Parece que entra por la izquierda.
   ========================================================================== */

type Phase = 'idle' | 'leaving' | 'arriving'

const lineVariants: Variants = {
  idle: {
    scaleX: 1,
    transformOrigin: 'left center',
  },
  leaving: {
    scaleX: 0,
    transformOrigin: 'right center',
  },
  arriving: {
    scaleX: 1,
    transformOrigin: 'left center',
  },
}

const TRANSITION = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1] as const,
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
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ...rest
  }: ButtonSecondaryProps<T>,
  ref: React.Ref<Element>,
) {
  const Tag = (as ?? 'button') as ElementType
  const reduced = useReducedMotion()
  const styles = VARIANT_CLASSES[variant]
  const [phase, setPhase] = useState<Phase>('idle')

  const MotionTag = motion(Tag)
  const transition = reduced ? { duration: 0 } : TRANSITION

  const defaultType =
    Tag === 'button' && !('type' in rest) ? { type: 'button' as const } : {}

  const handleEnter = (e: React.MouseEvent) => {
    if (!disabled) setPhase('leaving')
    onMouseEnter?.(e as never)
  }

  const handleLeave = (e: React.MouseEvent) => {
    if (!disabled) setPhase('arriving')
    onMouseLeave?.(e as never)
  }

  const handleFocus = (e: React.FocusEvent) => {
    if (!disabled) setPhase('leaving')
    onFocus?.(e as never)
  }

  const handleBlur = (e: React.FocusEvent) => {
    if (!disabled) setPhase('arriving')
    onBlur?.(e as never)
  }

  return (
    <MotionTag
      ref={ref as React.Ref<never>}
      aria-disabled={disabled || undefined}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...defaultType}
      {...rest}
      className={`
        relative inline-flex items-center justify-center
        px-1 py-3
        font-mono text-body-sm leading-none
        ${styles.text}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
    >
      <span className="relative">{children}</span>

      {/* Underline animado — absolute en bottom del botón */}
      <motion.span
        aria-hidden="true"
        variants={lineVariants}
        animate={phase}
        transition={transition}
        onAnimationComplete={(latest) => {
          // Al completar 'arriving' volvemos a 'idle' para dejar el origin
          // preparado para el siguiente ciclo sin hacer transición visible.
          if (phase === 'arriving') {
            // onAnimationComplete recibe el last-variant-name en Framer v11+
            if (latest === 'arriving') setPhase('idle')
          }
        }}
        className={`absolute left-1 right-1 bottom-[6px] h-[1px] ${styles.line}`}
        style={{ willChange: 'transform' }}
      />
    </MotionTag>
  )
}

export const ButtonSecondary = forwardRef(ButtonSecondaryComponent) as <
  T extends ElementType = 'button',
>(
  props: ButtonSecondaryProps<T> & { ref?: React.Ref<Element> },
) => React.ReactElement | null
