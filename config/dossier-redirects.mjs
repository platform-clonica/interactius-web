/**
 * config/dossier-redirects.mjs
 * ─────────────────────────────────────────────────────────────────────
 * Redirecciones 308 de dossiers que han cambiado de sitio. A mano, al
 * contrario que `miradas-redirects.mjs` y `root-slug-redirects.mjs`, que
 * los genera un script desde el contenido y se sobreescriben solos.
 *
 * Por qué existe este archivo: el dossier de comercio agéntico se publicó
 * el 2 de noviembre de 2026 en la raíz y se movió bajo /miradas ese mismo
 * día, al decidir que su sitio estaba dentro de la sección y no al lado.
 * Estuvo unos minutos en la URL vieja, pero esos minutos bastan para que
 * alguien la copiara en un chat o en un correo. Un enlace compartido no
 * caduca porque nosotros cambiemos de idea.
 *
 * Las tres rutas del idioma, porque el segmento está localizado.
 */

export const dossierRedirects = [
  { source: '/comercio-agentico', destination: '/miradas/comercio-agentico' },
  { source: '/es/comercio-agentico', destination: '/es/miradas/comercio-agentico' },
  { source: '/ca/comerc-agentic', destination: '/ca/mirades/comerc-agentic' },
  { source: '/en/agentic-commerce', destination: '/en/thoughts/agentic-commerce' },
]
