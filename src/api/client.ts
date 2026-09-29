import type { AnalysisResult, AppSettings, Plant, PlantAnalysis } from '../types'

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
  // Strip DeepSeek thinking tags (<think>...</think> or unclosed <think>...)
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/gi, '')
    .trim()

  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenceMatch ? fenceMatch[1] : cleaned

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

  const payload: Record<string, unknown> = {
    model: settings.model,
    messages: buildMessages(imageDataUrl),
    temperature: 0.4,
    response_format: { type: 'json_object' },
  }

  let res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  // Fallback: If 400 occurs with response_format, retry without response_format
  if (!res.ok && res.status === 400) {
    const detail = await res.clone().text().catch(() => '')
    if (
      detail.toLowerCase().includes('response_format') ||
      detail.toLowerCase().includes('json') ||
      detail.toLowerCase().includes('schema') ||
      detail.toLowerCase().includes('unrecognized')
    ) {
      delete payload.response_format
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify(payload),
      })
    }
  }

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
      messages: [{ role: 'user', content: '请回复"ok"' }],
      max_tokens: 60,
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`连接失败 (${res.status})：${detail.slice(0, 200)}`)
  }
  const data = await res.json()
  const rawReply: string = data?.choices?.[0]?.message?.content ?? ''
  const reply = rawReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() || rawReply.trim()
  return reply || '连接成功'
}

export async function generateGrowthSummary(
  plant: Plant,
  settings: AppSettings,
): Promise<string> {
  if (!settings.apiKey) {
    throw new Error('请先在设置中配置 API Key')
  }

  const baseUrl = settings.apiBaseUrl.replace(/\/$/, '')
  const endpoint = `${baseUrl}/chat/completions`

  const observations =
    plant.observations && plant.observations.length > 0
      ? plant.observations
      : [
          {
            id: 'init',
            plantId: plant.id,
            photo: plant.photo,
            timestamp: plant.createdAt,
            analysis: plant.analysis,
          },
        ]

  const sorted = [...observations].sort((a, b) => a.timestamp - b.timestamp)

  const obsDetails = sorted
    .map((obs, idx) => {
      const timeStr = new Date(obs.timestamp).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
      const a = obs.analysis
      if (!a) {
        return `【记录 ${idx + 1}】时间：${timeStr}，暂未完成分析`
      }
      const issues = a.issues && a.issues.length > 0 ? a.issues.join('、') : '无明显问题'
      const suggestions = a.suggestions && a.suggestions.length > 0 ? a.suggestions.join('；') : '保持现状'
      return `【记录 ${idx + 1}】时间：${timeStr}
- 健康评级：${a.healthStatus}
- 诊断总结：${a.summary || '无'}
- 发现问题：${issues}
- 养护建议：${suggestions}`
    })
    .join('\n\n')

  const careLogs = plant.careLogs && plant.careLogs.length > 0 ? plant.careLogs : []
  const sortedLogs = [...careLogs].sort((a, b) => a.timestamp - b.timestamp)
  const careLogText =
    sortedLogs.length > 0
      ? sortedLogs
          .map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
            return `- ${timeStr} 完成【${log.taskTitle}】`
          })
          .join('\n')
      : '暂无独立养护动作打卡记录（可能按默认周期养护）'

  const currentScheduleText =
    plant.schedule.length > 0
      ? plant.schedule
          .map((t) => `- ${t.title}: 每隔 ${t.intervalDays} 天 (${t.frequency})，说明: ${t.description}`)
          .join('\n')
      : '暂未设定明确周期'

  const prompt = `你是一位植物生理与家庭园艺专家。
用户正在长期追踪观察植物「${plant.name}」（可能物种：${plant.analysis?.commonName || plant.analysis?.species || '未知'}）。

【用户实际养护打卡历程】：
${careLogText}

【当前设定的养护任务周期】：
${currentScheduleText}

【按时间先后顺序记录的照片观察与 AI 诊断】：
${obsDetails}

请紧密结合用户的【实际养护打卡执行历程】与【植物健康状态演变】，撰写一份生动、深入、具有指导性的【植物生长复盘与养护周期调整建议】：
1. 📈 【长势与养护效果复盘】：对照用户的浇水/施肥等日常打卡与植物叶片、健康状态的变化，评估前序养护动作的效果（是否浇水过多/过少、施肥是否适量等）。
2. ⏱️ 【养护任务周期调整建议】：根据最新诊断的健康状态（如积水、干旱、缺乏养分等），明确指出当前各项任务的周期（如浇水、施肥间隔）是否需要调整，给出具体的调整天数建议。
3. 🌿 【下一阶段精细化养护重点】：针对当前发现的关键隐患，给出未来几天到几周的实操提醒与注意事项。

请直接返回条理清晰的中文文本（使用 Markdown 格式，层级分明，语气亲切专业）。`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`总结生成失败 (${res.status})：${detail.slice(0, 200)}`)
  }

  const data = await res.json()
  const rawReply: string = data?.choices?.[0]?.message?.content ?? ''
  const reply = rawReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() || rawReply.trim()
  if (!reply) {
    throw new Error('生成的总结内容为空')
  }
  return reply
}

