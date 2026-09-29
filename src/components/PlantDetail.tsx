import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Droplets,
  Eye,
  Flower2,
  Loader2,
  Plus,
  RefreshCw,
  Scissors,
  Sparkles,
  Sun,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { HealthBadge } from './HealthBadge'
import { TaskItem } from './TaskItem'
import { useStore } from '../hooks/useStore'
import { getPlantTodaysTasks } from '../lib/schedule'
import { fileToCompressedDataUrl } from '../lib/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { CareLog, PlantObservation, TaskType } from '../types'

interface Props {
  plantId: string
  onBack: () => void
}

type TimelineFilter = 'all' | 'photos' | 'care'

type TimelineEntry =
  | { kind: 'observation'; data: PlantObservation; timestamp: number }
  | { kind: 'careLog'; data: CareLog; timestamp: number }

function getCareIcon(type: TaskType) {
  switch (type) {
    case 'water':
      return <Droplets size={16} />
    case 'fertilize':
      return <Flower2 size={16} />
    case 'prune':
      return <Scissors size={16} />
    case 'sunlight':
      return <Sun size={16} />
    default:
      return <Eye size={16} />
  }
}

export function PlantDetail({ plantId, onBack }: Props) {
  const {
    plants,
    analyzePlant,
    addObservation,
    deleteObservation,
    generateSummary,
    completeTask,
    deletePlant,
    analyzingPlantId,
    generatingSummaryPlantId,
    analysisError,
  } = useStore()

  const plant = plants.find((p) => p.id === plantId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedObsId, setSelectedObsId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all')
  const [tasksToCompleteWithPhoto, setTasksToCompleteWithPhoto] = useState<string[]>([])

  const observations: PlantObservation[] = useMemo(() => {
    if (!plant) return []
    if (!plant.observations || plant.observations.length === 0) {
      return [
        {
          id: `init-${plant.id}`,
          plantId: plant.id,
          photo: plant.photo,
          timestamp: plant.createdAt || Date.now(),
          analysis: plant.analysis,
        },
      ]
    }
    return [...plant.observations].sort((a, b) => b.timestamp - a.timestamp)
  }, [plant])

  const careLogs: CareLog[] = useMemo(() => {
    return plant?.careLogs ? [...plant.careLogs].sort((a, b) => b.timestamp - a.timestamp) : []
  }, [plant])

  const timelineEntries: TimelineEntry[] = useMemo(() => {
    const list: TimelineEntry[] = []

    if (timelineFilter === 'all' || timelineFilter === 'photos') {
      observations.forEach((obs) => {
        list.push({ kind: 'observation', data: obs, timestamp: obs.timestamp })
      })
    }

    if (timelineFilter === 'all' || timelineFilter === 'care') {
      careLogs.forEach((log) => {
        list.push({ kind: 'careLog', data: log, timestamp: log.timestamp })
      })
    }

    return list.sort((a, b) => b.timestamp - a.timestamp)
  }, [observations, careLogs, timelineFilter])

  const activeObs = observations.find((o) => o.id === selectedObsId) || observations[0]
  const isLatest = activeObs?.id === observations[0]?.id
  const analyzing = analyzingPlantId === plantId

  if (!plant) {
    return (
      <div className="empty-state">
        <h2>植物不存在</h2>
        <button className="btn-ghost" onClick={onBack}>
          返回
        </button>
      </div>
    )
  }

  const todays = getPlantTodaysTasks(plant)
  const upcoming = plant.schedule
    .filter((t) => !todays.includes(t))
    .sort((a, b) => a.nextDue - b.nextDue)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setUploadError('请选择有效的图片文件 (JPG/PNG)')
      return
    }
    setUploadError(null)
    setUploading(true)
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      const newObsId = await addObservation(
        plantId,
        dataUrl,
        tasksToCompleteWithPhoto.length > 0 ? tasksToCompleteWithPhoto : undefined,
      )
      setSelectedObsId(newObsId)
      setTasksToCompleteWithPhoto([])
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : '上传失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleGenerateSummary() {
    try {
      await generateSummary(plantId)
    } catch (e) {
      alert(e instanceof Error ? e.message : '生成生长总结失败，请检查 API 配置')
    }
  }

  async function handleReAnalyze() {
    if (!activeObs) return
    try {
      await analyzePlant(plantId, activeObs.id)
    } catch {
      // error state handled in store
    }
  }

  function handleDeleteObs(e: React.MouseEvent, obsId: string) {
    e.stopPropagation()
    if (observations.length <= 1) {
      alert('至少需要保留一条植物观察记录')
      return
    }
    if (window.confirm('确定删除该条观察记录吗？')) {
      deleteObservation(plantId, obsId)
      if (selectedObsId === obsId) {
        setSelectedObsId(null)
      }
    }
  }

  function toggleTaskForUpload(taskId: string) {
    setTasksToCompleteWithPhoto((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    )
  }

  const currentAnalysis = activeObs?.analysis || (isLatest ? plant.analysis : undefined)

  return (
    <div className="detail-view">
      <header className="view-header">
        <button className="icon-back" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="detail-head-info">
          <h1>{plant.name}</h1>
          <p>{plant.analysis?.commonName || plant.analysis?.species || '尚未分析'}</p>
        </div>
        <div className="detail-head-actions">
          <button
            className="btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
            拍照打卡
          </button>
          <button
            className="btn-ghost"
            onClick={handleReAnalyze}
            disabled={analyzing}
            title="对当前照片重新执行 AI 分析"
          >
            {analyzing ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
            {analyzing ? '分析中…' : '重新分析'}
          </button>
          <button
            className="btn-danger-ghost"
            title="删除植物"
            onClick={() => {
              if (window.confirm(`确定删除「${plant.name}」吗？`)) {
                deletePlant(plant.id)
                onBack()
              }
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {/* Hidden file input for uploading check-in photos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      <div className="detail-grid">
        {/* Left Column: Photo, AI Analysis, Growth Summary, Care Schedule */}
        <div className="detail-main-col">
          {activeObs && (
            <div className="detail-photo">
              <img src={activeObs.photo} alt={plant.name} />
              <div className="detail-photo-badge">
                <Clock size={13} />
                <span>记录时间：{format(activeObs.timestamp, 'yyyy-MM-dd HH:mm')}</span>
                {isLatest && <span className="badge-latest">最新状态</span>}
                {activeObs.completedTasks && activeObs.completedTasks.length > 0 && (
                  <span className="badge-latest" style={{ background: 'var(--moss)' }}>
                    已完成: {activeObs.completedTasks.join('、')}
                  </span>
                )}
              </div>
            </div>
          )}

          {analysisError && analyzingPlantId === plant.id && (
            <div className="inline-error">
              <AlertCircle size={16} />
              <span>{analysisError}</span>
            </div>
          )}

          {/* Single Observation AI Analysis */}
          {currentAnalysis ? (
            <section className="panel">
              <div className="panel-head">
                <h2>
                  <Sparkles size={18} /> 当前拍摄健康诊断
                </h2>
                <HealthBadge status={currentAnalysis.healthStatus} />
              </div>
              {currentAnalysis.summary && (
                <p className="analysis-summary">{currentAnalysis.summary}</p>
              )}
              {currentAnalysis.species && (
                <p className="analysis-meta">
                  <span>识别物种</span>
                  {currentAnalysis.species}{' '}
                  {currentAnalysis.commonName ? `(${currentAnalysis.commonName})` : ''}
                </p>
              )}
              {currentAnalysis.issues.length > 0 && (
                <div className="analysis-block">
                  <h4>发现的问题</h4>
                  <ul>
                    {currentAnalysis.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {currentAnalysis.suggestions.length > 0 && (
                <div className="analysis-block">
                  <h4>养护建议</h4>
                  <ul>
                    {currentAnalysis.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ) : (
            <section className="panel panel-cta">
              <Sparkles size={32} />
              <h2>尚未分析该记录</h2>
              <p>点击「重新分析」，AI 将对当前选中的照片识别并给出健康建议与周期调整</p>
            </section>
          )}

          {/* Multi-day Growth Summary & Insights Generator */}
          <section className="panel growth-summary-panel">
            <div className="growth-summary-head">
              <h2>
                <TrendingUp size={20} /> AI 生长阶段总结与建议
              </h2>
              <button
                className="btn-primary"
                onClick={handleGenerateSummary}
                disabled={generatingSummaryPlantId === plant.id || analyzing}
              >
                {generatingSummaryPlantId === plant.id ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {plant.growthSummary ? '更新总结建议' : '生成阶段总结'}
              </button>
            </div>

            {plant.growthSummary ? (
              <div>
                <div className="growth-summary-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {plant.growthSummary.summary}
                  </ReactMarkdown>
                </div>
                <span className="growth-summary-time">
                  更新时间：{format(plant.growthSummary.generatedAt, 'yyyy-MM-dd HH:mm')} ·
                  已联动 {observations.length} 次照片观察与 {careLogs.length} 次养护历程
                </span>
              </div>
            ) : (
              <div className="growth-summary-empty">
                <p>
                  已累计记录 {observations.length} 次照片与 {careLogs.length} 次养护打卡。点击右上角「生成阶段总结」，AI 将对比养护动作前后的长势变化、复盘近期健康趋势，并给出针对性的进阶养护指南。
                </p>
              </div>
            )}
          </section>

          {/* Today's Tasks */}
          {todays.length > 0 && (
            <section className="panel">
              <div className="panel-head">
                <h2>今日待办任务</h2>
                <span className="panel-count">{todays.length}</span>
              </div>
              <div className="task-list">
                {todays.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={() => completeTask(plant.id, task.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Care Tasks Schedule */}
          <section className="panel">
            <div className="panel-head">
              <h2>
                <CalendarDays size={18} /> 养护任务周期 (AI 动态调整)
              </h2>
              <span className="panel-count">{plant.schedule.length}</span>
            </div>
            {upcoming.length === 0 && todays.length === 0 ? (
              <p className="panel-empty">暂无养护任务，请先进行照片分析</p>
            ) : (
              <div className="task-list">
                {upcoming.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={() => completeTask(plant.id, task.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Unified Observation & Care Timeline */}
        <div className="detail-side-col">
          <section className="panel timeline-panel">
            <div className="panel-head">
              <h2>
                <CalendarDays size={18} /> 植物成长与养护日程
              </h2>
              <div className="timeline-header-actions">
                <span className="panel-count">{timelineEntries.length} 条记录</span>
              </div>
            </div>

            <p className="timeline-desc">
              每天不同时间上传打卡或完成养护动作，均会在此沉淀为时间历程
            </p>

            {/* Filter Tabs */}
            <div className="timeline-tabs">
              <button
                type="button"
                className={`timeline-tab-btn ${timelineFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTimelineFilter('all')}
              >
                全部历程 ({observations.length + careLogs.length})
              </button>
              <button
                type="button"
                className={`timeline-tab-btn ${timelineFilter === 'photos' ? 'active' : ''}`}
                onClick={() => setTimelineFilter('photos')}
              >
                拍照诊断 ({observations.length})
              </button>
              <button
                type="button"
                className={`timeline-tab-btn ${timelineFilter === 'care' ? 'active' : ''}`}
                onClick={() => setTimelineFilter('care')}
              >
                养护打卡 ({careLogs.length})
              </button>
            </div>

            {uploadError && (
              <div className="inline-error" style={{ marginBottom: 12 }}>
                <AlertCircle size={15} />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="timeline-list">
              {timelineEntries.length === 0 ? (
                <p className="panel-empty">暂无记录</p>
              ) : (
                timelineEntries.map((entry, idx) => {
                  if (entry.kind === 'observation') {
                    const obs = entry.data
                    const isActive = activeObs?.id === obs.id
                    const isNewest = idx === 0
                    const formattedTime = format(obs.timestamp, 'M月d日 HH:mm')
                    return (
                      <div
                        key={obs.id}
                        className={`timeline-item ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedObsId(obs.id)}
                      >
                        <div className="timeline-thumb">
                          <img src={obs.photo} alt="记录照片" />
                        </div>
                        <div className="timeline-meta">
                          <div className="timeline-meta-top">
                            <span className="timeline-time">
                              <Camera size={12} /> {formattedTime}
                            </span>
                            {isNewest && <span className="preset-badge">最新</span>}
                            {obs.analysis && <HealthBadge status={obs.analysis.healthStatus} />}
                          </div>
                          <div className="timeline-summary">
                            {obs.analysis?.summary ||
                              (analyzing && isNewest ? 'AI 分析中…' : '点击查看诊断')}
                          </div>
                          {obs.completedTasks && obs.completedTasks.length > 0 && (
                            <span className="obs-task-tag">
                              <CheckCircle2 size={10} /> 伴随养护: {obs.completedTasks.join('、')}
                            </span>
                          )}
                        </div>
                        <div className="timeline-item-actions">
                          {observations.length > 1 && (
                            <button
                              className="timeline-del-btn"
                              title="删除此照片记录"
                              onClick={(e) => handleDeleteObs(e, obs.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  } else {
                    const log = entry.data
                    const formattedTime = format(log.timestamp, 'M月d日 HH:mm')
                    return (
                      <div key={log.id} className="timeline-care-item">
                        <div className={`timeline-care-icon ${log.taskType}`}>
                          {getCareIcon(log.taskType)}
                        </div>
                        <div className="timeline-care-meta">
                          <div className="timeline-meta-top">
                            <span className="timeline-care-title">{log.taskTitle}</span>
                            <span className="timeline-care-badge">已完成</span>
                          </div>
                          <span className="timeline-time" style={{ color: 'var(--ink-faint)' }}>
                            <Clock size={11} /> {formattedTime}
                          </span>
                        </div>
                      </div>
                    )
                  }
                })
              )}
            </div>

            {/* Quick check-in with photo upload */}
            {todays.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  background: 'rgba(107, 155, 84, 0.08)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--moss-deep)', display: 'block', marginBottom: 6 }}>
                  📸 拍照同时标记今日完成：
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {todays.map((t) => {
                    const checked = tasksToCompleteWithPhoto.includes(t.id)
                    return (
                      <label
                        key={t.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer',
                          color: checked ? 'var(--moss-deep)' : 'var(--ink-muted)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTaskForUpload(t.id)}
                        />
                        <span>{t.title}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            <div
              className="timeline-upload-box"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files[0]
                if (file) handleFile(file)
              }}
            >
              <Camera size={20} />
              <span>点击或拖拽上传新照片</span>
              <small>每天不同时段拍摄打卡，记录健康历程并自动校准养护周期</small>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

