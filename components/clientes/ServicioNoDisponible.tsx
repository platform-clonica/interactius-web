import { Marco } from './Marco'

export function ServicioNoDisponible() {
  return (
    <Marco>
      <h1 className="font-[family-name:var(--font-ft-serif)] text-3xl">Servicio no disponible.</h1>
      <p className="mt-4">Inténtalo de nuevo en unos minutos.</p>
    </Marco>
  )
}
