'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import Image from 'next/image'

import { Logo } from '@/components/ui/Logo'
import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

/* ==========================================================================
   ContactHeroAnim — layout + GSAP entry sequence
   --------------------------------------------------------------------------
   La página entra a través de la PageCurtain global (root layout): mientras
   la cortina hace su uncover (clip-path pliegue a la derecha), aquí dentro
   ya está todo posicionado y los contenidos hacen su stagger de fade-in
   sincronizado con el reveal.

   t=0      Bg fullscreen + cuadro warm-light visibles (sin slide).
   t=560ms  Columna izquierda: heading (SplitType line-mask) + body + email
   t=760ms  Columna derecha:   logo → separador │ → campos → checkbox → enviar

   Los campos del formulario se seleccionan por atributos de datos para que
   ContactForm pueda añadir/quitar campos sin tocar este componente.
   ========================================================================== */

interface ContactHeroAnimProps {
  imageSrc?: string
  imageAlt?: string
  title: string
  body: ReactNode
  altEmailLabel?: string
  altEmail?: string
  children: ReactNode
}

export function ContactHeroAnim({
  imageSrc = '/contacto/bg.jpg',
  imageAlt = '',
  title,
  body,
  altEmailLabel,
  altEmail,
  children,
}: ContactHeroAnimProps) {
  const sectionRef    = useRef<HTMLElement>(null)
  const headingRef    = useRef<HTMLHeadingElement>(null)
  const bodyRef       = useRef<HTMLDivElement>(null)
  const emailRef      = useRef<HTMLParagraphElement>(null)
  const logoRef       = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef    = useRef<(() => void) | null>(null)

  useEffect(() => {
    const section   = sectionRef.current
    const heading   = headingRef.current
    const bodyEl    = bodyRef.current
    const logoEl    = logoRef.current
    if (!section || !heading || !bodyEl || !logoEl) return

    void (async () => {
      const [{ default: gsap }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('split-type'),
      ])

      const reduced = getReducedMotion()
      const emailEl = emailRef.current

      if (reduced) {
        // Mostrar todo inmediatamente sin transición
        gsap.set([logoEl], { clearProps: 'all' })
        if (emailEl) gsap.set(emailEl, { clearProps: 'all' })
        const fields   = section.querySelectorAll('[data-contact-field]')
        const checkbox = section.querySelector('[data-contact-checkbox]')
        const submit   = section.querySelector('[data-contact-submit]')
        gsap.set([...fields, checkbox, submit].filter(Boolean), { clearProps: 'all' })
        return
      }

      // ── Splits de texto ───────────────────────────────────────────────────
      const h1Split = new SplitType(heading, { types: 'lines' })
      wrapLinesInMask(h1Split.lines ?? [])
      const bodyParas = bodyEl.querySelectorAll('p')
      const bodySplits = Array.from(bodyParas).map(
        (p) => new SplitType(p as HTMLElement, { types: 'lines' }),
      )
      const bodyLines = bodySplits.flatMap((s) => s.lines ?? [])

      // ── Estado inicial ────────────────────────────────────────────────────
      // Box visible al instante (la PageCurtain global ya hace el reveal).
      gsap.set(h1Split.lines ?? [], { y: 60, opacity: 0 })
      gsap.set(bodyLines,            { y: 40, opacity: 0 })
      if (emailEl) gsap.set(emailEl, { opacity: 0 })
      gsap.set(logoEl,               { opacity: 0, y: -12 })

      // Números de pasos (variant testers) — fuera del set de <p>, requieren
      // animación propia sincronizada con la entrada del body.
      const stepNumbers = bodyEl.querySelectorAll('[data-step-number]')
      gsap.set(stepNumbers, { y: 40, opacity: 0 })

      const fields   = section.querySelectorAll('[data-contact-field]')
      const checkbox = section.querySelector('[data-contact-checkbox]')
      const submit   = section.querySelector('[data-contact-submit]')
      gsap.set(fields,  { opacity: 0, y: 16 })
      if (checkbox) gsap.set(checkbox, { opacity: 0 })
      if (submit)   gsap.set(submit,   { opacity: 0, y: 8 })

      // ── Secuencia de animación ─────────────────────────────────────────────
      // El box es visible al montar; el stagger del contenido empieza con un
      // pequeño buffer para que coincida con el final del uncover de la
      // PageCurtain (≈ 0.15s después del navigate dentro del timeline global).
      const D = 0.2

      // t=560ms rel. box: Heading (SplitType line-mask)
      gsap.to(h1Split.lines ?? [], {
        y: 0, opacity: 1,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.08,
        delay: D + 0.56,
      })

      // t=660ms rel. box: Body (SplitType line-mask)
      gsap.to(bodyLines, {
        y: 0, opacity: 1,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.06,
        delay: D + 0.66,
      })

      // Números de pasos — stagger más amplio para que cada número entre
      // aproximadamente con la primera línea de su bloque.
      if (stepNumbers.length) {
        gsap.to(stepNumbers, {
          y: 0, opacity: 1,
          duration: 1,
          ease: 'power4.out',
          stagger: 0.18,
          delay: D + 0.72,
        })
      }

      // t=960ms: Email alternativo
      if (emailEl) {
        gsap.to(emailEl, { opacity: 1, duration: 0.6, delay: D + 0.96 })
      }

      // t=760ms rel. box: Logo
      gsap.to(logoEl, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        delay: D + 0.76,
      })

      // t=920ms+ rel. box: Campos del formulario (stagger 80ms)
      gsap.to(fields, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power4.out',
        stagger: 0.08,
        delay: D + 0.92,
      })

      // Checkbox — tras los campos
      const fieldDelay = D + 0.92 + fields.length * 0.08
      if (checkbox) {
        gsap.to(checkbox, { opacity: 1, duration: 0.6, delay: fieldDelay })
      }

      // Submit — tras el checkbox
      if (submit) {
        gsap.to(submit, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          delay: fieldDelay + 0.08,
        })
      }

      cleanupRef.current = () => {
        h1Split.revert()
        bodySplits.forEach((s) => s.revert())
      }
    })()

    return () => cleanupRef.current?.()
  }, [])

  return (
    <section
      ref={sectionRef}
      aria-labelledby="contact-hero-title"
      className="relative h-full w-full overflow-hidden"
    >
      {/* Fondo fullscreen — visible inmediatamente, sin animación */}
      <div className="absolute inset-0 z-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Contenedor exterior — centra el cuadro con marco uniforme alrededor */}
      <div className="relative z-content h-full flex items-center justify-center p-grid-margin">

        {/* Cuadro warm-light — visible al instante (la PageCurtain global hace el reveal) */}
        <div className="w-full max-w-[var(--grid-max-w)] bg-warm-light">
          <div className="p-[clamp(32px,4vw,64px)]">
            <div className="grid grid-cols-12 gap-grid-gutter">

              {/* ── COLUMNA IZQUIERDA ─────────────────────────────────────── */}
              <div className="col-span-12 lg:col-span-5 flex flex-col justify-between gap-10 lg:gap-0">
                <div>
                  <h1
                    ref={headingRef}
                    id="contact-hero-title"
                    className="font-serif font-light text-title-sm text-fg"
                  >
                    {title}
                  </h1>
                  <div
                    ref={bodyRef}
                    className="mt-10 flex flex-col gap-6 font-mono text-body-sm text-fg"
                  >
                    {body}
                  </div>
                </div>

                {altEmail && (
                  <p
                    ref={emailRef}
                    className="font-mono text-micro text-fg/40 lg:mt-auto"
                  >
                    {altEmailLabel}{' '}
                    <a
                      href={`mailto:${altEmail}`}
                      className="underline underline-offset-4 hover:opacity-70"
                    >
                      {altEmail}
                    </a>
                  </p>
                )}
              </div>

              {/* ── COLUMNA DERECHA ───────────────────────────────────────── */}
              <div className="col-span-12 lg:col-start-7 lg:col-span-6 flex flex-col gap-6">

                {/* Logo — ocupa 3 cols, justificado a la derecha */}
                <div ref={logoRef} className="flex justify-end">
                  <Logo
                    variant="wordmark"
                    className="h-[32px] lg:h-[clamp(32px,2.4vw,44px)] w-auto text-fg"
                    aria-label="Interactius"
                  />
                </div>

                {/* Formulario — campos animados via [data-contact-field] etc. */}
                {children}

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
