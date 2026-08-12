import { Check } from 'lucide-react'
import { TASK_TYPE_LABELS } from '../constants'
import { formatDueLabel, isOverdue } from '../lib/schedule'
import type { CareTask } from '../types'

interface Props {
  task: CareTask
  onComplete: () => void
}

export function TaskItem({ task, onComplete }: Props) {
  const overdue = isOverdue(task)
  const typeLabel = TASK_TYPE_LABELS[task.type] ?? '其他'
  return (
    <div className={`task-item ${overdue ? 'overdue' : ''}`}>
      <button className="task-check" onClick={onComplete} aria-label="完成">
        <Check size={16} />
      </button>
      <div className="task-body">
        <div className="task-head">
          <span className={`task-type type-${task.type}`}>{typeLabel}</span>
          <span className="task-title">{task.title}</span>
        </div>
        {task.description && <p className="task-desc">{task.description}</p>}
      </div>
      <span className={`task-due ${overdue ? 'overdue' : ''}`}>{formatDueLabel(task.nextDue)}</span>
    </div>
  )
}
