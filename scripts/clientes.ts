/* ==========================================================================
   CLI de la zona privada de clientes
   --------------------------------------------------------------------------
   npm run clientes -- <comando> --entorno production|staging [opciones]

   Requiere en el entorno local (nunca en el repo):
     NETLIFY_SITE_ID     ID del sitio en Netlify
     NETLIFY_AUTH_TOKEN  token personal de Netlify

   Las contraseñas solo se imprimen aquí, una vez. No se guardan en claro.
   ========================================================================== */

import { parseArgs } from 'node:util'
import { fileURLToPath } from 'node:url'

import { URL_BASE, leerDirectorioArtefacto } from '../lib/clientes/cli-files'
import { crearAlmacenesNetlify } from '../lib/clientes/netlify-store'
import {
  ErrorOperacion,
  borrarArtefacto,
  crearAdmin,
  darAcceso,
  detectarAvisos,
  publicar,
  quitarAcceso,
  regenerarPassword,
  republicar,
  resumenAdmin,
} from '../lib/clientes/operations'
import type { Artefacto, Entorno } from '../lib/clientes/types'

const AYUDA = `Uso: npm run clientes -- <comando> --entorno production|staging [opciones]

  publicar           --cliente <slug> --titulo "<t>" --origen <url> --dir <carpeta> [--entrada index.html] [--aceptar-avisos]
  republicar         --id <id> --dir <carpeta> [--entrada <ruta>] [--aceptar-avisos]
  dar-acceso         --id <id> --email <correo> [--reactivar]
  quitar-acceso      --id <id> --email <correo>
  regenerar-password --email <correo> [--reactivar]
  crear-admin        --email <correo@interactius.com>
  listar             [--cliente <slug>]
  borrar             --id <id> --si`

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    entorno: { type: 'string' },
    cliente: { type: 'string' },
    titulo: { type: 'string' },
    origen: { type: 'string' },
    dir: { type: 'string' },
    entrada: { type: 'string' },
    id: { type: 'string' },
    email: { type: 'string' },
    'aceptar-avisos': { type: 'boolean', default: false },
    reactivar: { type: 'boolean', default: false },
    si: { type: 'boolean', default: false },
  },
})

function requerir(nombre: keyof typeof values): string {
  const v = values[nombre]
  if (typeof v !== 'string' || !v.trim()) throw new ErrorOperacion(`Falta --${nombre}.\n\n${AYUDA}`)
  return v.trim()
}

const enlace = (entorno: Entorno, art: Artefacto) =>
  `${URL_BASE[entorno]}/clientes/${art.cliente}/${art.id}`

