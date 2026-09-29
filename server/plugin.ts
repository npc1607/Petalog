import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { getAllPlants, getLastPlantsUpdate, getSettings, saveAllPlants, saveSettings } from './db'

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.end(JSON.stringify(data))
}

function handleApi(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const rawUrl = req.url?.split('?')[0] || ''
  const url = rawUrl.replace(/\/+$/, '')

  if (req.method === 'OPTIONS' && url.startsWith('/api')) {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.end()
    return
  }

  if (url === '/api/status') {
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

  if (url === '/api/plants') {
    if (req.method === 'GET') {
      try {
        const plants = getAllPlants()
        sendJson(res, { ok: true, data: plants })
      } catch (e: any) {
        sendJson(res, { ok: false, error: e.message }, 500)
      }
      return
    }
    if (req.method === 'POST') {
      parseJsonBody(req)
        .then((body) => {
          if (Array.isArray(body)) {
            saveAllPlants(body)
            sendJson(res, { ok: true, count: body.length })
          } else {
            sendJson(res, { ok: false, error: 'Expected array of plants' }, 400)
          }
        })
        .catch((e: any) => {
          sendJson(res, { ok: false, error: e.message }, 500)
        })
      return
    }
  }

  if (url === '/api/settings') {
    if (req.method === 'GET') {
      try {
        const settings = getSettings()
        sendJson(res, { ok: true, data: settings })
      } catch (e: any) {
        sendJson(res, { ok: false, error: e.message }, 500)
      }
      return
    }
    if (req.method === 'POST') {
      parseJsonBody(req)
        .then((body) => {
          if (body && typeof body === 'object') {
            saveSettings(body)
            sendJson(res, { ok: true })
          } else {
            sendJson(res, { ok: false, error: 'Expected settings object' }, 400)
          }
        })
        .catch((e: any) => {
          sendJson(res, { ok: false, error: e.message }, 500)
        })
      return
    }
  }

  next()
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
