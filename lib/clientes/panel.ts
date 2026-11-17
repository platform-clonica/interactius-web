/* ==========================================================================
   Acciones del panel admin (lógica pura, sin Next): se prueban con el store
   en memoria y las usa la server action de `app/clientes/admin/acciones.ts`.
   ========================================================================== */

import { ErrorOperacion, darAcceso } from './operations'
import type { Almacenes } from './store'

export type ResultadoDarAcceso =
  | { ok: true; email: string; nuevo: boolean; password: string | null; enlace: string; titulo: string }
  | { ok: false; mensaje: string }

/**
 * Da acceso a un artefacto desde el panel. Crea el usuario si no existe y,
 * solo entonces, devuelve su contraseña (se muestra una única vez).
 *
 * A diferencia de la CLI, nunca reactiva usuarios desactivados: reactivar
 * devuelve todos sus accesos antiguos y esa decisión se toma aparte.
 */
export async function darAccesoPanel(
  a: Almacenes,
  id: string,
  email: string,
  ahora: number,
  urlBase: string,
): Promise<ResultadoDarAcceso> {
  try {
    const r = await darAcceso(a, id, email, ahora)
    return {
      ok: true,
      email: r.email,
      nuevo: r.password !== null,
      password: r.password,
      enlace: `${urlBase}/clientes/${r.artefacto.cliente}/${r.artefacto.id}`,
      titulo: r.artefacto.titulo,
    }
  } catch (e) {
    if (!(e instanceof ErrorOperacion)) throw e
    if (/desactivado/.test(e.message)) {
      return {
        ok: false,
        mensaje:
          'Ese usuario está desactivado. Reactivarlo le devuelve todos sus accesos anteriores: pídeselo a Claude si es lo que quieres.',
      }
    }
    return { ok: false, mensaje: e.message }
  }
}
