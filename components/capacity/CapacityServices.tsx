import { CapacityServicesAnim } from './CapacityServicesAnim'
export type { CapacityService } from './CapacityServicesAnim'

export interface CapacityServicesProps {
  services: import('./CapacityServicesAnim').CapacityService[]
  sectionLabel: string
  capacityLabel: string
  accentColor?: string
  strokeColor?: string
  shapeKind?: 'polygon' | 'ellipse' | 'wave'
}

export function CapacityServices({
  services,
  sectionLabel,
  capacityLabel,
  accentColor,
  strokeColor,
  shapeKind,
}: CapacityServicesProps) {
  return (
    <CapacityServicesAnim
      services={services}
      sectionLabel={sectionLabel}
      capacityLabel={capacityLabel}
      accentColor={accentColor}
      strokeColor={strokeColor}
      shapeKind={shapeKind}
    />
  )
}
