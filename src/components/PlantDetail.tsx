import { AlertCircle, ArrowLeft, CalendarDays, Loader2, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import { HealthBadge } from './HealthBadge'
import { TaskItem } from './TaskItem'
import { useStore } from '../hooks/useStore'
import { getPlantTodaysTasks } from '../lib/schedule'

interface Props {
  plantId: string
  onBack: () => void
}

export function PlantDetail({ plantId, onBack }: Props) {
  const { plants, analyzePlant, completeTask, deletePlant, analyzingPlantId, analysisError } = useStore()
  const plant = plants.find((p) => p.id === plantId)

  if (!plant) {
    return (
      <div className="empty-state">
        <h2>植物不存在</h2>
        <button className="btn-ghost" onClick={onBack}>返回</button>
      </div>
    )
  }

  const analyzing = analyzingPlantId === plantId
  const todays = getPlantTodaysTasks(plant)
  const upcoming = plant.schedule.filter((t) => !todays.includes(t)).sort((a, b) => a.nextDue - b.nextDue)

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
            className="btn-ghost"
            onClick={() => analyzePlant(plant.id).catch(() => {})}
            disabled={analyzing}
          >
            {analyzing ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
            {analyzing ? '分析中…' : '重新分析'}
          </button>
          <button
            className="btn-danger-ghost"
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

      <div className="detail-photo">
        <img src={plant.photo} alt={plant.name} />
      </div>

      {analysisError && analyzingPlantId === plant.id && (
        <div className="inline-error">
          <AlertCircle size={16} />
          <span>{analysisError}</span>
        </div>
      )}

      {plant.analysis ? (
        <section className="panel">
          <div className="panel-head">
            <h2>AI 分析结果</h2>
            <HealthBadge status={plant.analysis.healthStatus} />
          </div>
          {plant.analysis.summary && <p className="analysis-summary">{plant.analysis.summary}</p>}
          {plant.analysis.species && (
            <p className="analysis-meta"><span>物种</span>{plant.analysis.species}</p>
          )}
          {plant.analysis.issues.length > 0 && (
            <div className="analysis-block">
              <h4>发现的问题</h4>
              <ul>
                {plant.analysis.issues.map((issue, i) => <li key={i}>{issue}</li>)}
              </ul>
            </div>
          )}
          {plant.analysis.suggestions.length > 0 && (
            <div className="analysis-block">
              <h4>养护建议</h4>
              <ul>
                {plant.analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <section className="panel panel-cta">
          <Sparkles size={32} />
          <h2>尚未分析</h2>
          <p>点击「重新分析」，AI 会识别植物并生成养护日程</p>
        </section>
      )}

      {todays.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h2>今日任务</h2>
            <span className="panel-count">{todays.length}</span>
          </div>
          <div className="task-list">
            {todays.map((task) => (
              <TaskItem key={task.id} task={task} onComplete={() => completeTask(plant.id, task.id)} />
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2><CalendarDays size={18} /> 养护日程</h2>
          <span className="panel-count">{plant.schedule.length}</span>
        </div>
        {upcoming.length === 0 && todays.length === 0 ? (
          <p className="panel-empty">暂无养护任务，请先进行分析</p>
        ) : (
          <div className="task-list">
            {upcoming.map((task) => (
              <TaskItem key={task.id} task={task} onComplete={() => completeTask(plant.id, task.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
