import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  addObservationToPlant,
  createPlant,
  deleteObservationFromPlant,
  deletePlantById,
  getAllPlants,
  getLastPlantsUpdate,
  getPlantById,
  getSettings,
  saveAllPlants,
  saveSettings,
  updatePlant,
  updatePlantSummary,
} from './db'

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : null)
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, data: any, status = 200) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.end(JSON.stringify(data))
}

async function handleApi(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const rawUrl = req.url?.split('?')[0] || ''
  const url = rawUrl.replace(/\/+$/, '')

  // Handle CORS preflight
  if (req.method === 'OPTIONS' && url.startsWith('/api')) {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.end()
    return
  }

  const segments = url.split('/').filter(Boolean)
  if (segments[0] !== 'api') {
    next()
    return
  }

  const method = req.method?.toUpperCase() || 'GET'
  const resource = segments[1]

  try {
    // 1. System / Status
    // GET /api/status
    if (resource === 'status' && method === 'GET') {
      const plants = getAllPlants()
      const settings = getSettings()
      sendJson(res, {
        ok: true,
        plantCount: plants.length,
        lastUpdated: getLastPlantsUpdate(),
        hasSettings: !!settings,
      })
      return
    }

    // 2. Settings (Singleton Resource)
    // GET /api/settings
    // PUT / PATCH / POST /api/settings
    if (resource === 'settings') {
      if (method === 'GET') {
        const settings = getSettings()
        sendJson(res, { ok: true, data: settings })
        return
      }

      if (method === 'PUT' || method === 'PATCH' || method === 'POST') {
        const body = await parseJsonBody(req)
        if (body && typeof body === 'object') {
          const updated = saveSettings(body)
          sendJson(res, { ok: true, data: updated })
        } else {
          sendJson(res, { ok: false, error: 'Expected settings object' }, 400)
        }
        return
      }
    }

    // 3. Plants Collection and Members
    if (resource === 'plants') {
      // 3.1 Collection: /api/plants
      if (segments.length === 2) {
        // GET /api/plants - list all plants
        if (method === 'GET') {
          const plants = getAllPlants()
          sendJson(res, { ok: true, data: plants })
          return
        }

        // POST /api/plants - create a plant (or batch import if array)
        if (method === 'POST') {
          const body = await parseJsonBody(req)
          if (Array.isArray(body)) {
            saveAllPlants(body)
            sendJson(res, { ok: true, count: body.length }, 200)
          } else if (body && typeof body === 'object' && body.id) {
            const created = createPlant(body)
            sendJson(res, { ok: true, data: created }, 201)
          } else {
            sendJson(res, { ok: false, error: 'Expected plant object with id or array of plants' }, 400)
          }
          return
        }

        // PUT /api/plants - batch replace all plants
        if (method === 'PUT') {
          const body = await parseJsonBody(req)
          if (Array.isArray(body)) {
            saveAllPlants(body)
            sendJson(res, { ok: true, count: body.length }, 200)
          } else {
            sendJson(res, { ok: false, error: 'Expected array of plants for batch replace' }, 400)
          }
          return
        }
      }

      const plantId = decodeURIComponent(segments[2])

      // 3.2 Single Plant: /api/plants/:id
      if (segments.length === 3) {
        // GET /api/plants/:id
        if (method === 'GET') {
          const plant = getPlantById(plantId)
          if (!plant) {
            sendJson(res, { ok: false, error: 'Plant not found' }, 404)
          } else {
            sendJson(res, { ok: true, data: plant })
          }
          return
        }

        // PUT / PATCH /api/plants/:id
        if (method === 'PUT' || method === 'PATCH') {
          const body = await parseJsonBody(req)
          if (!body || typeof body !== 'object') {
            sendJson(res, { ok: false, error: 'Expected update object' }, 400)
            return
          }
          const updated = updatePlant(plantId, body)
          if (!updated) {
            sendJson(res, { ok: false, error: 'Plant not found' }, 404)
          } else {
            sendJson(res, { ok: true, data: updated })
          }
          return
        }

        // DELETE /api/plants/:id
        if (method === 'DELETE') {
          const deleted = deletePlantById(plantId)
          sendJson(res, { ok: true, deleted: plantId, success: deleted })
          return
        }
      }

      // 3.3 Sub-resource: /api/plants/:id/observations
      if (segments[3] === 'observations') {
        if (segments.length === 4) {
          // GET /api/plants/:id/observations
          if (method === 'GET') {
            const plant = getPlantById(plantId)
            if (!plant) {
              sendJson(res, { ok: false, error: 'Plant not found' }, 404)
            } else {
              sendJson(res, { ok: true, data: plant.observations || [] })
            }
            return
          }

          // POST /api/plants/:id/observations
          if (method === 'POST') {
            const body = await parseJsonBody(req)
            if (!body || typeof body !== 'object' || !body.id) {
              sendJson(res, { ok: false, error: 'Expected observation object with id' }, 400)
              return
            }
            const obs = addObservationToPlant(plantId, body)
            if (!obs) {
              sendJson(res, { ok: false, error: 'Plant not found' }, 404)
            } else {
              sendJson(res, { ok: true, data: obs }, 201)
            }
            return
          }
        }

        // DELETE /api/plants/:id/observations/:obsId
        if (segments.length === 5 && method === 'DELETE') {
          const obsId = decodeURIComponent(segments[4])
          const ok = deleteObservationFromPlant(plantId, obsId)
          if (!ok) {
            sendJson(res, { ok: false, error: 'Observation or plant not found' }, 404)
          } else {
            sendJson(res, { ok: true, deleted: obsId })
          }
          return
        }
      }

      // 3.4 Sub-resource: /api/plants/:id/summary
      if (segments[3] === 'summary') {
        // GET /api/plants/:id/summary
        if (method === 'GET') {
          const plant = getPlantById(plantId)
          if (!plant) {
            sendJson(res, { ok: false, error: 'Plant not found' }, 404)
          } else {
            sendJson(res, { ok: true, data: plant.growthSummary || null })
          }
          return
        }

        // PUT / POST /api/plants/:id/summary
        if (method === 'PUT' || method === 'POST') {
          const body = await parseJsonBody(req)
          const summaryText = typeof body === 'string' ? body : body?.summary
          if (!summaryText) {
            sendJson(res, { ok: false, error: 'Expected summary text' }, 400)
            return
          }
          const savedSummary = updatePlantSummary(plantId, summaryText)
          if (!savedSummary) {
            sendJson(res, { ok: false, error: 'Plant not found' }, 404)
          } else {
            sendJson(res, { ok: true, data: savedSummary })
          }
          return
        }
      }

      // 3.5 Sub-resource: /api/plants/:id/tasks/:taskId/complete
      if (segments[3] === 'tasks' && segments.length === 6 && segments[5] === 'complete') {
        const taskId = decodeURIComponent(segments[4])
        const plant = getPlantById(plantId)
        if (!plant) {
          sendJson(res, { ok: false, error: 'Plant not found' }, 404)
          return
        }

        const now = Date.now()
        const schedule = Array.isArray(plant.schedule) ? plant.schedule : []
        const taskIndex = schedule.findIndex((t: any) => t.id === taskId)
        if (taskIndex < 0) {
          sendJson(res, { ok: false, error: 'Task not found' }, 404)
          return
        }

        const task = schedule[taskIndex]
        const nextDue = now + task.intervalDays * 86400000
        schedule[taskIndex] = {
          ...task,
          done: true,
          lastDoneAt: now,
          nextDue,
        }

        const newLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          plantId,
          taskId: task.id,
          taskType: task.type,
          taskTitle: task.title,
          timestamp: now,
        }
        plant.careLogs = [newLog, ...(plant.careLogs || [])]
        plant.schedule = schedule
        updatePlant(plantId, plant)

        sendJson(res, { ok: true, task: schedule[taskIndex], log: newLog })
        return
      }
    }

    sendJson(res, { ok: false, error: 'Route not found' }, 404)
  } catch (err: any) {
    sendJson(res, { ok: false, error: err?.message || 'Server error' }, 500)
  }
}

export function sqlitePlugin(): Plugin {
  return {
    name: 'sqlite-storage-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handleApi(req, res, next)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        handleApi(req, res, next)
      })
    },
  }
}
