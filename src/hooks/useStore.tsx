import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { analyzePlant as apiAnalyze } from '../api/client'
import { makeId } from '../lib/id'
import { notifyTodaysTasks } from '../lib/notifications'
import { getTodaysTasks } from '../lib/schedule'
import { loadPlants, loadSettings, savePlants, saveSettings } from '../lib/storage'
import type { AppSettings, CareTask, Plant } from '../types'

interface StoreValue {
  plants: Plant[]
  settings: AppSettings
  addPlant: (name: string, photo: string) => string
  analyzePlant: (plantId: string) => Promise<void>
  completeTask: (plantId: string, taskId: string) => void
  deletePlant: (plantId: string) => void
  updateSettings: (next: Partial<AppSettings>) => void
  analyzingPlantId: string | null
  analysisError: string | null
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>(() => loadPlants())
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [analyzingPlantId, setAnalyzingPlantId] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  useEffect(() => {
    savePlants(plants)
  }, [plants])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    if (!settings.notificationsEnabled) return
    const count = getTodaysTasks(plants).length
    notifyTodaysTasks(count)
  }, [plants, settings.notificationsEnabled])

  const addPlant = useCallback((name: string, photo: string): string => {
    const id = makeId()
    const plant: Plant = {
      id,
      name: name.trim() || '未命名植物',
      photo,
      schedule: [],
      createdAt: Date.now(),
    }
    setPlants((prev) => [plant, ...prev])
    return id
  }, [])

  const analyzePlant = useCallback(
    async (plantId: string) => {
      const plant = plants.find((p) => p.id === plantId)
      if (!plant) return
      setAnalyzingPlantId(plantId)
      setAnalysisError(null)
      try {
        const result = await apiAnalyze(plant.photo, settings)
        const schedule: CareTask[] = result.schedule.map((s) => ({
          ...s,
          id: makeId(),
          plantId,
          done: false,
        }))
        setPlants((prev) =>
          prev.map((p) =>
            p.id === plantId
              ? {
                  ...p,
                  analysis: result.analysis,
                  schedule,
                  lastAnalyzedAt: Date.now(),
                }
              : p,
          ),
        )
      } catch (e) {
        const msg = e instanceof Error ? e.message : '分析失败，请稍后重试'
        setAnalysisError(msg)
        throw e
      } finally {
        setAnalyzingPlantId(null)
      }
    },
    [plants, settings],
  )

  const completeTask = useCallback((plantId: string, taskId: string) => {
    setPlants((prev) =>
      prev.map((p) =>
        p.id === plantId
          ? {
              ...p,
              schedule: p.schedule.map((t) =>
                t.id === taskId
                  ? t.intervalDays > 0
                    ? {
                        ...t,
                        lastDoneAt: Date.now(),
                        nextDue: t.nextDue + t.intervalDays * 86400000,
                        done: false,
                      }
                    : { ...t, done: true, lastDoneAt: Date.now() }
                  : t,
              ),
            }
          : p,
      ),
    )
  }, [])

  const deletePlant = useCallback((plantId: string) => {
    setPlants((prev) => prev.filter((p) => p.id !== plantId))
  }, [])

  const updateSettings = useCallback((next: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...next }))
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      plants,
      settings,
      addPlant,
      analyzePlant,
      completeTask,
      deletePlant,
      updateSettings,
      analyzingPlantId,
      analysisError,
    }),
    [plants, settings, addPlant, analyzePlant, completeTask, deletePlant, updateSettings, analyzingPlantId, analysisError],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
