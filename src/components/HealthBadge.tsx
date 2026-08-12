import { HEALTH_LABELS } from '../constants'
import type { HealthStatus } from '../types'

interface Props {
  status: HealthStatus
}

export function HealthBadge({ status }: Props) {
  const info = HEALTH_LABELS[status] ?? HEALTH_LABELS.healthy
  return <span className="health-badge" style={{ '--badge-color': info.color } as React.CSSProperties}>{info.label}</span>
}
