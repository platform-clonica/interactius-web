'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'

import { getReducedMotion } from '@/components/motion/useReducedMotion'

/* ==========================================================================
   CapacityIntroAnim — layout + GSAP ScrollTrigger (sección 2/4)
   --------------------------------------------------------------------------
   La imagen grande (Rectangle 4085) asoma por debajo del hero y sube con el
   scroll normal. Cuando su borde inferior cruza el top del viewport, se
   activa un clip-path de salida:

     imagen: inset(0 0 0 0%) → inset(0 0 0 100%)  [wipe de salida a la dcha]
     0.9s, power3.inOut

   onComplete → SplitType line-mask del statement:
     lines: {y:50, opacity:0}→default, 1s, power4.out, stagger:0.07s
     clients: opacity 0→1, 0.6s, delay:0.3s

   Si reduced-motion: imagen oculta directamente, texto visible.
   ========================================================================== */

interface CapacityIntroAnimProps {
  statement: string
  clients?: string
  imageSrc: string
  imageAlt?: string
}

/** Parsea el statement dividido por ' / ' y alterna énfasis itálico. */
function parseStatement(text: string): { part: string; emphasized: boolean }[] {
  return text.split(/\s*\/\s*/).map((part, i) => ({
    part,
    emphasized: i % 2 === 1,
  }))
}

export function CapacityIntroAnim({
  statement,
  clients,
  imageSrc,
  imageAlt = '',
}: CapacityIntroAnimProps) {
  const imageRef     = useRef<HTMLDivElement>(null)
  const statementRef = useRef<HTMLParagraphElement>(null)
  const clientsRef   = useRef<HTMLParagraphElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef   = useRef<(() => void) | null>(null)

  const segments = parseStatement(statement)

  useEffect(() => {
    const imageEl     = imageRef.current
    const statementEl = statementRef.current
    if (!imageEl || !statementEl) return

    void (async () => {
      const [{ default: gsap }, { default: SplitType }, { ScrollTrigger }] =
        await Promise.all([
          import('gsap'),
          import('split-type'),
          import('gsap/ScrollTrigger'),
        ])

      gsap.registerPlugin(ScrollTrigger)

      const reduced = getReducedMotion()
      const clientsEl = clientsRef.current

      if (reduced) {
        gsap.set(imageEl, { display: 'none' })
        gsap.set([statementEl, clientsEl].filter(Boolean), { clearProps: 'all' })
        return
      }

      // ── SplitType ─────────────────────────────────────────────────────────
      const statementSplit = new SplitType(statementEl, { types: 'lines' })

      // ── Estado inicial ─────────────────────────────────────────────────────
      gsap.set(statementSplit.lines ?? [], { y: 50, opacity: 0 })
      if (clientsEl) gsap.set(clientsEl, { opacity: 0 })

      // ── Función que revela el texto (se llama desde onComplete del wipe) ──
      const revealStatement = () => {
        gsap.to(statementSplit.lines ?? [], {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power4.out',
          stagger: 0.07,
        })
        if (clientsEl) {
          gsap.to(clientsEl, { opacity: 1, duration: 0.6, delay: 0.3 })
        }
      }

      // ── ScrollTrigger: cuando imagen sale por arriba → wipe de salida ────
      ScrollTrigger.create({
        trigger: imageEl,
        start: 'bottom top',   // borde inferior de imagen toca el top del viewport
        once: true,
        onEnter: () => {
          gsap.to(imageEl, {
            clipPath: 'inset(0 0 0 100%)',
            duration: 0.9,
            ease: 'power4.inOut',
            onComplete: revealStatement,
          })
        },
      })

      cleanupRef.current = () => {
        statementSplit.revert()
        ScrollTrigger.getAll().forEach((st) => {
          if (st.vars.trigger === imageEl) st.kill()
        })
      }
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section className="w-full overflow-hidden">
      {/* Imagen — asoma por la parte inferior del hero, tiene overflow visible en el padre */}
      <div
        ref={imageRef}
        className="relative w-full h-[60vh] lg:h-[80vh]"
        style={{ clipPath: 'inset(0 0 0 0%)' }}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Texto del statement */}
      <div className="section-inner py-section">
        <p
          ref={statementRef}
          className="font-serif font-light text-fg text-title max-w-[880px]"
        >
          {segments.map(({ part, emphasized }, i) =>
            emphasized ? (
              <em key={i} style={{ fontStyle: 'italic' }}>
                {part}
              </em>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </p>

        {clients && (
          <p
            ref={clientsRef}
            className="mt-12 font-mono text-micro text-fg/40 uppercase tracking-widest"
          >
            {clients}
          </p>
        )}
      </div>
    </section>
  )
}
