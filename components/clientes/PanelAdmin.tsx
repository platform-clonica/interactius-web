import type { FilaAdmin, UsuarioPublico } from '@/lib/clientes/operations'
import { SITE_CONFIG } from '@/lib/seo/metadata.config'

import { BotonSalir } from './BotonSalir'
import { CopiarEnlace } from './CopiarEnlace'

/* ==========================================================================
   Panel admin — vista (sin datos ni sesión: los recibe por props)
   --------------------------------------------------------------------------
   Mismas reglas de estilo que `Marco.tsx`: solo tokens del tailwind.config
   del sitio y `border-solid` en cada borde.
   ========================================================================== */

const MENSAJES: Record<string, string> = {
  revocado: 'Acceso revocado.',
  desactivado: 'Usuario desactivado.',
  'no-a-ti-mismo': 'No puedes desactivar tu propia cuenta.',
  error: 'No se pudo completar la acción (el artefacto o el usuario ya no existe).',
}

const fecha = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' })
    : '—'

const CAPTION = 'text-micro uppercase tracking-[0.12em] text-fg/60'
const ACCION =
  'h-8 border border-solid border-fg/30 px-3 text-micro uppercase tracking-[0.08em] transition-colors hover:border-fg hover:bg-dark hover:text-warm-light'

export function PanelAdmin({
  emailAdmin,
  artefactos,
  usuarios,
  hecho,
}: {
  emailAdmin: string
  artefactos: FilaAdmin[]
  usuarios: UsuarioPublico[]
  hecho?: string
}) {
  const porCliente = new Map<string, FilaAdmin[]>()
  for (const fila of artefactos) {
    const lista = porCliente.get(fila.artefacto.cliente)
    if (lista) lista.push(fila)
    else porCliente.set(fila.artefacto.cliente, [fila])
  }
  const mensaje = hecho && Object.hasOwn(MENSAJES, hecho) ? MENSAJES[hecho] : undefined

  return (
    <div className="min-h-dvh">
      {/* Misma barra que el visor de artefactos. */}
      <header className="flex h-8 items-center justify-between gap-4 bg-dark px-4 text-[11px] text-warm-light">
        <span className="flex min-w-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG estático */}
          <img src="/logo/isotipo-positivo.svg" alt="interactius" className="h-4 w-4 shrink-0 outline outline-1 outline-warm-light/40" />
          <span className="opacity-40">|</span>
          <span className="truncate">Área de clientes · Admin</span>
        </span>
        <span className="flex shrink-0 items-center gap-4">
          <span className="hidden opacity-60 sm:inline">{emailAdmin}</span>
          <BotonSalir next="/clientes/admin" />
        </span>
      </header>

      <main className="mx-auto max-w-[1024px] px-6 pb-24 pt-16">
        <h1 className="font-[family-name:var(--font-ft-serif)] text-section font-light">Artefactos de clientes</h1>
        <p className="mt-4 max-w-prose text-label text-fg/70">
          Para publicar, actualizar o dar acceso, pídeselo a Claude. Aquí puedes copiar los enlaces, ver quién
          ha entrado y revocar accesos.
        </p>

        {mensaje && (
          <p role="status" className="mt-8 border-l-2 border-solid border-fg pl-3 text-label">
            {mensaje}
          </p>
        )}

        {porCliente.size === 0 && (
          <p className="mt-16 text-label text-fg/70">Todavía no hay artefactos publicados.</p>
        )}

        {[...porCliente].map(([cliente, filas]) => (
          <section key={cliente} className="mt-16">
            <h2 className={`${CAPTION} border-b border-solid border-fg/15 pb-3`}>
              {cliente} <span className="opacity-60">· {filas.length}</span>
            </h2>
            <ul className="mt-6 flex flex-col gap-6">
              {filas.map(({ artefacto: art, personas }) => (
                <li key={art.id} className="border border-solid border-fg/15 bg-surface p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <p className="font-[family-name:var(--font-ft-serif)] text-subtitle font-light">{art.titulo}</p>
                    <p className={CAPTION}>
                      v{art.version} · {fecha(art.publicadoEn)}
                    </p>
                  </div>

                  <div className="mt-4">
                    <CopiarEnlace url={`${SITE_CONFIG.baseUrl}/clientes/${art.cliente}/${art.id}`} />
                  </div>

                  {art.avisos.map((av) => (
                    <p key={av} className="mt-3 border-l-2 border-solid border-fg pl-3 text-micro">
                      {av}
                    </p>
                  ))}

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[480px] table-fixed text-left text-label">
                      <colgroup>
                        <col className="w-1/2" />
                        <col className="w-[35%]" />
                        <col className="w-[15%]" />
                      </colgroup>
                      <thead>
                        <tr className={CAPTION}>
                          <th className="pb-2 font-normal">Persona con acceso</th>
                          <th className="pb-2 font-normal">Último acceso</th>
                          <th className="pb-2" aria-label="Acciones" />
                        </tr>
                      </thead>
                      <tbody>
                        {personas.length === 0 && (
                          <tr className="border-t border-solid border-fg/10">
                            <td colSpan={3} className="py-3 text-fg/60">Nadie tiene acceso todavía.</td>
                          </tr>
                        )}
                        {personas.map((p) => (
                          <tr key={p.email} className="border-t border-solid border-fg/10">
                            <td className="py-3 pr-4">
                              {p.email}
                              {!p.activo && <span className="text-fg/50"> · desactivado</span>}
                            </td>
                            <td className="py-3 pr-4 text-fg/60">{fecha(p.ultimoAcceso)}</td>
                            <td className="py-2 text-right">
                              <form method="post" action="/clientes/admin/revocar">
                                <input type="hidden" name="id" value={art.id} />
                                <input type="hidden" name="email" value={p.email} />
                                <button type="submit" className={ACCION}>Revocar</button>
                              </form>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-24">
          <h2 className={`${CAPTION} border-b border-solid border-fg/15 pb-3`}>
            Usuarios <span className="opacity-60">· {usuarios.length}</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] table-fixed text-left text-label">
              <colgroup>
                <col className="w-1/2" />
                <col className="w-[17.5%]" />
                <col className="w-[17.5%]" />
                <col className="w-[15%]" />
              </colgroup>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.email} className="border-b border-solid border-fg/10">
                    <td className="py-3 pr-4">{u.email}</td>
                    <td className="py-3 pr-4 text-fg/60">{u.admin ? 'Admin' : 'Cliente'}</td>
                    <td className="py-3 pr-4 text-fg/60">{u.activo ? 'Activo' : 'Desactivado'}</td>
                    <td className="py-2 text-right">
                      {u.activo && u.email !== emailAdmin && (
                        <form method="post" action="/clientes/admin/usuarios/desactivar">
                          <input type="hidden" name="email" value={u.email} />
                          <button type="submit" className={ACCION}>Desactivar</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
