import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { BotonSalir } from '@/components/clientes/BotonSalir'
import { CopiarEnlace } from '@/components/clientes/CopiarEnlace'
import { Login } from '@/components/clientes/Login'
import { ServicioNoDisponible } from '@/components/clientes/ServicioNoDisponible'
import { usuarioDeSesion } from '@/lib/clientes/access'
import { almacenes, secretoSesion } from '@/lib/clientes/config'
import { resumenAdmin, type FilaAdmin } from '@/lib/clientes/operations'
import { COOKIE_SESION } from '@/lib/clientes/session'
import { SITE_CONFIG } from '@/lib/seo/metadata.config'

export const dynamic = 'force-dynamic'

const MENSAJES: Record<string, string> = {
  revocado: 'Acceso revocado.',
  desactivado: 'Usuario desactivado.',
  'no-a-ti-mismo': 'No puedes desactivar tu propia cuenta.',
  error: 'No se pudo completar la acción (el artefacto o el usuario ya no existe).',
}

type Carga =
  | { estado: 'no-disponible' }
  | { estado: 'sin-sesion' }
  | { estado: 'no-admin' }
  | { estado: 'ok'; emailAdmin: string; datos: Awaited<ReturnType<typeof resumenAdmin>> }

/* notFound() se llama fuera del try: lanza una excepción que Next debe recibir. */
async function cargar(): Promise<Carga> {
  try {
    const a = almacenes()
    const token = (await cookies()).get(COOKIE_SESION)?.value
    const usuario = await usuarioDeSesion(a, token, Date.now(), secretoSesion())
    if (!usuario) return { estado: 'sin-sesion' }
    if (!usuario.admin) return { estado: 'no-admin' }
    return { estado: 'ok', emailAdmin: usuario.email, datos: await resumenAdmin(a) }
  } catch (e) {
    console.error('[clientes] admin', e)
    return { estado: 'no-disponible' }
  }
}

const fecha = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' })
    : 'nunca'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; hecho?: string }>
}) {
  const { error, hecho } = await searchParams
  const c = await cargar()
  if (c.estado === 'no-disponible') return <ServicioNoDisponible />
  if (c.estado === 'sin-sesion') return <Login next="/clientes/admin" error={error} />
  if (c.estado === 'no-admin') notFound()
  const { datos, emailAdmin } = c

  const porCliente = new Map<string, FilaAdmin[]>()
  for (const fila of datos.artefactos) {
    const lista = porCliente.get(fila.artefacto.cliente)
    if (lista) lista.push(fila)
    else porCliente.set(fila.artefacto.cliente, [fila])
  }

  return (
    <main className="mx-auto max-w-[1024px] px-6 py-10">
      <header className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-[family-name:var(--font-ft-serif)] text-section font-light">Artefactos de clientes</h1>
        <span className="flex items-center gap-4 text-label">
          <span className="opacity-60">{emailAdmin}</span>
          <BotonSalir next="/clientes/admin" />
        </span>
      </header>

      {hecho && Object.hasOwn(MENSAJES, hecho) && (
        <p role="status" className="mb-6 text-label">{MENSAJES[hecho]}</p>
      )}

      <p className="mb-10 max-w-prose text-label opacity-70">
        Para publicar, actualizar o dar acceso, pídeselo a Claude. Aquí puedes consultar y revocar.
      </p>

      {porCliente.size === 0 && <p>Todavía no hay artefactos publicados.</p>}

      {[...porCliente].map(([cliente, filas]) => (
        <section key={cliente} className="mb-12">
          <h2 className="mb-4 font-[family-name:var(--font-ft-mono)] text-label uppercase tracking-[0.12em]">{cliente}</h2>
          <ul className="flex flex-col gap-6">
            {filas.map(({ artefacto: art, personas }) => (
              <li key={art.id} className="border-t border-solid border-fg/15 pt-4">
                <p className="text-body">{art.titulo}</p>
                <p className="mb-2 text-micro opacity-60">
                  v{art.version} · publicado {fecha(art.publicadoEn)}
                </p>
                <CopiarEnlace url={`${SITE_CONFIG.baseUrl}/clientes/${art.cliente}/${art.id}`} />
                {art.avisos.map((av) => (
                  <p key={av} className="mt-2 text-micro">⚠ {av}</p>
                ))}
                <table className="mt-4 w-full text-label">
                  <tbody>
                    {personas.length === 0 && (
                      <tr><td className="py-1 opacity-60">Nadie tiene acceso todavía.</td></tr>
                    )}
                    {personas.map((p) => (
                      <tr key={p.email} className="align-top">
                        <td className="py-1 pr-4">{p.email}{!p.activo && ' (desactivado)'}</td>
                        <td className="py-1 pr-4 opacity-60">último acceso: {fecha(p.ultimoAcceso)}</td>
                        <td className="py-1 text-right">
                          <form method="post" action="/clientes/admin/revocar">
                            <input type="hidden" name="id" value={art.id} />
                            <input type="hidden" name="email" value={p.email} />
                            <button type="submit" className="underline underline-offset-4">Revocar</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-16">
        <h2 className="mb-4 font-[family-name:var(--font-ft-mono)] text-label uppercase tracking-[0.12em]">Usuarios</h2>
        <table className="w-full text-label">
          <tbody>
            {datos.usuarios.map((u) => (
              <tr key={u.email} className="border-t border-solid border-fg/15">
                <td className="py-2 pr-4">{u.email}{u.admin && ' · admin'}</td>
                <td className="py-2 pr-4 opacity-60">{u.activo ? 'activo' : 'desactivado'}</td>
                <td className="py-2 text-right">
                  {u.activo && u.email !== emailAdmin && (
                    <form method="post" action="/clientes/admin/usuarios/desactivar">
                      <input type="hidden" name="email" value={u.email} />
                      <button type="submit" className="underline underline-offset-4">Desactivar</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
