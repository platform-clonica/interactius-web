'use client'

import type { ReactNode } from 'react'

interface IntroTextProps {
  revealed: boolean
  children: ReactNode
}

/**
 * IntroText — párrafo en Mono 24px con reveal fade-up simple.
 *
 * No usa SplitType — el texto son 3-4 frases cortas en mono, el line-mask
 * no aporta suficiente impacto visual para justificar el coste. Usa la
 * primitiva .reveal-fade-up de globals.css en su lugar.
 */
export function IntroText({ revealed, children }: IntroTextProps) {
  return (
    <p
      className={`
        font-mono text-body text-fg
        max-w-[32ch]
        reveal-fade-up
        ${revealed ? 'is-revealed' : ''}
      `}
    >
      {children}
    </p>
  )
}
