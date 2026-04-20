'use client'

import Image from 'next/image'
import { useEffect, useState, type ReactNode } from 'react'

/**
 * ContactHero — layout común a /contacto, /newsletter y /testers.
 *
 * Estructura:
 * - Background imagen fullscreen (LCP candidate).
 * - Panel blanco superpuesto a la derecha (desktop) o abajo (mobile).
 * - Dentro del panel: copy (title + descripción + email alternativo) + children (form).
 *
 * Reveals:
 * - A18: imagen con clip-path lateral al mount (left→right).
 * - A19: panel con clip-path lateral inverso 300ms después (right→left).
 */

interface ContactHeroProps {
  title: string
  copy: string
  altEmail?: string
  imageSrc?: string
  imageAlt?: string
  children: ReactNode
}

export function ContactHero({
  title,
  copy,
  altEmail,
  imageSrc = '/home/hero-poster.webp',
  imageAlt = '',
  children,
}: ContactHeroProps) {
  const [imageRevealed, setImageRevealed] = useState(false)
  const [panelRevealed, setPanelRevealed] = useState(false)

  useEffect(() => {
    // Trigger tras primer paint.
    const imgTimer = requestAnimationFrame(() => {
      requestAnimationFrame(() => setImageRevealed(true))
    })
    const panelTimer = window.setTimeout(() => {
      setPanelRevealed(true)
    }, 400)

    return () => {
      cancelAnimationFrame(imgTimer)
      window.clearTimeout(panelTimer)
    }
  }, [])

  return (
    <section
      aria-labelledby="contact-hero-title"
      className="relative min-h-screen w-full overflow-hidden"
    >
      {/* Imagen de fondo — full viewport */}
      <div
        className={`
          absolute inset-0 z-0
          reveal-clip-lateral ${imageRevealed ? 'is-revealed' : ''}
        `}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Grid contenedor para posicionar el panel */}
      <div className="relative z-content min-h-screen">
        <div className="section-inner min-h-screen">
          <div className="grid min-h-screen grid-cols-1 items-end lg:grid-cols-12 lg:items-stretch">
            {/* Panel blanco con contenido */}
            <div
              className={`
                lg:col-span-7 lg:col-start-6
                flex flex-col justify-center
                bg-surface p-8 sm:p-12 lg:p-16
                my-8 lg:my-section
                reveal-clip-lateral-inverse ${panelRevealed ? 'is-revealed' : ''}
              `}
            >
              <header>
                <h1
                  id="contact-hero-title"
                  className="font-serif text-section font-light text-fg lg:text-title"
                >
                  {title}
                </h1>

                <p className="mt-6 font-mono text-body-sm text-fg/80 lg:text-body">
                  {copy}
                </p>

                {altEmail && (
                  <p className="mt-6 font-mono text-body-sm text-fg/60">
                    O escríbenos a{' '}
                    <a
                      href={`mailto:${altEmail}`}
                      className="text-fg underline underline-offset-4
                                 transition-opacity duration-fast ease-expo
                                 hover:opacity-70 focus-visible:opacity-70"
                    >
                      {altEmail}
                    </a>
                  </p>
                )}
              </header>

              <div className="mt-12 lg:mt-16">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
