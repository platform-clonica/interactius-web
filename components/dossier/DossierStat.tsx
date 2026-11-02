'use client'

import { DossierBar } from './DossierBar'
import { DossierCounter } from './DossierCounter'

/* DossierStat — una comparativa corta de dos cifras, sobre fondo claro.

   Nace para el dato de Gartner del artículo de Sara: un 31 % aceptaría que
   una IA le acote las opciones, pero solo un 11 % le dejaría decidir la
   compra. La distancia entre esas dos cifras es el argumento, así que el
   gráfico tiene que dejarla a la vista: dos barras a la misma escala, no dos
   números sueltos.

   SOBRE EL COLOR DE LAS BARRAS
   El acento del servicio al que pertenece el artículo es Opal, y Opal sobre
   el fondo de la web da 1,87 : 1. Una barra en Opal sería prácticamente
   invisible, así que las barras van en el color de texto y la pista en el
   mismo al 10 %. El acento del servicio ya está presente en la etiqueta del
   artículo de al lado, que es donde cumple su función de identificar.

   Las barras crecen al entrar en pantalla. El dato está escrito en el texto,
   así que la animación no es la que informa: si no corre, no se pierde nada.
   Por eso el ancho final se fija en el estilo en línea y la animación solo lo
   recorre desde cero. */
export function DossierStat({
  eyebrow,
  title,
  rows,
  note,
}: {
  eyebrow: string
  title: string
  rows: { figure: string; unit: string; label: string; pct: number }[]
  note: string
}) {
  return (
    <div className="border-t border-fg/25 pt-6">
      <p className="font-mono text-caption uppercase tracking-[0.14em] text-fg/50">{eyebrow}</p>
      <h3 className="mt-3 font-serif text-title-sm font-light text-fg">{title}</h3>

      <dl className="mt-7 flex flex-col gap-6">
        {rows.map((r) => (
          <div key={r.figure}>
            <dt className="flex items-baseline gap-2 font-serif font-light text-fg">
              <DossierCounter value={r.figure} className="text-title tabular-nums" />
              <span className="text-title-sm text-fg/60">{r.unit}</span>
            </dt>
            <DossierBar pct={r.pct} pista="bg-fg/10" relleno="bg-fg" alto="h-2" />
            <dd className="mt-3 font-mono text-micro leading-[1.6] text-fg/70">{r.label}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-7 font-mono text-micro leading-[1.6] text-fg">{note}</p>
    </div>
  )
}
