import type { ReactNode } from 'react'

/* DossierSection — el contenedor de ancho del dossier.

   Todas las páginas de la web arrancan el contenido en la segunda columna de
   las doce: la primera queda libre para que el imagotipo vertical de la barra
   lateral no se coma el texto. `section-inner` solo pone el margen de página,
   así que sin este desplazamiento el dossier empezaba 101 px más a la
   izquierda que el resto del sitio (una columna más su medianil) y se leía
   pegado al logo.

   Por debajo de `lg` no hay barra lateral, así que el contenido ocupa las
   doce columnas.

   Las rejillas internas de cada pieza siguen declarando sus propias doce
   columnas: son rejillas anidadas dentro de este bloque, igual que hace
   `MDXContent` con los artículos. */
export function DossierSection({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`section-inner grid grid-cols-12 gap-x-grid-gutter ${className}`.trim()}>
      <div className="col-span-12 lg:col-start-2 lg:col-span-11">{children}</div>
    </div>
  )
}
