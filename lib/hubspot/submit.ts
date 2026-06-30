/**
 * Hubspot Forms API — helper de envío
 * ------------------------------------
 * Wrapper alrededor de la API v3 de Hubspot Forms.
 * Referencia: https://developers.hubspot.com/docs/methods/forms/submit_form
 *
 * El endpoint de submissions es PÚBLICO: no requiere auth.
 * Sólo necesita Portal ID + Form ID.
 *
 * Variables de entorno:
 *   HUBSPOT_PORTAL_ID        — ID del portal (account ID), requerido
 *   HUBSPOT_ACCESS_TOKEN     — opcional. Sólo si quieres usar Private App
 *                              auth (no aporta nada al Forms API público).
 *
 * Cada formulario tiene su propio Form ID (no el portal):
 *   HUBSPOT_FORM_ID_CONTACT
 *   HUBSPOT_FORM_ID_NEWSLETTER
 */

export interface HubspotField {
  /** Nombre del campo interno en Hubspot (snake_case). */
  name: string
  value: string
  /**
   * objectTypeId para propiedades que NO son del contacto. Ej. '0-2' para
   * propiedades del objeto empresa (company). Si se omite, Hubspot asume
   * contacto ('0-1').
   */
  objectTypeId?: string
}

/**
 * Opciones de consentimiento legal (RGPD) del Forms API v3. Se envía en el
 * cuerpo junto a `fields` y `context`, no como un campo más.
 * https://legacydocs.hubspot.com/docs/methods/forms/submit_form_v3_authentication
 */
export interface HubspotLegalConsentOptions {
  consent: {
    consentToProcess: boolean
    text: string
    communications?: Array<{
      value: boolean
      subscriptionTypeId: number
      text: string
    }>
  }
}

interface HubspotSubmitOptions {
  /** Form ID específico del formulario en Hubspot. */
  formId: string
  fields: HubspotField[]
  /** URL de la página desde donde se envía (para el contexto de conversión). */
  pageUri?: string
  /** Consentimiento RGPD (opt-in de marketing + consentToProcess). */
  legalConsentOptions?: HubspotLegalConsentOptions
}

type HubspotResult =
  | { ok: true }
  | { ok: false; status: number; message: string }

/**
 * Envía un formulario a Hubspot.
 *
 * Si las variables de entorno no están configuradas, devuelve un error
 * semántico sin lanzar excepción (para que el route handler lo gestione).
 */
export async function submitToHubspot(
  options: HubspotSubmitOptions,
): Promise<HubspotResult> {
  const portalId = process.env.HUBSPOT_PORTAL_ID
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN

  if (!portalId) {
    return {
      ok: false,
      status: 0,
      message: 'HUBSPOT_NOT_CONFIGURED',
    }
  }

  const url = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${options.formId}`

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fields: options.fields,
        context: {
          pageUri: options.pageUri ?? '',
        },
        ...(options.legalConsentOptions
          ? { legalConsentOptions: options.legalConsentOptions }
          : {}),
      }),
    })
  } catch (err) {
    return {
      ok: false,
      status: 0,
      message: err instanceof Error ? err.message : 'network_error',
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return {
      ok: false,
      status: res.status,
      message: body || res.statusText,
    }
  }

  return { ok: true }
}
