import { CapacityServicesAnim } from './CapacityServicesAnim'
export type { CapacityService } from './CapacityServicesAnim'

export interface CapacityServicesProps {
  services: import('./CapacityServicesAnim').CapacityService[]
  sectionLabel: string
  capacityLabel: string
}

export function CapacityServices({
  services,
  sectionLabel,
  capacityLabel,
}: CapacityServicesProps) {
  return (
    <CapacityServicesAnim
      services={services}
      sectionLabel={sectionLabel}
      capacityLabel={capacityLabel}
    />
  )
}
