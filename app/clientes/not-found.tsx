import { BotonSalir } from '@/components/clientes/BotonSalir'
import { Marco, TituloMarco } from '@/components/clientes/Marco'

/** Misma respuesta para "no existe" y "no es tuyo": no revela qué existe. */
export default function NoTienesAcceso() {
  return (
    <Marco>
      <TituloMarco>No tienes acceso a este contenido.</TituloMarco>
      <p className="mt-4 text-label text-fg/70">Si crees que deberías tenerlo, escribe a tu contacto en Interactius.</p>
      <BotonSalir next="/clientes/admin" className="mt-10 text-label" />
    </Marco>
  )
}
