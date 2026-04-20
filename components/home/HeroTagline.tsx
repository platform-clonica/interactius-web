'use client'

import { useEffect, useRef, useState } from 'react'

import { useReducedMotion } from '@/components/motion/useReducedMotion'

/**
 * HeroTagline — h1 del hero con revelación línea a línea.
 *
 * Técnica (A04):
 * 1. SplitType (dynamic import) divide el texto en líneas — cada una wrapped
 *    en <div class="line"> por la librería.
 * 2. Envolvemos cada línea en un contenedor extra `.line-mask` con
 *    overflow:hidden (primitiva del globals.css).
 * 3. El hijo directo anima transform: translateY(100%) → translateY(0)
 *    con stagger de 80ms por línea.
 *
 * Trigger: onMount, delay 200ms tras el primer paint del hero.
 * Re-split en resize para recalcular breakpoints.
 * Reduced-motion: texto visible, sin animación.
 */
export function HeroTagline() {
  const ref = useRef<HTMLHeadingElement>(null)
  const [revealed, setRevealed] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let splitInstance: { revert: () => void } | null = null
    let resizeRaf = 0
    let resizeTimer = 0

    // Import dinámico de split-type — cliente-only.
    const init = async () => {
      const SplitType = (await import('split-type')).default

      const doSplit = () => {
        // Limpia split previo si existe (caso de re-split tras resize).
        if (splitInstance) splitInstance.revert()

        splitInstance = new SplitType(el, {
          types: 'lines',
          tagName: 'span',
        })

        // Para cada .line generada por SplitType, la envolvemos en
        // un span con .line-mask y le inyectamos un índice para el stagger.
        const lines = el.querySelectorAll<HTMLElement>(':scope > .line')
        lines.forEach((line, i) => {
          // El contenido ya es la línea; necesitamos:
          //   <span class="line-mask"><span class="line-inner">...contenido...</span></span>
          // SplitType nos da: <span class="line">...contenido...</span>
          // Lo transformamos añadiendo clase mask al span existente y
          // wrappeando sus children en un inner span.
          line.classList.add('line-mask')
          line.style.setProperty('--i', String(i))

          // Si ya tiene wrapper inner, no re-wrappear (re-split case).
          if (line.querySelector(':scope > .line-inner')) return

          const inner = document.createElement('span')
          inner.className = 'line-inner'
          while (line.firstChild) inner.appendChild(line.firstChild)
          line.appendChild(inner)
        })

        // Trigger reveal tras el primer paint.
        if (!reduced) {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => setRevealed(true))
          })
        } else {
          setRevealed(true)
        }
      }

      doSplit()

      // Re-split en resize con debounce.
      const handleResize = () => {
        cancelAnimationFrame(resizeRaf)
        window.clearTimeout(resizeTimer)
        resizeTimer = window.setTimeout(() => {
          resizeRaf = requestAnimationFrame(doSplit)
        }, 150)
      }
      window.addEventListener('resize', handleResize, { passive: true })

      return () => {
        window.removeEventListener('resize', handleResize)
        cancelAnimationFrame(resizeRaf)
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
  }, [reduced])

  return (
    <div className="pointer-events-none absolute inset-0 z-content flex items-center">
      <div className="section-inner pointer-events-auto">
        <h1
          ref={ref}
          data-revealed={revealed}
          className="
            hero-tagline
            max-w-[20ch] font-serif text-section font-light text-fg
            md:text-section
            lg:max-w-[22ch]
          "
        >
          Hay un lugar entre el análisis y la <em>intuición</em>, entre la
          estrategia y las personas, entre lo que los datos dicen y lo que las
          organizaciones sienten.
        </h1>
      </div>
    </div>
  )
}
