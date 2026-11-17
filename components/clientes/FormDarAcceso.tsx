'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import type { ResultadoDarAcceso } from '@/lib/clientes/panel'

import { BotonCopiar } from './CopiarEnlace'
import { BOTON_PRINCIPAL, CAJA } from './estilos'

const FALLO: ResultadoDarAcceso = {
  ok: false,
  mensaje: 'No se pudo completar. Comprueba la conexión e inténtalo de nuevo.',
}

/** Formulario «Dar acceso» de una tarjeta del panel admin. */
export function FormDarAcceso({ id }: { id: string }) {
  const router = useRouter()
  const [resultado, setResultado] = useState<ResultadoDarAcceso | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setEnviando(true)
    setResultado(null)
    try {
      const res = await fetch('/clientes/admin/dar-acceso', { method: 'POST', body: new FormData(form) })
      const r = (await res.json().catch(() => FALLO)) as ResultadoDarAcceso
      setResultado(r)
      if (r.ok) {
        form.reset()
        router.refresh() // actualiza la tabla de accesos sin perder este recuadro
      }
    } catch {
      setResultado(FALLO)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mt-6">
      <form onSubmit={enviar} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <label className="sr-only" htmlFor={`email-${id}`}>Correo de la persona</label>
        <input
          id={`email-${id}`}
          name="email"
          type="email"
          required
          autoComplete="off"
          placeholder="correo@cliente.com"
          className={`${CAJA} flex-1 bg-surface placeholder:text-fg/40 focus:border-fg`}
        />
        <button type="submit" disabled={enviando} className={BOTON_PRINCIPAL}>
          {enviando ? 'Dando acceso…' : 'Dar acceso'}
        </button>
      </form>

      {resultado && !resultado.ok && (
        <p role="alert" className="mt-3 border-l-2 border-solid border-fg pl-3 text-micro">
          {resultado.mensaje}
        </p>
      )}

      {resultado?.ok && (
        <div role="status" className="mt-3 border border-solid border-fg bg-bg p-4 text-micro">
          <p className="uppercase tracking-[0.08em]">Acceso concedido a {resultado.email}</p>
          {resultado.password ? (
            <>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <dt className="text-fg/60">Enlace</dt>
                <dd className="break-all">{resultado.enlace}</dd>
                <dt className="text-fg/60">Usuario</dt>
                <dd>{resultado.email}</dd>
                <dt className="text-fg/60">Contraseña</dt>
                <dd className="font-semibold">{resultado.password}</dd>
              </dl>
              <p className="mt-3 text-fg/70">
                La contraseña solo se muestra ahora. Envíala por un canal distinto al del enlace.
              </p>
              <div className="mt-3">
                <BotonCopiar
                  etiqueta="Copiar datos"
                  texto={`${resultado.titulo}\nEnlace: ${resultado.enlace}\nUsuario: ${resultado.email}\nContraseña: ${resultado.password}`}
                />
              </div>
            </>
          ) : (
            <p className="mt-2 text-fg/70">
              Ya tenía cuenta: entra con su contraseña de siempre. Envíale el enlace.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
