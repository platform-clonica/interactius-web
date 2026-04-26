'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

/**
 * PortfolioOpeningImage — imagen de apertura del bloque "Nuestros clientes".
 *
 * Posicionamiento: empieza en el borde izquierdo del viewport (sin padding) y
 * termina en el borde derecho de la columna 11 del grid 12 (deja la columna
 * 12 + grid-margin libre a la derecha). Para conseguir el "bleed" izquierdo
 * la card vive en el grid 12 (col-start-1 col-span-11) y se aplica un
 * margin-left negativo igual al `section-inner-content-left` calculado
 * dinámicamente con max():
 *   - Viewport ≤ grid-max + 2·grid-margin → margin-left = -grid-margin
 *   - Viewport > grid-max + 2·grid-margin → margin-left = -((100vw - grid-max)/2)
 *
 * Reveal lateral canónico (clip-path right→left) al entrar en viewport.
 */
export function PortfolioOpeningImage() {
  const ref = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      if (reduced) {
        gsap.set(el, { clipPath: 'inset(0 0% 0 0)' })
        return
      }

      gsap.set(el, { clipPath: 'inset(0 100% 0 0)' })
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(el, {
            clipPath: 'inset(0 0% 0 0)',
            duration: 0.9,
            ease: 'cubic-bezier(.16,1,.3,1)',
          })
        },
      })

      cleanupRef.current = () => st.kill()
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <div
      ref={ref}
      className="col-start-1 col-span-11 relative overflow-hidden"
      style={{
        marginLeft:
          'calc(-1 * max(var(--grid-margin), (100vw - var(--grid-max-w)) / 2))',
        aspectRatio: '3 / 1',
        clipPath: 'inset(0 100% 0 0)',
      }}
    >
      <Image
        src="/home/portfolio-introimg.jpg"
        alt=""
        fill
        sizes="(min-width: 1024px) 92vw, 100vw"
        className="object-cover object-center"
        aria-hidden
      />
    </div>
  )
}
