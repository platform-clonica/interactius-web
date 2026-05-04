'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'

import { useFocusTrap } from '@/components/motion/useFocusTrap'
import {
  CONSENT_CATEGORIES,
  type ConsentCategory,
  type ConsentMap,
} from '@/lib/consent/types'
import { useConsentStore } from '@/lib/store/consent'

/**
 * ConsentSettings — pantalla completa de preferencias granulares de cookies.
 *
 * Estado local (`draft`) separado del store: los toggles modifican el
 * borrador; "Guardar mis preferencias" lo aplica vía store.save(). ESC y
 * el botón de cerrar (X canónico, mismo del menú desplegable) descartan.
 * "Aceptar todo" / "Rechazar todo" actúan directamente sobre el store y
 * cierran (no requieren guardar).
 *
 * Accesibilidad: role="dialog" aria-modal="true", focus trap, body lock.
 * AEPD: la categoría `necessary` se renderiza disabled y siempre on.
 *
 * Render: portal a document.body + z-index inline 10000 para garantizar
 * estar SIEMPRE sobre el chrome (sidebar mix-blend-difference, header,
 * hero strip dinámico) en cualquier página.
 */
export function ConsentSettings() {
  const t = useTranslations('consent.settings')
  const isOpen = useConsentStore((s) => s.isSettingsOpen)
  const closeSettings = useConsentStore((s) => s.closeSettings)
  const acceptAll = useConsentStore((s) => s.acceptAll)
  const rejectAll = useConsentStore((s) => s.rejectAll)
  const save = useConsentStore((s) => s.save)
  const storeCategories = useConsentStore((s) => s.categories)

  const titleId = useId()
  const introId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<ConsentMap>(storeCategories)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  useFocusTrap(panelRef, isOpen, closeSettings)

  // Cuando se abre, sincroniza el borrador con el estado actual del store.
  useEffect(() => {
    if (isOpen) setDraft(storeCategories)
  }, [isOpen, storeCategories])

  // Body scroll lock mientras el panel está abierto.
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  if (!mounted || !isOpen) return null

  const handleSave = () => save(draft)

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={introId}
      style={{ zIndex: 10000 }}
      className="fixed inset-0 bg-dark text-warm-light"
    >
      {/* Botón cerrar — mismo X canónico del menú desplegable, posicionado
          en la zona del Sidebar (top:26px, centrado en el ancho 128px de
          la sidebar). En mobile (<lg) sin sidebar: top-right del viewport. */}
      <button
        type="button"
        onClick={closeSettings}
        aria-label={t('close')}
        className="absolute top-[26px] right-6 z-10 flex size-10 items-center justify-center text-warm-light transition-opacity duration-fast ease-expo hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-light lg:left-[calc((var(--sidebar-w)-40px)/2)] lg:right-auto"
      >
        <CloseIcon />
      </button>

      <div className="section-inner flex h-full flex-col py-16 lg:py-20">
        <div className="lg:max-w-3xl">
          <h2
            id={titleId}
            className="font-serif text-title-sm font-light text-warm-light"
          >
            {t('title')}
          </h2>

          <p
            id={introId}
            className="mt-4 font-mono text-body-sm text-warm-light"
          >
            {t('intro')}
          </p>
        </div>

        {/* Categorías */}
        <ul className="mt-8 flex flex-col gap-4 lg:max-w-3xl">
          {CONSENT_CATEGORIES.map((category) => (
            <CategoryRow
              key={category}
              category={category}
              checked={draft[category]}
              onChange={(value) =>
                setDraft((d) => ({ ...d, [category]: value }))
              }
            />
          ))}
        </ul>

        <p className="mt-8 max-w-2xl font-mono text-body-sm text-warm-light/60">
          {t('moreInfo')}
        </p>

        {/* Acciones — todas underline canónico */}
        <div className="mt-auto flex flex-wrap items-center gap-x-8 gap-y-3 pt-8">
          <button
            type="button"
            onClick={rejectAll}
            className="hover-wipe-underline w-fit font-mono text-body-sm text-warm-light"
          >
            {t('rejectAll')}
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="hover-wipe-underline w-fit font-mono text-body-sm text-warm-light"
          >
            {t('acceptAll')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="hover-wipe-underline ml-auto w-fit font-mono text-body-sm text-warm-light"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ==========================================================================
   CloseIcon — mismo morph X del MenuTrigger en estado abierto.
   --------------------------------------------------------------------------
   Reproduce el SVG del componente HamburgerIcon (40x10 con dos líneas
   stroke 1.5 cruzándose en X) en estado `open=true`. Sin transición — la
   X aparece estática porque este botón solo cierra. Mantiene la
   consistencia visual con el patrón canónico del menú desplegable.
   ========================================================================== */

function CloseIcon() {
  return (
    <svg
      width="40"
      height="10"
      viewBox="0 0 40 10"
      fill="none"
      aria-hidden="true"
      className="block overflow-visible"
    >
      <line
        x1="0"
        y1="0.75"
        x2="40"
        y2="0.75"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        className="translate-y-[4.25px] rotate-45"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
      <line
        x1="0"
        y1="9.25"
        x2="40"
        y2="9.25"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        className="-translate-y-[4.25px] -rotate-45"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
    </svg>
  )
}

/* ==========================================================================
   CategoryRow — fila con toggle, nombre y descripción
   ========================================================================== */

function CategoryRow({
  category,
  checked,
  onChange,
}: {
  category: ConsentCategory
  checked: boolean
  onChange: (value: boolean) => void
}) {
  const t = useTranslations('consent.settings')
  const descId = useId()
  const isLocked = category === 'necessary'

  return (
    <li className="border-t border-warm-light/15 pt-4">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <h3 className="font-mono text-body-sm font-medium text-warm-light">
            {t(`categories.${category}.name`)}
          </h3>
          <p
            id={descId}
            className="mt-2 font-mono text-body-sm text-warm-light/60"
          >
            {t(`categories.${category}.desc`)}
          </p>
        </div>

        {isLocked ? (
          <span className="shrink-0 whitespace-nowrap font-mono text-micro uppercase tracking-widest text-warm-light/40">
            {t('alwaysOn')}
          </span>
        ) : (
          <ConsentToggle
            checked={checked}
            onChange={onChange}
            ariaLabel={t(`categories.${category}.name`)}
            ariaDescribedBy={descId}
          />
        )}
      </div>
    </li>
  )
}

/* ==========================================================================
   ConsentToggle — switch accesible (role="switch")
   --------------------------------------------------------------------------
   Rail con bg warm-light al 20% en ambos estados (visibilidad). Border
   más sólido (warm-light) en ON, /40 en OFF. Knob warm-light que desliza.
   bg via inline rgba para garantizar render aunque Tailwind no haya
   procesado el alpha modifier.
   ========================================================================== */

/**
 * ConsentToggle — switch accesible (`role="switch"`).
 *
 * Implementación: las dimensiones, el bg del rail y la posición del knob
 * van como `style={}` inline. Decisión deliberada — no es un apaño:
 *
 *  1. Robustez en producción. Una purga agresiva del Tailwind JIT, una
 *     diferencia de orden de imports o un edge case de `bg-warm-light/20`
 *     no compilado en cierto entorno (Netlify build cache, etc.) dejaría
 *     el rail invisible. Inline garantiza render IDÉNTICO en dev y prod.
 *  2. Componente con tres propiedades visuales muy concretas (44x24,
 *     warm-light al 20%, knob desplazando 20px). No se reutilizan en
 *     ningún otro sitio del proyecto, así que extraer a utility CSS
 *     sería over-engineering.
 *
 * Las clases Tailwind sobreviven solo para focus-visible (a11y) y para
 * que en DevTools se lea el contrato visual sin decodificar números.
 */
function ConsentToggle({
  checked,
  onChange,
  ariaLabel,
  ariaDescribedBy,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  ariaLabel: string
  ariaDescribedBy?: string
}) {
  const railStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    width: '44px',
    height: '24px',
    backgroundColor: 'rgba(245, 242, 237, 0.2)',
    border: 'none',
    cursor: 'pointer',
  }

  const knobStyle: React.CSSProperties = {
    position: 'absolute',
    left: '2px',
    top: '50%',
    width: '16px',
    height: '16px',
    backgroundColor: '#f5f2ed',
    transform: `translate(${checked ? '20px' : '0'}, -50%)`,
    transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
    pointerEvents: 'none',
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      onClick={() => onChange(!checked)}
      style={railStyle}
      className="bg-warm-light/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-light"
    >
      <span aria-hidden="true" style={knobStyle} />
    </button>
  )
}
