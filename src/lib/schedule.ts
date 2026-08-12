import type { CareTask, Plant } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

export function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function isDueToday(task: CareTask): boolean {
  return task.nextDue <= startOfToday() + DAY_MS
}

export function isOverdue(task: CareTask): boolean {
  return task.nextDue < startOfToday()
}

export function getTodaysTasks(plants: Plant[]): Array<{ plant: Plant; task: CareTask }> {
  const result: Array<{ plant: Plant; task: CareTask }> = []
  for (const plant of plants) {
    for (const task of plant.schedule) {
      if (isDueToday(task) && !task.done) {
        result.push({ plant, task })
      }
    }
  }
  return result.sort((a, b) => a.task.nextDue - b.task.nextDue)
}

export function advanceTask(task: CareTask): CareTask {
  if (task.intervalDays <= 0) {
    return { ...task, done: true, lastDoneAt: Date.now() }
  }
  const today = startOfToday()
  let next = task.nextDue
  while (next <= today) {
    next += task.intervalDays * DAY_MS
  }
  return {
    ...task,
    nextDue: next,
    done: false,
    lastDoneAt: Date.now(),
  }
}

export function getPlantTodaysTasks(plant: Plant): CareTask[] {
  return plant.schedule
    .filter((t) => isDueToday(t) && !t.done)
    .sort((a, b) => a.nextDue - b.nextDue)
}

export function formatDueLabel(nextDue: number): string {
  const today = startOfToday()
  const diffDays = Math.floor((nextDue - today) / DAY_MS)
  if (diffDays < 0) return `逾期 ${Math.abs(diffDays)} 天`
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  return `${diffDays} 天后`
}
