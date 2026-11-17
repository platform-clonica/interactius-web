import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { Login } from '@/components/clientes/Login'
import { ServicioNoDisponible } from '@/components/clientes/ServicioNoDisponible'
import { Visor } from '@/components/clientes/Visor'
import { puedeVer, registrarAcceso, usuarioDeSesion } from '@/lib/clientes/access'
import { almacenes, secretoSesion } from '@/lib/clientes/config'
import { crearTokenArchivo } from '@/lib/clientes/file-tokens'
import { ID_ARTEFACTO_RE } from '@/lib/clientes/ids'
import { leerArtefacto } from '@/lib/clientes/repo'
import { COOKIE_SESION } from '@/lib/clientes/session'
import type { Almacenes } from '@/lib/clientes/store'
import type { Artefacto, Usuario } from '@/lib/clientes/types'

export const dynamic = 'force-dynamic'

type Carga =
  | { estado: 'no-disponible' }
  | { estado: 'sin-sesion' }
  | { estado: 'ok'; a: Almacenes; secreto: string; usuario: Usuario; artefacto: Artefacto | null }

/** Todo lo que puede fallar por infraestructura, en un solo try. */
async function cargar(id: string, ahora: number): Promise<Carga> {
  try {
    const a = almacenes()
    const secreto = secretoSesion()
    const token = (await cookies()).get(COOKIE_SESION)?.value
    const usuario = await usuarioDeSesion(a, token, ahora, secreto)
    if (!usuario) return { estado: 'sin-sesion' }
    const artefacto = ID_ARTEFACTO_RE.test(id) ? await leerArtefacto(a, id) : null
    return { estado: 'ok', a, secreto, usuario, artefacto }
  } catch (e) {
    console.error('[clientes] visor', e)
    return { estado: 'no-disponible' }
  }
}

const codificarRuta = (ruta: string) => ruta.split('/').map(encodeURIComponent).join('/')

export default async function ArtefactoPage({
  params,
  searchParams,
}: {
  params: Promise<{ cliente: string; id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { cliente, id } = await params
  const { error } = await searchParams
  const volver = `/clientes/${cliente}/${id}`
  const ahora = Date.now()

  const c = await cargar(id, ahora)
  if (c.estado === 'no-disponible') return <ServicioNoDisponible />
  if (c.estado === 'sin-sesion') return <Login next={volver} error={error} />

  const { a, secreto, usuario, artefacto } = c
  // Misma respuesta si no existe, si el cliente no cuadra o si no es suyo.
  if (!artefacto || artefacto.cliente !== cliente || !puedeVer(usuario, artefacto)) notFound()

  if (!usuario.admin) {
    await registrarAcceso(a, id, usuario.email, ahora).catch((e) =>
      console.error('[clientes] registrar acceso', e),
    )
  }

  const { token, expira } = crearTokenArchivo(id, artefacto.version, ahora, secreto)
  return (
    <Visor
      titulo={artefacto.titulo}
      src={`/clientes/archivos/${id}/${token}/${codificarRuta(artefacto.entrada)}`}
      expira={expira}
      email={usuario.email}
      volver={volver}
    />
  )
}
