import type { ReactNode } from 'react'

interface IntroQuoteProps {
  children: ReactNode
}

export function IntroQuote({ children }: IntroQuoteProps) {
  return (
    <blockquote
      className="max-w-[16ch] text-center font-serif text-title font-light text-fg"
    >
      {children}
    </blockquote>
  )
}
