import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { Login } from '@/components/clientes/Login'
import { PanelAdmin } from '@/components/clientes/PanelAdmin'
import { ServicioNoDisponible } from '@/components/clientes/ServicioNoDisponible'
import { usuarioDeSesion } from '@/lib/clientes/access'
import { almacenes, secretoSesion } from '@/lib/clientes/config'
import { resumenAdmin } from '@/lib/clientes/operations'
import { COOKIE_SESION } from '@/lib/clientes/session'

export const dynamic = 'force-dynamic'

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

  return (
    <PanelAdmin emailAdmin={emailAdmin} artefactos={datos.artefactos} usuarios={datos.usuarios} hecho={hecho} />
  )
}
