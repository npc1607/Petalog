import type { AppSettings } from './types'

export interface ModelPreset {
  id: string
  name: string
  provider: string
  apiBaseUrl: string
  model: string
  description: string
  helpUrl?: string
  helpText?: string
  badge?: string
}

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'deepseek-flash',
    name: 'DeepSeek Flash',
    provider: 'DeepSeek 官方',
    apiBaseUrl: 'https://api.deepseek.com',
    model: 'deepseek-flash',
    description: 'DeepSeek 官方最新原生多模态视觉大模型，支持精准植物诊断与养护日程生成',
    helpUrl: 'https://platform.deepseek.com/api_keys',
    helpText: '前往 DeepSeek 开放平台获取 API Key',
    badge: '官方推荐',
  },
  {
    id: 'zhipu-glm-5v',
    name: 'GLM-5V-Turbo',
    provider: '智谱 AI',
    apiBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'GLM-5V-Turbo',
    description: '智谱开放平台多模态视觉模型',
    helpUrl: 'https://open.bigmodel.cn/',
    helpText: '前往智谱开放平台获取 API Key',
  },
  {
    id: 'openai-gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    apiBaseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    description: 'OpenAI 官方旗舰多模态视觉模型',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpText: '前往 OpenAI 平台获取 API Key',
  },
]

export const DEFAULT_SETTINGS: AppSettings = {
  apiBaseUrl: 'https://api.deepseek.com',
  apiKey: '',
  model: 'deepseek-flash',
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
