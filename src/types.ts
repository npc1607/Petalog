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

export interface CareLog {
  id: string
  plantId: string
  taskId?: string
  taskType: TaskType
  taskTitle: string
  timestamp: number
  note?: string
}

export interface PlantObservation {
  id: string
  plantId: string
  photo: string
  timestamp: number
  note?: string
  analysis?: PlantAnalysis
  completedTasks?: string[]
}

export interface PlantGrowthSummary {
  summary: string
  generatedAt: number
}

export interface Plant {
  id: string
  name: string
  photo: string
  analysis?: PlantAnalysis
  schedule: CareTask[]
  createdAt: number
  lastAnalyzedAt?: number
  observations?: PlantObservation[]
  careLogs?: CareLog[]
  growthSummary?: PlantGrowthSummary
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
