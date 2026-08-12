import { CalendarCheck, Leaf, Settings as SettingsIcon } from 'lucide-react'

export type View = 'today' | 'plants' | 'settings'

interface Props {
  current: View
  onNavigate: (view: View) => void
}

const NAV = [
  { key: 'today' as const, label: '今日待办', icon: CalendarCheck },
  { key: 'plants' as const, label: '我的植物', icon: Leaf },
  { key: 'settings' as const, label: '设置', icon: SettingsIcon },
]

export function Sidebar({ current, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Leaf size={24} className="brand-icon" />
        <span className="brand-name">Petalog</span>
      </div>
      <nav className="nav">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`nav-item ${current === key ? 'active' : ''}`}
            onClick={() => onNavigate(key)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <p>植物养护 · 每日提醒</p>
      </div>
    </aside>
  )
}
