import { resolveAuthor } from '@/lib/data/author'

/* AuthorByline — la firma que va bajo la foto del autor en un artículo.

   Antes decía "Maria, 15 de enero de 2026": nombre de pila y fecha. Ahora
   lleva nombre y apellido arriba y el rol debajo. El rol es la pieza que
   faltaba: para un buscador de respuestas no es lo mismo una web que publica
   cosas que un texto firmado por alguien de quien se sabe a qué se dedica.

   La fecha se ha ido a la fila de datos del artículo, junto al tiempo de
   lectura. Aquí la firma responde a quién escribe; cuándo se publicó es un
   dato de la pieza, no de la persona.

   Quien ya no está en el equipo no tiene rol en el registro, así que su firma
   se queda solo en el nombre. Son 34 de los 132 artículos.

   El nombre va en `medium` y el resto en el color atenuado: así la jerarquía
   la marcan el peso y el tono, sin meter un tamaño nuevo fuera de escala. */
export function AuthorByline({
  author,
  className = '',
}: {
  /** El nombre tal como viene del frontmatter del MDX. */
  author: string
  className?: string
}) {
  const { name, role } = resolveAuthor(author)

  return (
    <span
      className={`block bg-pure-white px-1.5 py-1 font-mono text-card-sm leading-[1.35] text-fg ${className}`.trim()}
    >
      <span className="block whitespace-nowrap font-medium">{name}</span>
      {role ? <span className="block whitespace-nowrap text-fg/60">{role}</span> : null}
    </span>
  )
}
