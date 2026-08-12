import type { AppSettings } from './types'

export const DEFAULT_SETTINGS: AppSettings = {
  apiBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: '',
  model: 'GLM-5V-Turbo',
  notificationsEnabled: false,
}

export const STORAGE_KEYS = {
  plants: 'petalog.plants',
  settings: 'petalog.settings',
  notifiedDate: 'petalog.notifiedDate',
} as const

export const TASK_TYPE_LABELS: Record<string, string> = {
  water: '浇水',
  fertilize: '施肥',
  prune: '修剪',
  sunlight: '光照',
  inspect: '检查',
  repot: '换盆',
  other: '其他',
}

export const HEALTH_LABELS: Record<string, { label: string; color: string }> = {
  healthy: { label: '健康', color: '#6b9b54' },
  warning: { label: '需关注', color: '#c98a3a' },
  critical: { label: '紧急', color: '#c25b4a' },
}

export const FREQUENCY_DAYS: Record<string, number> = {
  daily: 1,
  'every-2-days': 2,
  weekly: 7,
  'every-2-weeks': 14,
  monthly: 30,
  quarterly: 90,
  once: 0,
}

export const MAX_PHOTO_DIMENSION = 1024
export const JPEG_QUALITY = 0.85
