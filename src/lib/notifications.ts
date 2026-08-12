import { loadNotifiedDate, saveNotifiedDate } from './storage'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied'
  return Notification.permission
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

export function notifyTodaysTasks(count: number): void {
  if (!isNotificationSupported()) return
  if (Notification.permission !== 'granted') return
  if (loadNotifiedDate() === todayStr()) return

  if (count <= 0) {
    saveNotifiedDate(todayStr())
    return
  }

  const title = `🌱 今天有 ${count} 项植物养护任务`
  const body = '打开 Petalog 查看今天的待办任务吧。'
  try {
    new Notification(title, { body, icon: '/leaf.svg' })
  } catch (e) {
    console.error('Notification failed', e)
  }
  saveNotifiedDate(todayStr())
}
