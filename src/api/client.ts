import type { AnalysisResult, AppSettings, PlantAnalysis } from '../types'

interface RawScheduleItem {
  type?: string
  title?: string
  description?: string
  frequency?: string
  intervalDays?: number
}

interface RawAnalysis {
  analysis?: {
    species?: string
    commonName?: string
    healthStatus?: string
    issues?: string[]
    suggestions?: string[]
    summary?: string
  }
  schedule?: RawScheduleItem[]
}

const ANALYSIS_PROMPT = `你是一位资深园艺师。请仔细观察这张植物照片，完成两件事：

1. 植物分析：识别植物种类、评估健康状态、列出可见问题、给出养护建议。
2. 养护日程：根据该植物的物种特性与当前状态，生成一份养护日程表，包含浇水、施肥、修剪、光照、检查等任务，每项任务给出合理的执行频率。

严格以 JSON 格式返回（不要包含 markdown 代码块、不要多余文字），结构如下：
{
  "analysis": {
    "species": "学名（拉丁文或中文）",
    "commonName": "常见名/俗称",
    "healthStatus": "healthy | warning | critical",
    "issues": ["问题1", "问题2"],
    "suggestions": ["建议1", "建议2"],
    "summary": "一句话总结该植物的状态"
  },
  "schedule": [
    {
      "type": "water | fertilize | prune | sunlight | inspect | repot | other",
      "title": "任务标题",
      "description": "具体操作说明",
      "frequency": "daily | every-2-days | weekly | every-2-weeks | monthly | quarterly | once",
      "intervalDays": 数字（该任务每隔几天执行一次）
    }
  ]
}`

function buildMessages(imageDataUrl: string) {
  return [
    {
      role: 'user',
      content: [
        { type: 'text', text: ANALYSIS_PROMPT },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ],
    },
  ]
}

function extractJson(text: string): RawAnalysis | null {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenceMatch ? fenceMatch[1] : text

  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1) return null

  const jsonStr = candidate.slice(start, end + 1)
  try {
    return JSON.parse(jsonStr) as RawAnalysis
  } catch {
    return null
  }
}

function normalizeHealthStatus(value: string | undefined): PlantAnalysis['healthStatus'] {
  const v = (value ?? 'healthy').toLowerCase().trim()
  if (v.includes('critical') || v.includes('严重') || v.includes('critical')) return 'critical'
  if (v.includes('warning') || v.includes('warn') || v.includes('关注') || v.includes('警告'))
    return 'warning'
  return 'healthy'
}

function normalizeAnalysis(raw: RawAnalysis): PlantAnalysis {
  const a = raw.analysis ?? {}
  return {
    species: a.species ?? '未知植物',
    commonName: a.commonName ?? '',
    healthStatus: normalizeHealthStatus(a.healthStatus),
    issues: Array.isArray(a.issues) ? a.issues.map(String) : [],
    suggestions: Array.isArray(a.suggestions) ? a.suggestions.map(String) : [],
    summary: a.summary ?? '',
  }
}

const FREQ_TO_DAYS: Record<string, number> = {
  daily: 1,
  'every-2-days': 2,
  weekly: 7,
  'every-2-weeks': 14,
  monthly: 30,
  quarterly: 90,
  once: 0,
}

function intervalFor(item: RawScheduleItem): number {
  if (item.intervalDays && item.intervalDays > 0) return item.intervalDays
  const freq = (item.frequency ?? 'weekly').toLowerCase().trim()
  return FREQ_TO_DAYS[freq] ?? 7
}

function normalizeSchedule(raw: RawAnalysis): AnalysisResult['schedule'] {
  const items = Array.isArray(raw.schedule) ? raw.schedule : []
  return items.map((item) => ({
    type: (item.type ?? 'other').toLowerCase().trim() as AnalysisResult['schedule'][number]['type'],
    title: item.title ?? '养护任务',
    description: item.description ?? '',
    frequency: (item.frequency ?? 'weekly').toLowerCase().trim() as AnalysisResult['schedule'][number]['frequency'],
    intervalDays: intervalFor(item),
    startDate: Date.now(),
    nextDue: Date.now(),
  }))
}

export async function analyzePlant(
  imageDataUrl: string,
  settings: AppSettings,
): Promise<AnalysisResult> {
  if (!settings.apiKey) {
    throw new Error('请先在设置中配置 API Key')
  }

  const baseUrl = settings.apiBaseUrl.replace(/\/$/, '')
  const endpoint = `${baseUrl}/chat/completions`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: buildMessages(imageDataUrl),
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`API 请求失败 (${res.status})：${detail.slice(0, 300)}`)
  }

  const data = await res.json()
  const content: string = data?.choices?.[0]?.message?.content ?? ''
  if (!content) {
    throw new Error('API 返回内容为空')
  }

  const raw = extractJson(content)
  if (!raw) {
    throw new Error('无法解析 API 返回的 JSON')
  }

  return {
    analysis: normalizeAnalysis(raw),
    schedule: normalizeSchedule(raw),
  }
}

export async function testConnection(settings: AppSettings): Promise<string> {
  const baseUrl = settings.apiBaseUrl.replace(/\/$/, '')
  const endpoint = `${baseUrl}/chat/completions`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [{ role: 'user', content: '请回复"ok"' }],
      max_tokens: 10,
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`连接失败 (${res.status})：${detail.slice(0, 200)}`)
  }
  const data = await res.json()
  const reply: string = data?.choices?.[0]?.message?.content ?? ''
  return reply || '连接成功'
}
