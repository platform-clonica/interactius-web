'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

/* DossierParallaxImage — una foto que se desplaza despacio mientras se baja.

   Martina pedía que la página no se sintiera estática al hacer scroll. Las
   entradas por bloque ya existen, pero son de un solo disparo: una vez han
   ocurrido, el resto del recorrido vuelve a quedarse quieto. Esto añade
   movimiento continuo, que es lo que falta.

   Cómo: la imagen se monta un 12 % más alta que su marco y recorre esa holgura
   de abajo arriba a lo largo del scroll, atada con `scrub`. El marco tiene
   `overflow-hidden`, así que nunca asoma un borde vacío.

   El recorrido es corto a propósito (±6 % del alto). Un parallax largo se nota
   y compite con el texto, que es lo que hay que leer aquí.

   Sin JavaScript o con `prefers-reduced-motion`, la imagen queda centrada y
   quieta: la holgura existe igual, así que no cambia el encuadre. */
export function DossierParallaxImage({
  src,
  alt,
  sizes,
  ratio,
  className = '',
  conHover = false,
}: {
  src: string
  alt: string
  sizes: string
  /** Clase de proporción del marco, por ejemplo `aspect-[16/7]`. */
  ratio: string
  className?: string
  /** Añade el leve acercamiento al pasar por encima que usa el resto de la web. */
  conHover?: boolean
}) {
  const marcoRef = useRef<HTMLDivElement>(null)
  const capaRef = useRef<HTMLDivElement>(null)
  const limpiarRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const marco = marcoRef.current
    const capa = capaRef.current
    if (!marco || !capa) return
    if (getReducedMotion()) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      gsap.registerPlugin(ScrollTrigger)

      const tween = gsap.fromTo(
        capa,
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: marco,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      )

      limpiarRef.current = () => {
        tween.scrollTrigger?.kill()
        tween.kill()
        gsap.set(capa, { clearProps: 'all' })
      }
    })()

    return () => limpiarRef.current?.()
  }, [])

  return (
    <div ref={marcoRef} className={`relative w-full overflow-hidden ${ratio} ${className}`.trim()}>
      {/* La capa sobresale por arriba y por abajo: es la holgura que recorre. */}
      <div ref={capaRef} className="absolute inset-x-0 -top-[6%] h-[112%]">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={`object-cover object-center ${
            conHover ? 'transition-transform duration-500 group-hover:scale-[1.02]' : ''
          }`}
        />
      </div>
    </div>
  )
}
