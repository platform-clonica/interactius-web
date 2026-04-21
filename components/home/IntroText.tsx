import type { ReactNode } from 'react'

interface IntroTextProps {
  children: ReactNode
}

export function IntroText({ children }: IntroTextProps) {
  return (
    <p className="font-mono text-body text-fg max-w-[32ch]">
      {children}
    </p>
  )
}
