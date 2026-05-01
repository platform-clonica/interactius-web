import { CapacityServicesAnim } from './CapacityServicesAnim'
export type { CapacityService } from './CapacityServicesAnim'

export interface CapacityServicesProps {
  services: import('./CapacityServicesAnim').CapacityService[]
  sectionLabel: string
  capacityLabel: string
  accentColor?: string
  shapeKind?: 'polygon' | 'ellipse' | 'wave'
}

export function CapacityServices({
  services,
  sectionLabel,
  capacityLabel,
  accentColor,
  shapeKind,
}: CapacityServicesProps) {
  return (
    <CapacityServicesAnim
      services={services}
      sectionLabel={sectionLabel}
      capacityLabel={capacityLabel}
      accentColor={accentColor}
      shapeKind={shapeKind}
    />
  )
}
