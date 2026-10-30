import type { ReactNode } from 'react'

/* DossierRule — el filete con rótulo que separa secciones del dossier.

   Es el recurso que da el carácter de periódico sin añadir ornamento: una
   línea de 1px y una etiqueta en mono pequeño, como los rótulos de sección de
   un diario. Todo el dossier lo usa, así que el ritmo vertical queda igual en
   todas las secciones sin repetir medidas a mano. */
export function DossierRule({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 border-t border-fg/25 pt-3">
      <span className="font-mono text-caption uppercase tracking-[0.14em] text-fg/60 whitespace-nowrap">
        {label}
      </span>
      {children ? (
        <span className="font-mono text-caption text-fg/40 whitespace-nowrap">{children}</span>
      ) : null}
    </div>
  )
}
