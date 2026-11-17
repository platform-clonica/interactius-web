import { BotonSalir } from '@/components/clientes/BotonSalir'
import { Marco } from '@/components/clientes/Marco'

/** Misma respuesta para "no existe" y "no es tuyo": no revela qué existe. */
export default function NoTienesAcceso() {
  return (
    <Marco>
      <h1 className="font-[family-name:var(--font-ft-serif)] text-3xl">No tienes acceso a este contenido.</h1>
      <p className="mt-4">Si crees que deberías tenerlo, escribe a tu contacto en Interactius.</p>
      <BotonSalir next="/clientes/admin" className="mt-8" />
    </Marco>
  )
}
