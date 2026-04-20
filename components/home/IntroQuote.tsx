'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

import { useReducedMotion } from '@/components/motion/useReducedMotion'

interface IntroQuoteProps {
  revealed: boolean
  children: ReactNode
}

/**
 * IntroQuote — cita Serif Light 42px con line-mask reveal (A06).
 *
 * Técnica similar a HeroTagline: SplitType dynamic import, cada línea
 * wrapped en .line-mask, animación CSS por --i stagger.
 *
 * La revelación se dispara cuando `revealed` pasa a true (controlado por
 * IntroScroll según la fase).
 */
export function IntroQuote({ revealed, children }: IntroQuoteProps) {
  const ref = useRef<HTMLQuoteElement>(null)
  const [splitReady, setSplitReady] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let splitInstance: { revert: () => void } | null = null
    let resizeTimer = 0

    const init = async () => {
      const SplitType = (await import('split-type')).default

      const doSplit = () => {
        if (splitInstance) splitInstance.revert()

        splitInstance = new SplitType(el, {
          types: 'lines',
          tagName: 'span',
        })

        const lines = el.querySelectorAll<HTMLElement>(':scope > .line')
        lines.forEach((line, i) => {
          line.classList.add('line-mask')
          line.style.setProperty('--i', String(i))

          if (line.querySelector(':scope > .line-inner')) return

          const inner = document.createElement('span')
          inner.className = 'line-inner'
          while (line.firstChild) inner.appendChild(line.firstChild)
          line.appendChild(inner)
        })

        setSplitReady(true)
      }

      doSplit()

      const handleResize = () => {
        window.clearTimeout(resizeTimer)
        resizeTimer = window.setTimeout(doSplit, 150)
      }
      window.addEventListener('resize', handleResize, { passive: true })

      return () => {
        window.removeEventListener('resize', handleResize)
        window.clearTimeout(resizeTimer)
        splitInstance?.revert()
      }
    }

    let cleanup: (() => void) | void
    init().then((c) => {
      cleanup = c
    })

    return () => {
      cleanup?.()
    }
  }, [])

  // En reduced-motion pasamos directo a estado revealed sin esperar split.
  const isRevealed = reduced ? revealed : splitReady && revealed

  return (
    <blockquote
      ref={ref}
      data-revealed={isRevealed}
      className="
        hero-tagline
        max-w-[16ch] text-center
        font-serif text-section font-light text-fg
        lg:text-title
      "
    >
      {children}
    </blockquote>
  )
}
