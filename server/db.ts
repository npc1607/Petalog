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

export function saveSettings(settings: any): void {
  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('current', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `)
  upsert.run(JSON.stringify(settings), Date.now())
}
