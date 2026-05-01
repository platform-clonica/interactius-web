'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { useFocusTrap } from '@/components/motion/useFocusTrap'
import {
  CONSENT_CATEGORIES,
  type ConsentCategory,
  type ConsentMap,
} from '@/lib/consent/types'
import { useConsentStore } from '@/lib/store/consent'

/**
 * ConsentSettings — modal de preferencias granulares de cookies.
 *
 * Estado local (`draft`) separado del store: los toggles modifican el
 * borrador; "Guardar mis preferencias" lo aplica vía store.save(). ESC y
 * "Cerrar sin guardar" descartan. "Aceptar todo" / "Rechazar todo" actúan
 * directamente sobre el store y cierran (no requieren guardar).
 *
 * Accesibilidad: role="dialog" aria-modal="true", focus trap, body lock.
 * AEPD: la categoría `necessary` se renderiza disabled y siempre on.
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

  useFocusTrap(panelRef, isOpen, closeSettings)

  // Cuando se abre, sincroniza el borrador con el estado actual del store.
  useEffect(() => {
    if (isOpen) setDraft(storeCategories)
  }, [isOpen, storeCategories])

  // Body scroll lock mientras el modal está abierto.
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = () => save(draft)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={introId}
      className="fixed inset-0 z-consent-settings flex items-center justify-center"
    >
      {/* Backdrop — click cierra sin guardar */}
      <button
        type="button"
        aria-label={t('close')}
        onClick={closeSettings}
        className="absolute inset-0 cursor-default bg-dark/80 backdrop-blur-sm"
        tabIndex={-1}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative mx-6 max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-dark p-8 text-warm-light lg:p-12"
      >
        {/* Botón cerrar (esquina) */}
        <button
          type="button"
          onClick={closeSettings}
          aria-label={t('close')}
          className="absolute right-6 top-6 grid size-10 place-items-center text-warm-light/60 transition-colors hover:text-warm-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-light"
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        </button>

        <h2
          id={titleId}
          className="font-serif text-title-sm font-light text-warm-light"
        >
          {t('title')}
        </h2>

        <p
          id={introId}
          className="mt-4 max-w-xl font-mono text-body-sm text-warm-light/60"
        >
          {t('intro')}
        </p>

        {/* Categorías */}
        <ul className="mt-8 flex flex-col gap-6">
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

        <p className="mt-8 max-w-xl font-mono text-body-sm text-warm-light/60">
          {t('moreInfo')}
        </p>

        {/* Acciones */}
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
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
            className="ml-auto inline-flex items-center justify-center bg-warm-light px-5 py-2 font-mono text-body-sm text-dark transition-colors duration-fast ease-expo hover:bg-transparent hover:text-warm-light hover:outline hover:outline-1 hover:outline-warm-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-light"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
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
    <li className="border-t border-warm-light/15 pt-6">
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
   ========================================================================== */

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
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center border transition-colors duration-fast ease-expo focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-light ${
        checked
          ? 'border-warm-light bg-warm-light/20'
          : 'border-warm-light/40 bg-transparent'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0.5 top-1/2 size-4 -translate-y-1/2 bg-warm-light transition-transform duration-fast ease-expo ${
          checked ? 'translate-x-[20px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
