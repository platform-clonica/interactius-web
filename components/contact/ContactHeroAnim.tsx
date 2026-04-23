'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import Image from 'next/image'

import { Logo } from '@/components/ui/Logo'
import { getReducedMotion } from '@/components/motion/useReducedMotion'
import { wrapLinesInMask } from '@/components/motion/wrapLinesInMask'

/* ==========================================================================
   ContactHeroAnim — layout + GSAP entry sequence
   --------------------------------------------------------------------------
   Recibe el contenido ya traducido del Server Component (ContactHero) y
   orquesta la animación de entrada:

   t=0      Cuadro warm-light: translateX -100vw→0, 700ms, cubic-bezier(.16,1,.3,1)
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
  const boxRef        = useRef<HTMLDivElement>(null)
  const headingRef    = useRef<HTMLHeadingElement>(null)
  const bodyRef       = useRef<HTMLDivElement>(null)
  const emailRef      = useRef<HTMLParagraphElement>(null)
  const logoRef       = useRef<HTMLDivElement>(null)
  const separatorRef  = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanupRef    = useRef<(() => void) | null>(null)

  useEffect(() => {
    const section   = sectionRef.current
    const box       = boxRef.current
    const heading   = headingRef.current
    const bodyEl    = bodyRef.current
    const logoEl    = logoRef.current
    const separator = separatorRef.current
    if (!section || !box || !heading || !bodyEl || !logoEl || !separator) return

    void (async () => {
      const [{ default: gsap }, { default: SplitType }] = await Promise.all([
        import('gsap'),
        import('split-type'),
      ])

      const reduced = getReducedMotion()
      const emailEl = emailRef.current

      if (reduced) {
        // Mostrar todo inmediatamente sin transición
        gsap.set([box, logoEl, separator], { clearProps: 'all' })
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
      // El cuadro ya empieza en translateX(-100vw) via inline style del JSX.
      // GSAP solo necesita setear el resto.
      gsap.set(h1Split.lines ?? [], { y: 60, opacity: 0 })
      gsap.set(bodyLines,            { y: 40, opacity: 0 })
      if (emailEl) gsap.set(emailEl, { opacity: 0 })
      gsap.set(logoEl,               { opacity: 0, y: -12 })
      gsap.set(separator,            { opacity: 0 })

      const fields   = section.querySelectorAll('[data-contact-field]')
      const checkbox = section.querySelector('[data-contact-checkbox]')
      const submit   = section.querySelector('[data-contact-submit]')
      gsap.set(fields,  { opacity: 0, y: 16 })
      if (checkbox) gsap.set(checkbox, { opacity: 0 })
      if (submit)   gsap.set(submit,   { opacity: 0, y: 8 })

      // ── Secuencia de animación ─────────────────────────────────────────────

      // t=0: Cuadro warm-light entra desde la izquierda (translateX -100vw → 0)
      // Pequeño delay para que la cortina del ContactOverlay termine de salir.
      // La cortina tarda ~350ms; el box empieza a los 200ms → overlap natural.
      gsap.to(box, {
        x: 0,
        duration: 0.7,
        ease: 'power3.out',  // aproximación de cubic-bezier(.16,1,.3,1)
        delay: 0.2,
      })

      // Los delays de contenido son relativos al inicio del box (t=0.2s)
      // Spec original: heading a 560ms del box → aquí 0.2 + 0.56 = 0.76s
      const D = 0.2  // delay base del box

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

      // t=840ms rel. box: Separador │
      gsap.to(separator, { opacity: 1, duration: 0.3, delay: D + 0.84 })

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

      {/* Contenedor exterior — centra el cuadro verticalmente */}
      <div className="relative z-content min-h-full flex items-center py-section lg:pr-grid-margin">

        {/* Cuadro warm-light — la animación de clip-path empieza aquí */}
        <div
          ref={boxRef}
          className="w-full bg-warm-light"
          style={{ transform: 'translateX(-100vw)' }}
        >
          <div className="section-inner py-section">
            <div className="grid grid-cols-12 gap-grid-gutter">

              {/* ── COLUMNA IZQUIERDA ─────────────────────────────────────── */}
              <div className="col-span-12 lg:col-span-5 flex flex-col justify-between gap-10 lg:gap-0">
                <div>
                  <h1
                    ref={headingRef}
                    id="contact-hero-title"
                    className="font-serif font-normal text-section text-fg"
                  >
                    {title}
                  </h1>
                  <div
                    ref={bodyRef}
                    className="mt-10 font-mono text-body-sm text-fg/80 space-y-5"
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

                {/* Logo */}
                <div ref={logoRef}>
                  <Logo
                    variant="wordmark"
                    className="h-[40px] lg:h-[clamp(40px,3.9vw,75px)] w-auto text-fg"
                    aria-label="Interactius"
                  />
                </div>

                {/* Separador │ — visual divider antes del formulario */}
                <div
                  ref={separatorRef}
                  className="border-b border-fg/20 w-full h-[42px] flex items-end pb-1"
                >
                  <span className="font-mono text-body-sm text-fg leading-none" aria-hidden>
                    │
                  </span>
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
