'use client'

import { useCallback, useRef } from 'react'

import { HONEYPOT_FIELD } from '@/lib/forms/antispam'

/* ==========================================================================
   useAntiSpam — lado cliente de las dos trampas antispam
   --------------------------------------------------------------------------
   Compartido por las cuatro variantes de ContactForm. La decisión de descartar
   NO se toma aquí: esto solo añade los dos datos al payload. Quien decide es
   `spamReason()` en el servidor — un bot que hace POST directo al endpoint
   nunca ejecuta este código, así que una comprobación en el cliente no
   serviría de nada.

   Ver `lib/forms/antispam.ts` para el porqué de cada trampa.
   ========================================================================== */

export function useAntiSpam() {
  /* Momento de montaje del formulario. En un ref y no en estado: cambiarlo no
     debe repintar nada. */
  const mountedAt = useRef(Date.now())
  const honeypotRef = useRef<HTMLInputElement>(null)

  /** Añade los campos antispam al payload justo antes de enviarlo. */
  const withAntiSpam = useCallback(
    <T extends object>(data: T) => ({
      ...data,
      [HONEYPOT_FIELD]: honeypotRef.current?.value ?? '',
      elapsedMs: Date.now() - mountedAt.current,
    }),
    [],
  )

  return { honeypotRef, withAntiSpam }
}

/* ==========================================================================
   HoneypotField — el campo trampa
   --------------------------------------------------------------------------
   Tiene que estar en el DOM para que el bot lo encuentre y, a la vez, ser
   invisible e inalcanzable para una persona:

     · `sr-only` lo saca de la vista sin usar `display:none` (que algunos bots
       detectan) y sin provocar scroll horizontal, al contrario que el clásico
       `left: -9999px`.
     · `aria-hidden` lo retira del árbol de accesibilidad: un lector de
       pantalla no lo anuncia, así que nadie lo rellena sin querer.
     · `tabIndex={-1}` lo saca del recorrido con teclado.
     · `autoComplete="off"` + un nombre que ningún gestor de contraseñas
       reconoce evitan que el autofill lo rellene y marque como bot a una
       persona real. Esto último es el riesgo serio de un honeypot mal puesto.
   ========================================================================== */

export function HoneypotField({
  inputRef,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="sr-only" aria-hidden="true">
      <label htmlFor={HONEYPOT_FIELD}>Asunto</label>
      <input
        ref={inputRef}
        id={HONEYPOT_FIELD}
        name={HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  )
}
