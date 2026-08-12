import { CheckCircle2, ClipboardList, Leaf } from 'lucide-react'
import { useMemo } from 'react'
import { useStore } from '../hooks/useStore'
import { getTodaysTasks } from '../lib/schedule'
import { EmptyState } from './EmptyState'
import { TaskItem } from './TaskItem'

interface Props {
  onOpenPlant: (id: string) => void
}

export function TodayView({ onOpenPlant }: Props) {
  const { plants, completeTask } = useStore()
  const tasks = useMemo(() => getTodaysTasks(plants), [plants])

  if (plants.length === 0) {
    return (
      <EmptyState
        icon={<Leaf size={48} />}
        title="还没有植物"
        hint="添加你的第一株植物，开始养护之旅"
      />
    )
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 size={48} />}
        title="今天没有待办任务"
        hint="所有养护任务都已完成，享受你的花园吧"
      />
    )
  }

  const grouped = new Map<string, typeof tasks>()
  for (const item of tasks) {
    const arr = grouped.get(item.plant.id) ?? []
    arr.push(item)
    grouped.set(item.plant.id, arr)
  }

  return (
    <div className="today-view">
      <header className="view-header">
        <h1>今日待办</h1>
        <p>
          <ClipboardList size={16} /> {tasks.length} 项任务 · {grouped.size} 株植物
        </p>
      </header>
      <div className="today-list">
        {Array.from(grouped.entries()).map(([plantId, items]) => {
          const plant = items[0].plant
          return (
            <section key={plantId} className="today-group">
              <button
                className="today-group-head"
                onClick={() => onOpenPlant(plantId)}
              >
                <img src={plant.photo} alt={plant.name} />
                <span className="today-group-name">{plant.name}</span>
                <span className="today-group-species">
                  {plant.analysis?.commonName || plant.analysis?.species || '未分析'}
                </span>
              </button>
              <div className="today-group-tasks">
                {items.map(({ task }) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={() => completeTask(plantId, task.id)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
