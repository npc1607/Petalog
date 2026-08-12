import { Leaf, Plus } from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { EmptyState } from './EmptyState'
import { PlantCard } from './PlantCard'

interface Props {
  onOpenPlant: (id: string) => void
  onAddPlant: () => void
}

export function PlantListView({ onOpenPlant, onAddPlant }: Props) {
  const { plants } = useStore()

  return (
    <div className="plants-view">
      <header className="view-header">
        <div>
          <h1>我的植物</h1>
          <p>{plants.length} 株植物</p>
        </div>
        <button className="btn-primary" onClick={onAddPlant}>
          <Plus size={18} /> 添加植物
        </button>
      </header>

      {plants.length === 0 ? (
        <EmptyState
          icon={<Leaf size={48} />}
          title="还没有植物"
          hint="点击「添加植物」上传照片，AI 会帮你识别并生成养护日程"
          action={
            <button className="btn-primary" onClick={onAddPlant}>
              <Plus size={18} /> 添加第一株植物
            </button>
          }
        />
      ) : (
        <div className="plant-grid">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} onClick={() => onOpenPlant(plant.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
