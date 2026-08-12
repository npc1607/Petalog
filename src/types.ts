export type TaskType =
  | 'water'
  | 'fertilize'
  | 'prune'
  | 'sunlight'
  | 'inspect'
  | 'repot'
  | 'other'

export type HealthStatus = 'healthy' | 'warning' | 'critical'

export type Frequency =
  | 'daily'
  | 'every-2-days'
  | 'weekly'
  | 'every-2-weeks'
  | 'monthly'
  | 'quarterly'
  | 'once'

export interface PlantAnalysis {
  species: string
  commonName: string
  healthStatus: HealthStatus
  issues: string[]
  suggestions: string[]
  summary: string
}

export interface CareTask {
  id: string
  plantId: string
  type: TaskType
  title: string
  description: string
  frequency: Frequency
  intervalDays: number
  startDate: number
  nextDue: number
  lastDoneAt?: number
  done: boolean
}

export interface Plant {
  id: string
  name: string
  photo: string
  analysis?: PlantAnalysis
  schedule: CareTask[]
  createdAt: number
  lastAnalyzedAt?: number
}

export interface AppSettings {
  apiBaseUrl: string
  apiKey: string
  model: string
  notificationsEnabled: boolean
}

export interface AnalysisResult {
  analysis: PlantAnalysis
  schedule: Omit<CareTask, 'id' | 'plantId' | 'done' | 'lastDoneAt'>[]
}
