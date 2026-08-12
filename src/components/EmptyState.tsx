import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  title: string
  hint?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, hint, action }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h2>{title}</h2>
      {hint && <p>{hint}</p>}
      {action}
    </div>
  )
}