async function main() {
  const comando = positionals[0]
  if (!comando) throw new ErrorOperacion(AYUDA)

  const entorno = requerir('entorno')
  if (entorno !== 'production' && entorno !== 'staging') {
    throw new ErrorOperacion('--entorno debe ser production o staging.')
  }
  const siteID = process.env.NETLIFY_SITE_ID
  const token = process.env.NETLIFY_AUTH_TOKEN
  if (!siteID || !token) {
    throw new ErrorOperacion('Faltan NETLIFY_SITE_ID y/o NETLIFY_AUTH_TOKEN en el entorno.')
  }
  const a = crearAlmacenesNetlify(entorno, { siteID, token })
  const ahora = Date.now()
  const publicadoPor = 'claude-code'

  async function archivosConAvisos() {
    // scripts/ está un nivel por debajo de la raíz del repo.
    const raizRepo = fileURLToPath(new URL('..', import.meta.url))
    const archivos = await leerDirectorioArtefacto(requerir('dir'), raizRepo)
    const avisos = detectarAvisos(archivos)
    if (avisos.length && !values['aceptar-avisos']) {
      throw new ErrorOperacion(
        `No se publica: el artefacto tiene avisos.\n- ${avisos.join('\n- ')}\nRepite con --aceptar-avisos si se publica igualmente.`,
      )
    }
    return { archivos, avisos }
  }

  switch (comando) {
    case 'publicar': {
      const { archivos, avisos } = await archivosConAvisos()
      const art = await publicar(
        a,
        {
          cliente: requerir('cliente'),
          titulo: requerir('titulo'),
          origen: requerir('origen'),
          entrada: values.entrada ?? 'index.html',
          archivos,
          avisos,
          publicadoPor,
        },
        ahora,
      )
      console.log(`Publicado (${archivos.length} archivos).\nID: ${art.id}\nEnlace: ${enlace(entorno, art)}`)
      if (avisos.length) console.log(`Avisos:\n- ${avisos.join('\n- ')}`)
      break
    }
    case 'republicar': {
      const { archivos, avisos } = await archivosConAvisos()
      const art = await republicar(
        a,
        requerir('id'),
        { archivos, avisos, entrada: values.entrada, publicadoPor },
        ahora,
      )
      console.log(`Republicado como versión ${art.version}. Mismo enlace: ${enlace(entorno, art)}`)
      break
    }
    case 'dar-acceso': {
      const r = await darAcceso(a, requerir('id'), requerir('email'), ahora, {
        reactivar: values.reactivar,
      })
      if (r.reactivados.length) console.log(`Reactivado. Recupera acceso a: ${r.reactivados.join(', ')}`)
      console.log(`Acceso concedido a "${r.artefacto.titulo}".`)
      console.log(`Enlace:     ${enlace(entorno, r.artefacto)}`)
      console.log(`Usuario:    ${r.email}`)
      console.log(
        r.password
          ? `Contraseña: ${r.password}   (solo se muestra ahora; envíala por un canal distinto al enlace)`
          : 'Contraseña: la que ya tenía (usuario existente).',
      )
      break
    }
    case 'quitar-acceso': {
      const ok = await quitarAcceso(a, requerir('id'), requerir('email'))
      console.log(ok ? 'Acceso retirado.' : 'Esa persona no tenía acceso a este artefacto.')
      break
    }
    case 'regenerar-password': {
      const r = await regenerarPassword(a, requerir('email'), ahora, { reactivar: values.reactivar })
      if (r.reactivados.length) console.log(`Reactivado. Recupera acceso a: ${r.reactivados.join(', ')}`)
      console.log(`Nueva contraseña: ${r.password}\nLas sesiones abiertas de esta persona quedan cerradas.`)
      break
    }
    case 'crear-admin': {
      const pw = await crearAdmin(a, requerir('email'), ahora)
      console.log(`Admin listo.\nEnlace:     ${URL_BASE[entorno]}/clientes/admin\nContraseña: ${pw}`)
      break
    }
    case 'listar': {
      const { artefactos } = await resumenAdmin(a)
      const filtro = values.cliente
      for (const { artefacto: art, personas } of artefactos) {
        if (filtro && art.cliente !== filtro) continue
        console.log(`\n[${art.cliente}] ${art.titulo}  (v${art.version}, ${art.publicadoEn.slice(0, 10)})`)
        console.log(`  ${enlace(entorno, art)}`)
        for (const av of art.avisos) console.log(`  ! ${av}`)
        for (const p of personas) {
          console.log(
            `  - ${p.email}${p.activo ? '' : ' (desactivado)'} · último acceso: ${p.ultimoAcceso?.slice(0, 16).replace('T', ' ') ?? 'nunca'}`,
          )
        }
        if (!personas.length) console.log('  (sin personas con acceso)')
      }
      break
    }
    case 'borrar': {
      if (!values.si) throw new ErrorOperacion('Borrar es irreversible. Repite con --si para confirmar.')
      await borrarArtefacto(a, requerir('id'))
      console.log('Artefacto borrado (archivos, ficha y registro de accesos).')
      break
    }
    default:
      throw new ErrorOperacion(`Comando desconocido: ${comando}\n\n${AYUDA}`)
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof ErrorOperacion ? e.message : e)
  process.exit(1)
})
