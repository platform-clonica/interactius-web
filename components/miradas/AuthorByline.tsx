import { resolveAuthor } from '@/lib/data/author'

/* AuthorByline — la firma que va bajo la foto del autor en un artículo.

   Antes decía "Maria, 15 de enero de 2026": nombre de pila y fecha. Ahora
   lleva nombre y apellido en una línea y, debajo, el rol y la fecha. El rol
   es la pieza que faltaba: para un buscador de respuestas no es lo mismo una
   web que publica cosas que un texto firmado por alguien de quien se sabe a
   qué se dedica.

   Quien ya no está en el equipo no tiene rol en el registro, así que su firma
   se queda en nombre y fecha, igual que antes. Son 34 de los 132 artículos.
   La firma nunca empeora: o gana apellido y rol, o se queda como estaba.

   El nombre va en `medium` y el resto en el color atenuado: así la jerarquía
   la marcan el peso y el tono, sin meter un tamaño nuevo fuera de escala. */
export function AuthorByline({
  author,
  date,
  className = '',
}: {
  /** El nombre tal como viene del frontmatter del MDX. */
  author: string
  /** La fecha ya formateada en el idioma de la página. */
  date: string
  className?: string
}) {
  const { name, role } = resolveAuthor(author)

  return (
    <span
      className={`block bg-pure-white px-1.5 py-1 font-mono text-card-sm leading-[1.35] text-fg ${className}`.trim()}
    >
      <span className="block whitespace-nowrap font-medium">{name}</span>
      <span className="block whitespace-nowrap text-fg/60">{role ? `${role}, ${date}` : date}</span>
    </span>
  )
}
