import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { analyzePlant as apiAnalyze, generateGrowthSummary as apiGrowthSummary } from '../api/client'
import { makeId } from '../lib/id'
import { notifyTodaysTasks } from '../lib/notifications'
import { getTodaysTasks } from '../lib/schedule'
import { loadPlants, loadSettings, savePlants, saveSettings } from '../lib/storage'
import type { AppSettings, CareLog, CareTask, Plant, PlantObservation } from '../types'

interface StoreValue {
  plants: Plant[]
  settings: AppSettings
  addPlant: (name: string, photo: string) => string
  analyzePlant: (plantId: string, observationId?: string) => Promise<void>
  addObservation: (
    plantId: string,
    photo: string,
    completedTaskIds?: string[],
    note?: string,
  ) => Promise<string>
  deleteObservation: (plantId: string, obsId: string) => void
  generateSummary: (plantId: string) => Promise<string>
  completeTask: (plantId: string, taskId: string) => void
  deletePlant: (plantId: string) => void
  updateSettings: (next: Partial<AppSettings>) => void
  analyzingPlantId: string | null
  generatingSummaryPlantId: string | null
  analysisError: string | null
}

function syncSchedule(
  currentSchedule: CareTask[],
  newScheduleItems: Omit<CareTask, 'id' | 'plantId' | 'done' | 'lastDoneAt'>[],
  plantId: string,
): CareTask[] {
  if (!newScheduleItems || newScheduleItems.length === 0) return currentSchedule

  const result: CareTask[] = [...currentSchedule]

  for (const item of newScheduleItems) {
    const existingIndex = result.findIndex((t) => t.type === item.type)
    if (existingIndex >= 0) {
      const existing = result[existingIndex]
      const lastDoneAt = existing.lastDoneAt
      const nextDue = lastDoneAt
        ? lastDoneAt + item.intervalDays * 86400000
        : existing.nextDue
      result[existingIndex] = {
        ...existing,
        title: item.title || existing.title,
        description: item.description || existing.description,
        frequency: item.frequency || existing.frequency,
        intervalDays: item.intervalDays || existing.intervalDays,
        nextDue,
      }
    } else {
      result.push({
        ...item,
        id: makeId(),
        plantId,
        done: false,
        startDate: Date.now(),
        nextDue: Date.now() + item.intervalDays * 86400000,
      })
    }
  }

  return result
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>(() => loadPlants())
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [analyzingPlantId, setAnalyzingPlantId] = useState<string | null>(null)
  const [generatingSummaryPlantId, setGeneratingSummaryPlantId] = useState<string | null>(null)
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
    const obsId = makeId()
    const now = Date.now()
    const plant: Plant = {
      id,
      name: name.trim() || '未命名植物',
      photo,
      schedule: [],
      createdAt: now,
      observations: [
        {
          id: obsId,
          plantId: id,
          photo,
          timestamp: now,
        },
      ],
      careLogs: [],
    }
    setPlants((prev) => [plant, ...prev])
    return id
  }, [])

  const analyzePlant = useCallback(
    async (plantId: string, observationId?: string) => {
      const plant = plants.find((p) => p.id === plantId)
      if (!plant) return
      setAnalyzingPlantId(plantId)
      setAnalysisError(null)
      try {
        const obs = observationId
          ? plant.observations?.find((o) => o.id === observationId)
          : plant.observations?.[0]
        const photoToAnalyze = obs ? obs.photo : plant.photo

        const result = await apiAnalyze(photoToAnalyze, settings)

        setPlants((prev) =>
          prev.map((p) => {
            if (p.id !== plantId) return p
            const updatedObservations =
              p.observations?.map((o) =>
                (observationId ? o.id === observationId : o.photo === photoToAnalyze)
                  ? { ...o, analysis: result.analysis }
                  : o,
              ) || []

            const syncedSchedule = syncSchedule(p.schedule, result.schedule, plantId)

            return {
              ...p,
              analysis: result.analysis,
              schedule: syncedSchedule,
              lastAnalyzedAt: Date.now(),
              observations: updatedObservations,
            }
          }),
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

  const addObservation = useCallback(
    async (
      plantId: string,
      photo: string,
      completedTaskIds?: string[],
      note?: string,
    ): Promise<string> => {
      const obsId = makeId()
      const now = Date.now()
      const plant = plants.find((p) => p.id === plantId)

      let newLogs: CareLog[] = []
      let updatedSchedule = plant?.schedule || []

      if (completedTaskIds && completedTaskIds.length > 0 && plant) {
        newLogs = completedTaskIds
          .map((tId) => {
            const t = plant.schedule.find((x) => x.id === tId)
            if (!t) return null
            return {
              id: makeId(),
              plantId,
              taskId: t.id,
              taskType: t.type,
              taskTitle: t.title,
              timestamp: now,
            }
          })
          .filter(Boolean) as CareLog[]

        updatedSchedule = plant.schedule.map((t) => {
          if (!completedTaskIds.includes(t.id)) return t
          return t.intervalDays > 0
            ? { ...t, lastDoneAt: now, nextDue: now + t.intervalDays * 86400000, done: false }
            : { ...t, done: true, lastDoneAt: now }
        })
      }

      const completedTaskTitles = newLogs.map((l) => l.taskTitle)

      const newObs: PlantObservation = {
        id: obsId,
        plantId,
        photo,
        timestamp: now,
        note,
        completedTasks: completedTaskTitles.length > 0 ? completedTaskTitles : undefined,
      }

      setPlants((prev) =>
        prev.map((p) =>
          p.id === plantId
            ? {
                ...p,
                photo,
                schedule: updatedSchedule,
                observations: [newObs, ...(p.observations || [])],
                careLogs: [...newLogs, ...(p.careLogs || [])],
              }
            : p,
        ),
      )

      // Automatically analyze new observation & dynamically update schedule
      try {
        setAnalyzingPlantId(plantId)
        setAnalysisError(null)
        const result = await apiAnalyze(photo, settings)
        setPlants((prev) =>
          prev.map((p) => {
            if (p.id !== plantId) return p
            const synced = syncSchedule(p.schedule, result.schedule, plantId)
            return {
              ...p,
              analysis: result.analysis,
              schedule: synced,
              lastAnalyzedAt: Date.now(),
              observations: p.observations?.map((o) =>
                o.id === obsId ? { ...o, analysis: result.analysis } : o,
              ),
            }
          }),
        )
      } catch (e) {
        const msg = e instanceof Error ? e.message : '分析失败，请稍后手动重试'
        setAnalysisError(msg)
      } finally {
        setAnalyzingPlantId(null)
      }

      return obsId
    },
    [plants, settings],
  )

  const deleteObservation = useCallback((plantId: string, obsId: string) => {
    setPlants((prev) =>
      prev.map((p) => {
        if (p.id !== plantId) return p
        const updated = (p.observations || []).filter((o) => o.id !== obsId)
        return {
          ...p,
          observations: updated,
          photo: updated[0]?.photo || p.photo,
          analysis: updated[0]?.analysis || p.analysis,
        }
      }),
    )
  }, [])

  const generateSummary = useCallback(
    async (plantId: string): Promise<string> => {
      const plant = plants.find((p) => p.id === plantId)
      if (!plant) throw new Error('植物不存在')
      setGeneratingSummaryPlantId(plantId)
      try {
        const summary = await apiGrowthSummary(plant, settings)
        setPlants((prev) =>
          prev.map((p) =>
            p.id === plantId
              ? {
                  ...p,
                  growthSummary: {
                    summary,
                    generatedAt: Date.now(),
                  },
                }
              : p,
          ),
        )
        return summary
      } finally {
        setGeneratingSummaryPlantId(null)
      }
    },
    [plants, settings],
  )

  const completeTask = useCallback((plantId: string, taskId: string) => {
    const now = Date.now()
    setPlants((prev) =>
      prev.map((p) => {
        if (p.id !== plantId) return p
        const targetTask = p.schedule.find((t) => t.id === taskId)
        if (!targetTask) return p

        const updatedSchedule = p.schedule.map((t) =>
          t.id === taskId
            ? t.intervalDays > 0
              ? {
                  ...t,
                  lastDoneAt: now,
                  nextDue: now + t.intervalDays * 86400000,
                  done: false,
                }
              : { ...t, done: true, lastDoneAt: now }
            : t,
        )

        const newLog: CareLog = {
          id: makeId(),
          plantId,
          taskId: targetTask.id,
          taskType: targetTask.type,
          taskTitle: targetTask.title,
          timestamp: now,
        }

        return {
          ...p,
          schedule: updatedSchedule,
          careLogs: [newLog, ...(p.careLogs || [])],
        }
      }),
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
      addObservation,
      deleteObservation,
      generateSummary,
      completeTask,
      deletePlant,
      updateSettings,
      analyzingPlantId,
      generatingSummaryPlantId,
      analysisError,
    }),
    [
      plants,
      settings,
      addPlant,
      analyzePlant,
      addObservation,
      deleteObservation,
      generateSummary,
      completeTask,
      deletePlant,
      updateSettings,
      analyzingPlantId,
      generatingSummaryPlantId,
      analysisError,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
