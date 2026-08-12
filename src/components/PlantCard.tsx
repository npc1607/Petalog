import { Calendar, Leaf } from 'lucide-react'
import { HealthBadge } from './HealthBadge'
import { getPlantTodaysTasks } from '../lib/schedule'
import type { Plant } from '../types'

interface Props {
  plant: Plant
  onClick: () => void
}

export function PlantCard({ plant, onClick }: Props) {
  const todays = getPlantTodaysTasks(plant)
  return (
    <button className="plant-card" onClick={onClick}>
      <div className="plant-card-photo">
        {plant.photo ? (
          <img src={plant.photo} alt={plant.name} />
        ) : (
          <div className="photo-placeholder">
            <Leaf size={32} />
          </div>
        )}
        {plant.analysis && (
          <div className="plant-card-badge">
            <HealthBadge status={plant.analysis.healthStatus} />
          </div>
        )}
      </div>
      <div className="plant-card-info">
        <h3 className="plant-card-name">{plant.name}</h3>
        <p className="plant-card-species">
          {plant.analysis?.commonName || plant.analysis?.species || '尚未分析'}
        </p>
        <div className="plant-card-meta">
          <Calendar size={14} />
          <span>
            {plant.schedule.length} 项任务
            {todays.length > 0 && <span className="due-count"> · 今日 {todays.length}</span>}
          </span>
        </div>
      </div>
    </button>
  )
}
