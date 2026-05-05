import { CapacityOthersAnim } from './CapacityOthersAnim'
import type { CapacityTabItem } from './CapacityOthersAnim'
import type { RouteId } from '@/lib/i18n/navigation'

export type { CapacityTabItem } from './CapacityOthersAnim'

export function CapacityOthers({
  tabs,
  currentHref,
  sectionLabel,
}: {
  tabs: [CapacityTabItem, CapacityTabItem, CapacityTabItem]
  currentHref: RouteId
  sectionLabel: string
}) {
  return (
    <CapacityOthersAnim
      tabs={tabs}
      currentHref={currentHref}
      sectionLabel={sectionLabel}
    />
  )
}
