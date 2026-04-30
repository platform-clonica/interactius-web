/**
 * PlusArrowFlipIcon — line-mask vertical entre + y flecha-up-right.
 *
 * Stack vertical de 2 iconos 40×40 dentro de un mask 40×40. Al activar
 * `group-hover` en el ancestro, el stack se traslada -40px → la PLUS sale
 * por arriba del mask y la FLECHA aparece desde abajo. Misma duración y
 * easing que el line-mask flip del menú (0.5s, cubic-bezier(.45,0,.15,1)).
 *
 * Requiere que un ancestro tenga la clase `group` para que el `group-hover`
 * dispare la animación.
 *
 * Uso:
 *   <Link className="group ...">
 *     <PlusArrowFlipIcon />
 *     ...
 *   </Link>
 */
export function PlusArrowFlipIcon() {
  return (
    <div className="relative size-10 overflow-hidden">
      <div
        className="flex flex-col will-change-transform
                   transition-transform duration-500 ease-[cubic-bezier(.45,0,.15,1)]
                   group-hover:-translate-y-10"
      >
        {/* PLUS — 40×40, mismas dimensiones que el PlusIcon canónico */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <line x1="20" y1="0" x2="20" y2="40" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="20" x2="40" y2="20" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        {/* FLECHA — misma geometría que CapacityOthersAnim (services link),
            escalada proporcionalmente de viewBox 24 a 40 (×1.667) para
            ocupar el mismo espacio que el PLUS. */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <line x1="10" y1="27" x2="33" y2="3" stroke="currentColor" strokeWidth="1.5" />
          <polyline points="7,3 33,3 33,30" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  )
}
