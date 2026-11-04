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
 * COBERTURA, TRAS EL REPASO DEL 4/11/2026
 * Toda firma de Miradas resuelve a nombre completo y rol, salvo
 * "Interactius", que es autoría colectiva y no una persona: ese se queda sin
 * rol a propósito. Los roles salen de dos sitios, el equipo actual y la lista
 * de colaboradores pasados de aquí abajo.
 *
 * Si mañana aparece una firma desconocida, la función devuelve el nombre tal
 * cual y sin rol. La firma nunca empeora: o gana apellido y rol, o se queda
 * como estaba.
 */

import { TEAM } from '@/lib/data/team'

/* Personas que firmaron en Miradas y ya no están en el equipo. Van aquí y no
   en `lib/data/team.ts` a propósito: ese archivo pinta la página de
   Identidad, y meterlas allí las devolvería a la plantilla. Para quien lee el
   artículo el resultado es el mismo; la diferencia es que nadie reaparece en
   Identidad por error.

   Datos confirmados por Martina el 4/11/2026.

   Los nombres se escriben como se escriben, con sus tildes y su eñe, y se
   normalizan abajo al construir el índice. Escribirlos ya normalizados a mano
   era pedir un error: "Nuñez" normaliza a "nunez", y una clave con eñe no
   casaba nunca con la búsqueda. */
const COLABORADORES: Record<string, string> = {
  'Regli Nuñez': 'Researcher',
  'David Úbeda': 'Business Developer',
  'Beatriz Zaragoza': 'Researcher Strategist',
}

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

/** Índice de colaboradores con las claves ya normalizadas. */
const COLABORADORES_INDEX = new Map(
  Object.entries(COLABORADORES).map(([nombre, rol]) => [normalize(nombre), rol]),
)

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

  // 3 · Colaboradores que ya no están en el equipo.
  const rol = COLABORADORES_INDEX.get(buscado)
  if (rol) return { name: author, role: rol }

  /* 4 · "Interactius" es autoría colectiva, no una persona, así que se queda
         sin rol a propósito. Cualquier otra firma que no reconozcamos
         conserva su nombre, que es lo que la web mostraba antes. */
  return { name: author }
}
