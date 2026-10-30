'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

/* DossierRule — el filete con rótulo que separa secciones del dossier.

   Es el recurso que da el carácter de periódico sin añadir ornamento: una
   línea de 1px y una etiqueta en mono pequeño, como los rótulos de sección de
   un diario. Todo el dossier lo usa, así que el ritmo vertical queda igual en
   todas las secciones sin repetir medidas a mano.

   La línea se traza de izquierda a derecha al llegar a ella. Es el gesto que
   más dice "aquí empieza otra cosa" gastando menos: no mueve nada de sitio,
   solo dibuja. Va con `scaleX` y no con `width` para que el navegador lo
   resuelva en la capa de composición, sin recalcular la página en cada paso.

   Sin JavaScript o con `prefers-reduced-motion`, la línea aparece entera. */
export function DossierRule({ label, children }: { label: string; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [trazada, setTrazada] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (getReducedMotion()) {
      setTrazada(true)
      return
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return
        obs.disconnect()
        setTrazada(true)
      },
      { threshold: 0, rootMargin: '0px 0px -12% 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref}>
      <div
        aria-hidden="true"
        className="h-px w-full origin-left bg-fg/25 transition-transform duration-[900ms] ease-out motion-reduce:transition-none"
        style={{ transform: `scaleX(${trazada ? 1 : 0})` }}
      />
      <div className="flex items-baseline gap-4 pt-3">
        <span className="whitespace-nowrap font-mono text-caption uppercase tracking-[0.14em] text-fg/60">
          {label}
        </span>
        {children ? (
          <span className="whitespace-nowrap font-mono text-caption text-fg/40">{children}</span>
        ) : null}
      </div>
    </div>
  )
}
