import { notFound } from 'next/navigation'

/**
 * Catch-all route que activa el not-found.tsx localizado para cualquier
 * path bajo /[locale]/* que no matchee ninguna ruta concreta.
 *
 * Patrón canónico recomendado por next-intl
 * (https://next-intl.dev/docs/environments/error-files#not-foundjs):
 * sin esto, Next sirve el /_not-found global por defecto en lugar de
 * /[locale]/not-found.tsx.
 *
 * Tiene la prioridad de routing más baja (catch-all), así que cualquier
 * page.tsx más específico gana.
 */
export default function CatchAllNotFound() {
  notFound()
}
