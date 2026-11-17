/* Clases compartidas de la zona de clientes (solo tokens del tailwind.config
   del sitio; cada borde con `border-solid`, no hay preflight). */

/** Alto común de cajas, campos y botones de una misma fila. */
export const ALTO = 'h-10' // 40 px: la escala del sitio salta de h-8 (32) a h-10 (40); h-9 no existe

/** Botón secundario: borde fino, se rellena de negro al pasar el ratón. */
export const BOTON = `${ALTO} inline-flex shrink-0 items-center border border-solid border-fg/30 px-3 text-micro uppercase tracking-[0.08em] transition-colors hover:border-fg hover:bg-dark hover:text-warm-light`

/** Botón principal: negro. */
export const BOTON_PRINCIPAL = `${ALTO} inline-flex shrink-0 items-center border border-solid border-fg bg-dark px-3 text-micro uppercase tracking-[0.08em] text-warm-light transition-opacity hover:opacity-85 disabled:opacity-50`

/** Caja de texto (campo o valor de solo lectura). */
export const CAJA = `${ALTO} min-w-0 border border-solid border-fg/15 bg-bg px-3 text-micro`
