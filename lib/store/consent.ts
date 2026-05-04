/**
 * Consent store — estado global del sistema de consentimiento de cookies.
 *
 * Diseño: espejo del patrón de `lib/store/menu.ts`. Zustand sin middlewares;
 * la persistencia se delega a `lib/consent/cookie.ts` (cookie first-party).
 *
 * Ciclo de vida:
 *  1. ConsentMount monta y llama hydrateFromCookie() en useEffect.
 *  2. Si la cookie existe y es de la versión actual → status='set'.
 *     Si no → status='pending' y aparece el banner.
 *  3. Acciones acceptAll/rejectAll/save escriben cookie + status='set'.
 *  4. Si la nueva decisión revoca alguna categoría (true → false), se
 *     dispara reload duro para desinstalar scripts ya cargados.
 */

import { create } from 'zustand'

import {
  buildSnapshot,
  clearConsentCookie,
  hasRevocation,
  isCurrentVersion,
  parseConsent,
  writeConsentCookie,
} from '@/lib/consent/cookie'
import {
  CONSENT_VERSION,
  DEFAULT_CATEGORIES,
  type ConsentCategory,
  type ConsentMap,
  type ConsentSnapshot,
} from '@/lib/consent/types'

interface ConsentState {
  status: 'pending' | 'set'
  categories: ConsentMap
  version: string
  timestamp: number
  isSettingsOpen: boolean
  /** True solo durante el primer render del cliente, antes del hydrate.
   *  Evita renderizar el banner SSR-side y producir flash. */
  isHydrated: boolean

  hydrateFromCookie: (raw: string | null) => void
  acceptAll: () => void
  rejectAll: () => void
  save: (partial: Partial<ConsentMap>) => void
  openSettings: () => void
  closeSettings: () => void
  resetConsent: () => void
}

export const useConsentStore = create<ConsentState>((set, get) => ({
  status: 'pending',
  categories: { ...DEFAULT_CATEGORIES },
  version: CONSENT_VERSION,
  timestamp: 0,
  isSettingsOpen: false,
  isHydrated: false,

  hydrateFromCookie: (raw) => {
    const snapshot = parseConsent(raw)
    if (snapshot && isCurrentVersion(snapshot)) {
      set({
        status: 'set',
        categories: snapshot.categories,
        version: snapshot.version,
        timestamp: snapshot.timestamp,
        isHydrated: true,
      })
    } else {
      set({
        status: 'pending',
        categories: { ...DEFAULT_CATEGORIES },
        version: CONSENT_VERSION,
        timestamp: 0,
        isHydrated: true,
      })
    }
  },

  acceptAll: () => {
    const next: ConsentMap = {
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
    }
    commit(get().categories, next, set)
  },

  rejectAll: () => {
    const next: ConsentMap = {
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
    }
    commit(get().categories, next, set)
  },

  save: (partial) => {
    const prev = get().categories
    const next: ConsentMap = {
      ...prev,
      ...partial,
      necessary: true,
    }
    commit(prev, next, set)
  },

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),

  resetConsent: () => {
    clearConsentCookie()
    set({
      status: 'pending',
      categories: { ...DEFAULT_CATEGORIES },
      timestamp: 0,
      isSettingsOpen: false,
    })
  },
}))

/* ==========================================================================
   Commit helper — escribe cookie, actualiza estado y recarga si toca
   ========================================================================== */

function commit(
  prev: ConsentMap,
  next: ConsentMap,
  set: (partial: Partial<ConsentState>) => void,
): void {
  const snapshot: ConsentSnapshot = buildSnapshot(next)
  writeConsentCookie(snapshot)
  set({
    status: 'set',
    categories: snapshot.categories,
    version: snapshot.version,
    timestamp: snapshot.timestamp,
    isSettingsOpen: false,
  })

  // Si revocamos alguna categoría, hard reload para desinstalar scripts ya
  // cargados (futuro Sprint 3 con <ConsentScript>). Sin reload, scripts como
  // GA dejan globals (window.dataLayer) que no se "desinstalan" limpio.
  if (typeof window !== 'undefined' && hasRevocation(prev, next)) {
    // Pequeño delay para que la cookie se escriba antes del reload.
    setTimeout(() => window.location.reload(), 80)
  }
}

/* ==========================================================================
   Selectores convenience
   ========================================================================== */

/** Selector con re-render mínimo: solo cambia cuando el booleano de la
 *  categoría cambia. Útil para el futuro hook useConsent(category). */
export function selectCategory(category: ConsentCategory) {
  return (s: ConsentState) => s.categories[category]
}
