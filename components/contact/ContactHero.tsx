import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { ContactHeroAnim } from './ContactHeroAnim'

/* ==========================================================================
   ContactHero — Server Component wrapper
   --------------------------------------------------------------------------
   Resuelve las traducciones del namespace 'contacto' y las pasa como props
   al componente cliente ContactHeroAnim que orquesta la animación de entrada.

   Variantes soportadas: 'contacto' | 'newsletter' | 'testers'
   La spec de animación del Figma es idéntica para las tres.
   ========================================================================== */

type Variant = 'contacto' | 'newsletter' | 'testers' | 'bdw'

interface ContactHeroProps {
  variant: Variant
  imageSrc?: string
  imageAlt?: string
  /** Formulario — pasado directamente como children a ContactHeroAnim. */
  children: ReactNode
}

export async function ContactHero({
  variant,
  imageSrc,
  imageAlt,
  children,
}: ContactHeroProps) {
  const t = await getTranslations('contacto')

  // ── Copy por variante ──────────────────────────────────────────────────────
  const titleMap: Record<Variant, string> = {
    contacto:   t('contacto.title'),
    newsletter: t('newsletter.title'),
    testers:    t('testers.title'),
    bdw:        t('bdw.title'),
  }

  const bodyMap: Record<Variant, ReactNode> = {
    contacto: (
      <>
        <p>{t('contacto.copy1')}</p>
        <p>{t('contacto.copy2')}</p>
        <p className="font-semibold">{t('contacto.copy3')}</p>
      </>
    ),
    newsletter: (
      <>
        <p>{t('newsletter.copy1')}</p>
        <p className="font-semibold">{t('newsletter.copy2')}</p>
      </>
    ),
    testers: (
      <>
        <p>{t('testers.intro')}</p>
        {/* 3 pasos numerados — número en col 1, contenido (lead bold + body)
            en col 2 con hanging indent automático del grid. */}
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-6 items-start">
          <span data-step-number className="font-semibold">1.</span>
          <p>
            {t.rich('testers.step1', {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          <span data-step-number className="font-semibold">2.</span>
          <p>
            {t.rich('testers.step2', {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          <span data-step-number className="font-semibold">3.</span>
          <p>
            {t.rich('testers.step3', {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>
      </>
    ),
    bdw: (
      <>
        <p>{t('bdw.copy1')}</p>
        <p>
          {t.rich('bdw.copy2', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <p>
          {t.rich('bdw.copy3', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        {/* Detalles del evento — fecha y ubicación, agrupados con gap menor. */}
        <div className="flex flex-col gap-1">
          <p>{t('bdw.eventDate')}</p>
          <p>
            {t.rich('bdw.eventLocation', {
              u: (chunks) => (
                <a
                  href="https://maps.app.goo.gl/GcB7eeStXc43bUpt8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:opacity-70"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
      </>
    ),
  }

  // Email alternativo en bottom-left de la columna izquierda — común a las 3
  // variantes; el copy "O bien, escríbenos un email a" + "info@interactius.com"
  // mantiene la coherencia visual entre Contacto, Newsletter y Testers.
  // bdw no muestra el bloque de email alternativo (el pie izquierdo son los
  // detalles del evento, ya incluidos en el body).
  const altEmailMap: Record<Exclude<Variant, 'bdw'>, string> = {
    contacto:   t('contacto.altEmail'),
    newsletter: t('contacto.altEmail'),
    testers:    t('contacto.altEmail'),
  }

  // Imagen de fondo por variante (override con prop imageSrc si se pasa).
  const bgMap: Record<Variant, string> = {
    contacto:   '/contacto/contact-bg.jpg',
    newsletter: '/contacto/news-contact-bg.jpg',
    testers:    '/contacto/testers-contact-bg.jpg',
    bdw:        '/contacto/news-contact-bg.jpg',
  }

  const isBdw = variant === 'bdw'

  return (
    <ContactHeroAnim
      imageSrc={imageSrc ?? bgMap[variant]}
      imageAlt={imageAlt}
      eyebrow={
        isBdw
          ? t.rich('bdw.eyebrow', {
              u: (chunks) => (
                <span className="underline underline-offset-4">{chunks}</span>
              ),
            })
          : undefined
      }
      title={titleMap[variant]}
      body={bodyMap[variant]}
      showLogo={!isBdw}
      altEmailLabel={isBdw ? undefined : t('altEmailText')}
      altEmail={isBdw ? undefined : altEmailMap[variant]}
    >
      {children}
    </ContactHeroAnim>
  )
}
