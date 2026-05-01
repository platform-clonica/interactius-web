/**
 * Consent cookie — serialización y persistencia.
 * --------------------------------------------------------------------------
 * Cookie first-party `interactius_consent_v1`. Path `/`, SameSite=Lax,
 * Secure en prod, Max-Age 12 meses. Formato JSON URI-encoded compacto:
 *   { v:'v1', t:1714557600000, c:{n:1,p:0,a:0,m:0} }
 *
 * Decisión cookie sobre localStorage:
 *  - LSSI-CE Art. 22.2 habla de "dispositivos terminales" → cookie es el
 *    lenguaje del marco normativo.
 *  - Lectura SSR (next/headers) en root layout → permite renderizar el
 *    banner sin flash al hidratar.
 */

import {
  CONSENT_VERSION,
  DEFAULT_CATEGORIES,
  type ConsentCookieShape,
  type ConsentMap,
  type ConsentSnapshot,
} from './types'

export const CONSENT_COOKIE_NAME = 'interactius_consent_v1'
/** 12 meses en segundos. Por debajo del límite AEPD (24m) con margen. */
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/* ==========================================================================
   Serialización
   ========================================================================== */

export function serializeConsent(snapshot: ConsentSnapshot): string {
  const payload: ConsentCookieShape = {
    v: snapshot.version,
    t: snapshot.timestamp,
    c: {
      n: snapshot.categories.necessary ? 1 : 0,
      p: snapshot.categories.preferences ? 1 : 0,
      a: snapshot.categories.analytics ? 1 : 0,
      m: snapshot.categories.marketing ? 1 : 0,
    },
  }
  return encodeURIComponent(JSON.stringify(payload))
}

export function parseConsent(raw: string | null | undefined): ConsentSnapshot | null {
  if (!raw) return null
  try {
    const decoded = decodeURIComponent(raw)
    const parsed = JSON.parse(decoded) as Partial<ConsentCookieShape>
    if (
      typeof parsed.v !== 'string' ||
      typeof parsed.t !== 'number' ||
      !parsed.c ||
      typeof parsed.c !== 'object'
    ) {
      return null
    }
    const c = parsed.c as ConsentCookieShape['c']
    const categories: ConsentMap = {
      // necessary se fuerza a true: aunque la cookie diga 0 (improbable),
      // no se puede desactivar técnicamente.
      necessary: true,
      preferences: c.p === 1,
      analytics: c.a === 1,
      marketing: c.m === 1,
    }
    return {
      version: parsed.v,
      timestamp: parsed.t,
      categories,
    }
  } catch {
    return null
  }
}

/**
 * Verifica si un snapshot es válido para la versión actual del contrato.
 * Si la versión no coincide, lo tratamos como ausencia de consentimiento
 * (forzamos re-consent).
 */
export function isCurrentVersion(snapshot: ConsentSnapshot | null): boolean {
  return snapshot?.version === CONSENT_VERSION
}

/* ==========================================================================
   Cliente — escritura/lectura desde document.cookie
   ========================================================================== */

export function writeConsentCookie(snapshot: ConsentSnapshot): void {
  if (typeof document === 'undefined') return
  const value = serializeConsent(snapshot)
  const isSecure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
  const parts = [
    `${CONSENT_COOKIE_NAME}=${value}`,
    'Path=/',
    `Max-Age=${CONSENT_COOKIE_MAX_AGE}`,
    'SameSite=Lax',
  ]
  if (isSecure) parts.push('Secure')
  document.cookie = parts.join('; ')
}

export function readConsentCookieClient(): ConsentSnapshot | null {
  if (typeof document === 'undefined') return null
  const raw = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${CONSENT_COOKIE_NAME}=`))
    ?.split('=')[1]
  return parseConsent(raw)
}

export function clearConsentCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${CONSENT_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`
}

/* ==========================================================================
   Snapshot helpers
   ========================================================================== */

export function buildSnapshot(categories: Partial<ConsentMap> = {}): ConsentSnapshot {
  return {
    version: CONSENT_VERSION,
    timestamp: Date.now(),
    categories: {
      ...DEFAULT_CATEGORIES,
      ...categories,
      necessary: true,
    },
  }
}

/**
 * Detecta si el cambio de consentimiento implica REVOCACIÓN (true → false)
 * en alguna categoría. Si sí, se debe recargar la página para asegurar
 * que scripts ya cargados se desinstalen limpiamente.
 */
export function hasRevocation(prev: ConsentMap, next: ConsentMap): boolean {
  return (
    (prev.preferences && !next.preferences) ||
    (prev.analytics && !next.analytics) ||
    (prev.marketing && !next.marketing)
  )
}
