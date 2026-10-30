'use client'

import { useEffect, useRef, type ReactNode } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

/* DossierReveal — entrada por scroll, con el mismo idioma que el resto de la web.

   Copia los valores que ya usan CapacityIntroAnim e IdentidadValores para que
   el dossier no se mueva distinto al resto del sitio: desplazamiento vertical
   de 50 px, `power4.out`, un segundo de duración y escalonado entre hermanos.

   Qué se anima: los hijos directos del bloque. Así una sección entera entra
   escalonada (rótulo, luego titular, luego texto) sin tener que envolver cada
   elemento a mano.

   Accesibilidad: con `prefers-reduced-motion` activo no se instala nada y el
   contenido queda visible desde el primer paint. El estado inicial se pone en
   el efecto, no en CSS, para que quien llegue sin JS lo vea todo igualmente.

   `once: true`: el dossier es largo y una animación que se repite al subir y
   bajar cansa más de lo que aporta. */
export function DossierReveal({
  children,
  className = '',
  stagger = 0.07,
  delay = 0,
  y = 50,
}: {
  children: ReactNode
  className?: string
  /** Separación entre la entrada de un hijo y la del siguiente, en segundos. */
  stagger?: number
  delay?: number
  /** Desplazamiento vertical inicial, en píxeles. */
  y?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (getReducedMotion()) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      gsap.registerPlugin(ScrollTrigger)

      const hijos = Array.from(el.children)
      if (!hijos.length) return

      gsap.set(hijos, { y, opacity: 0 })

      const st = ScrollTrigger.create({
        trigger: el,
        // 85 % del viewport: el bloque ya se ve cuando arranca, así que la
        // animación acompaña la lectura en vez de hacerse esperar.
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(hijos, {
            y: 0,
            opacity: 1,
            duration: 1,
            delay,
            ease: 'power4.out',
            stagger,
          })
        },
      })

      cleanupRef.current = () => {
        st.kill()
        gsap.set(hijos, { clearProps: 'all' })
      }
    })()

    return () => cleanupRef.current?.()
  }, [stagger, delay, y])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
