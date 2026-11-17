import { Marco, TituloMarco } from './Marco'

export function ServicioNoDisponible() {
  return (
    <Marco>
      <TituloMarco>Servicio no disponible.</TituloMarco>
      <p className="mt-4 text-label text-fg/70">Inténtalo de nuevo en unos minutos.</p>
    </Marco>
  )
}
