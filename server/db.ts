import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'

const dataDir = path.resolve(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'petalog.db')
const db = new DatabaseSync(dbPath)

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS plants (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`)

export function getAllPlants(): any[] {
  const query = db.prepare('SELECT data FROM plants ORDER BY updated_at DESC')
  const rows = query.all() as { data: string }[]
  return rows.map((r) => JSON.parse(r.data))
}

export function getPlantById(id: string): any | null {
  const query = db.prepare('SELECT data FROM plants WHERE id = ?')
  const row = query.get(id) as { data: string } | undefined
  if (!row) return null
  try {
    return JSON.parse(row.data)
  } catch {
    return null
  }
}

export function createPlant(plant: any): any {
  const now = Date.now()
  const insert = db.prepare(`
    INSERT INTO plants (id, data, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `)
  insert.run(plant.id, JSON.stringify(plant), now)
  return plant
}

export function updatePlant(id: string, updates: any): any | null {
  const existing = getPlantById(id)
  if (!existing) return null
  const merged = { ...existing, ...updates, id }
  const now = Date.now()
  const stmt = db.prepare('UPDATE plants SET data = ?, updated_at = ? WHERE id = ?')
  stmt.run(JSON.stringify(merged), now, id)
  return merged
}

export function deletePlantById(id: string): boolean {
  const stmt = db.prepare('DELETE FROM plants WHERE id = ?')
  const res = stmt.run(id) as { changes?: number }
  return (res?.changes ?? 1) > 0
}

export function addObservationToPlant(plantId: string, observation: any): any | null {
  const plant = getPlantById(plantId)
  if (!plant) return null
  const obsList = Array.isArray(plant.observations) ? plant.observations : []
  plant.observations = [observation, ...obsList.filter((o: any) => o.id !== observation.id)]
  updatePlant(plantId, plant)
  return observation
}

export function deleteObservationFromPlant(plantId: string, obsId: string): boolean {
  const plant = getPlantById(plantId)
  if (!plant || !Array.isArray(plant.observations)) return false
  const prevLen = plant.observations.length
  plant.observations = plant.observations.filter((o: any) => o.id !== obsId)
  if (plant.observations.length !== prevLen) {
    updatePlant(plantId, plant)
    return true
  }
  return false
}

export function updatePlantSummary(plantId: string, summary: string): any | null {
  const plant = getPlantById(plantId)
  if (!plant) return null
  const growthSummary = {
    summary,
    generatedAt: Date.now(),
  }
  plant.growthSummary = growthSummary
  updatePlant(plantId, plant)
  return growthSummary
}

export function getLastPlantsUpdate(): number {
  const query = db.prepare('SELECT MAX(updated_at) as max_updated FROM plants')
  const row = query.get() as { max_updated: number | null } | undefined
  return row?.max_updated || 0
}

export function saveAllPlants(plants: any[]): void {
  db.exec('BEGIN TRANSACTION')
  try {
    db.exec('DELETE FROM plants')
    const insert = db.prepare('INSERT INTO plants (id, data, updated_at) VALUES (?, ?, ?)')
    const now = Date.now()
    for (const plant of plants) {
      insert.run(plant.id, JSON.stringify(plant), now)
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

export function getSettings(): any | null {
  const query = db.prepare("SELECT value FROM settings WHERE key = 'current'")
  const row = query.get() as { value: string } | undefined
  if (!row) return null
  try {
    return JSON.parse(row.value)
  } catch {
    return null
  }
}

export function saveSettings(settings: any): any {
  const existing = getSettings() || {}
  const merged = { ...existing, ...settings }
  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('current', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `)
  upsert.run(JSON.stringify(merged), Date.now())
  return merged
}
