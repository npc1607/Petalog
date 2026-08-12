import { useState } from 'react'
import { AddPlantModal } from './components/AddPlantModal'
import { Layout } from './components/Layout'
import { PlantDetail } from './components/PlantDetail'
import { PlantListView } from './components/PlantListView'
import { SettingsView } from './components/SettingsView'
import { Sidebar } from './components/Sidebar'
import type { View } from './components/Sidebar'
import { TodayView } from './components/TodayView'
import { StoreProvider, useStore } from './hooks/useStore'

function AppInner() {
  const [view, setView] = useState<View>('today')
  const [openPlantId, setOpenPlantId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const { addPlant, analyzePlant } = useStore()

  function navigate(view: View) {
    setOpenPlantId(null)
    setView(view)
  }

  function openPlant(id: string) {
    setOpenPlantId(id)
    setView('plants')
  }

  async function handleAddPlant(name: string, photo: string) {
    const id = addPlant(name, photo)
    await analyzePlant(id)
  }

  let content
  if (view === 'today') {
    content = <TodayView onOpenPlant={openPlant} />
  } else if (view === 'plants') {
    content = openPlantId ? (
      <PlantDetail plantId={openPlantId} onBack={() => setOpenPlantId(null)} />
    ) : (
      <PlantListView onOpenPlant={openPlant} onAddPlant={() => setAddOpen(true)} />
    )
  } else {
    content = <SettingsView />
  }

  return (
    <Layout sidebar={<Sidebar current={view} onNavigate={navigate} />}>
      {content}
      <AddPlantModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onConfirm={handleAddPlant}
      />
    </Layout>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  )
}
