'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

/* DossierCoatReveal — la ficha del abrigo se escribe sola.

   La imagen está partida justo por la mitad: a la izquierda lo que ve una
   persona, a la derecha lo que lee un agente. Medido sobre el archivo, la
   costura cae en el píxel 960 de 1920, es decir el 50 % exacto, y el fondo del
   lado oscuro es #1D1C1B.

   La animación tapa ese lado derecho con un rectángulo del mismo color y lo
   va retirando de arriba abajo. El efecto es que el código aparece línea a
   línea mientras el trazo del abrigo se va dibujando desde el cuello hacia
   abajo, que es lo que pidió Martina. Una línea clara viaja en el frente del
   barrido para que se lea como algo que se está escribiendo y no como una
   cortina que sube.

   POR QUÉ EL TAPÓN SE MONTA EN CLIENTE
   El rectángulo oculta medio dibujo. Si se pintara en servidor y el JavaScript
   fallara o tardara, quien entrara vería la imagen censurada para siempre. Al
   montarlo solo después de hidratar, el peor caso es ver la imagen completa
   sin animación, que es el comportamiento correcto.

   Con `prefers-reduced-motion` no se monta nada. */

const COSTURA = '50%'
const OSCURO = '#1d1c1b'

export function DossierCoatReveal({
  src,
  alt,
  caption,
  credit,
}: {
  src: string
  alt: string
  caption: string
  credit?: string
}) {
  const marcoRef = useRef<HTMLDivElement>(null)
  const tapaRef = useRef<HTMLDivElement>(null)
  const lineaRef = useRef<HTMLDivElement>(null)
  const limpiarRef = useRef<(() => void) | null>(null)

  /* Arranca en false: en el primer render (servidor y primera pasada de
     cliente) no existe la tapa y la imagen se ve entera. */
  const [animar, setAnimar] = useState(false)

  useEffect(() => {
    if (getReducedMotion()) return
    setAnimar(true)
  }, [])

  useEffect(() => {
    if (!animar) return
    const marco = marcoRef.current
    const tapa = tapaRef.current
    const linea = lineaRef.current
    if (!marco || !tapa || !linea) return

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      gsap.registerPlugin(ScrollTrigger)

      gsap.set(tapa, { clipPath: 'inset(0% 0 0 0)' })
      gsap.set(linea, { top: '0%', opacity: 0 })

      const st = ScrollTrigger.create({
        trigger: marco,
        start: 'top 70%',
        once: true,
        onEnter: () => {
          const tl = gsap.timeline()
          tl.to(linea, { opacity: 1, duration: 0.25 })
            /* 2,4 s: lo bastante lento para leer el código mientras aparece,
               lo bastante rápido para no retener a quien ya lo ha visto. */
            .to(tapa, { clipPath: 'inset(100% 0 0 0)', duration: 2.4, ease: 'power1.inOut' }, 0)
            .to(linea, { top: '100%', duration: 2.4, ease: 'power1.inOut' }, 0)
            .to(linea, { opacity: 0, duration: 0.4 }, 2.1)
        },
      })

      limpiarRef.current = () => st.kill()
    })()

    return () => limpiarRef.current?.()
  }, [animar])

  return (
    <figure>
      <div ref={marcoRef} className="relative w-full overflow-hidden border border-fg/15">
        <div className="relative aspect-[16/9] w-full">
          <Image src={src} alt={alt} fill sizes="100vw" className="object-cover object-center" />

          {animar ? (
            <>
              {/* La tapa: mismo color que el fondo del lado oscuro, así que
                  mientras cubre no se distingue del propio dibujo. */}
              <div
                ref={tapaRef}
                aria-hidden="true"
                className="absolute inset-y-0 right-0"
                style={{ left: COSTURA, background: OSCURO }}
              />
              {/* El frente del barrido. */}
              <div
                ref={lineaRef}
                aria-hidden="true"
                className="pointer-events-none absolute h-px"
                style={{
                  left: COSTURA,
                  right: 0,
                  background:
                    'linear-gradient(to right, rgba(245,242,237,0), rgba(245,242,237,0.75), rgba(245,242,237,0))',
                }}
              />
            </>
          ) : null}
        </div>
      </div>

      <figcaption className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-micro leading-[1.5] text-fg/60">
        <span>{caption}</span>
        {credit ? (
          <span className="text-caption uppercase tracking-[0.14em] text-fg/40">{credit}</span>
        ) : null}
      </figcaption>
    </figure>
  )
}
