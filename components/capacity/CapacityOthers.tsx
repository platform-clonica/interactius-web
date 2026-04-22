import { CapacityOthersAnim } from './CapacityOthersAnim'
export type { CapacityOtherItem } from './CapacityOthersAnim'

export function CapacityOthers({
  items,
  sectionLabel,
}: {
  items: [import('./CapacityOthersAnim').CapacityOtherItem, import('./CapacityOthersAnim').CapacityOtherItem]
  sectionLabel: string
}) {
  return (
    <CapacityOthersAnim
      items={items}
      sectionLabel={sectionLabel}
    />
  )
}
