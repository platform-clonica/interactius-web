/**
 * lib/data/author.ts
 * ─────────────────────────────────────────────────────────────────────
 * Resuelve la firma de un artículo (que en el MDX es solo un nombre de pila,
 * "Sara") a su nombre completo y su rol, leyendo `lib/data/team.ts`.
 *
 * POR QUÉ LEE DEL EQUIPO Y NO TIENE SU PROPIA LISTA
 * Porque una segunda lista se queda desfasada y nadie se entera. Ya pasó con
 * los dossiers: la banda de Miradas sabía cuáles había y `llms.txt` no, y el
 * primer dossier estuvo dos días fuera del índice que leen las IA. Si alguien
 * cambia de rol en el registro de equipo, la firma de sus artículos cambia
 * con él.
 *
 * COBERTURA, MEDIDA EL 4/11/2026
 * De los 29 autores que firman en Miradas, 17 están en el equipo y cubren 98
 * de los 132 artículos (74 %). Los 11 que faltan son sobre todo gente que ya
 * no trabaja aquí, más "Interactius" como autoría colectiva. No se añaden al
 * registro de equipo porque ese archivo pinta la página de Identidad y
 * meterlos ahí los devolvería a la plantilla.
 *
 * Para esos casos la función devuelve el nombre tal cual y sin rol, que es
 * exactamente lo que la web mostraba antes. La firma nunca empeora: o gana
 * apellido y rol, o se queda como estaba.
 */

import { TEAM } from '@/lib/data/team'

export interface AuthorInfo {
  /** Nombre completo si se encontró; si no, el nombre tal cual lo firma. */
  name: string
  /** Rol en el equipo. `undefined` para quien ya no está o no se pudo resolver. */
  role?: string
}

/** Minúsculas y sin tildes, para que "María" y "Maria" sean la misma persona. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

export function resolveAuthor(author: string): AuthorInfo {
  const buscado = normalize(author)

  // 1 · Coincidencia por nombre completo. Algunos MDX ya firman así
  //     ("Berta Abad", "Joha Orellana").
  const completo = TEAM.find((m) => normalize(m.name) === buscado)
  if (completo) return { name: completo.name, role: completo.role }

  // 2 · Coincidencia por nombre de pila, solo si es inequívoca. Hay dos
  //     Elenas en el equipo (Santos y Campo): ante la duda se deja el nombre
  //     corto, porque atribuir un apellido equivocado es peor que no ponerlo.
  const porPila = TEAM.filter((m) => normalize(m.name.split(' ')[0]) === buscado)
  if (porPila.length === 1) return { name: porPila[0].name, role: porPila[0].role }

  // 3 · Quien no está en el equipo conserva su firma tal cual.
  return { name: author }
}
