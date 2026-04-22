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

type Variant = 'contacto' | 'newsletter' | 'testers'

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
      <p>{t('newsletter.copy')}</p>
    ),
    testers: (
      <p>{t('testers.copy')}</p>
    ),
  }

  const altEmailMap: Record<Variant, string | undefined> = {
    contacto:   t('contacto.altEmail'),
    newsletter: undefined,
    testers:    undefined,
  }

  return (
    <ContactHeroAnim
      imageSrc={imageSrc}
      imageAlt={imageAlt}
      title={titleMap[variant]}
      body={bodyMap[variant]}
      altEmailLabel={altEmailMap[variant] ? t('altEmailText') : undefined}
      altEmail={altEmailMap[variant]}
    >
      {children}
    </ContactHeroAnim>
  )
}
