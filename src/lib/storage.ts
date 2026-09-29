import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../constants'
import type { AppSettings, Plant } from '../types'

export function loadPlants(): Plant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.plants)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((p) => {
      const observations =
        p.observations && Array.isArray(p.observations) && p.observations.length > 0
          ? p.observations
          : [
              {
                id: `init-${p.id}`,
                plantId: p.id,
                photo: p.photo,
                timestamp: p.createdAt || Date.now(),
                analysis: p.analysis,
              },
            ]
      return {
        ...p,
        observations,
        careLogs: p.careLogs && Array.isArray(p.careLogs) ? p.careLogs : [],
      }
    })
  } catch {
    return []
  }
}

export function savePlants(plants: Plant[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.plants, JSON.stringify(plants))
  } catch (e) {
    console.error('Failed to save plants', e)
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings', e)
  }
}

export function loadNotifiedDate(): string | null {
  return localStorage.getItem(STORAGE_KEYS.notifiedDate)
}

export function saveNotifiedDate(dateStr: string): void {
  localStorage.setItem(STORAGE_KEYS.notifiedDate, dateStr)
}

export interface DbStatus {
  ok: boolean
  plantCount: number
  lastUpdated: number
  hasSettings: boolean
}

export async function fetchDbStatusApi(): Promise<DbStatus | null> {
  try {
    const res = await fetch('/api/status')
    if (!res.ok) return null
    const json = await res.json()
    if (json && json.ok) {
      return json as DbStatus
    }
    return null
  } catch {
    return null
  }
}

export async function fetchPlantsApi(): Promise<Plant[] | null> {
  try {
    const res = await fetch('/api/plants')
    if (!res.ok) return null
    const json = await res.json()
    if (json && json.ok && Array.isArray(json.data)) {
      return json.data
    }
    return null
  } catch {
    return null
  }
}

export async function savePlantsApi(plants: Plant[]): Promise<boolean> {
  try {
    const res = await fetch('/api/plants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plants),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function fetchSettingsApi(): Promise<AppSettings | null> {
  try {
    const res = await fetch('/api/settings')
    if (!res.ok) return null
    const json = await res.json()
    if (json && json.ok && json.data) {
      return { ...DEFAULT_SETTINGS, ...json.data }
    }
    return null
  } catch {
    return null
  }
}

export async function saveSettingsApi(settings: AppSettings): Promise<boolean> {
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    return res.ok
  } catch {
    return false
  }
}
