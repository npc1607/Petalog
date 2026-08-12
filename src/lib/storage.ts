import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../constants'
import type { AppSettings, Plant } from '../types'

export function loadPlants(): Plant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.plants)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
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
