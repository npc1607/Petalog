import type { ReactNode } from 'react'

interface Props {
  sidebar: ReactNode
  children: ReactNode
}

export function Layout({ sidebar, children }: Props) {
  return (
    <div className="app-layout">
      {sidebar}
      <main className="app-main">{children}</main>
    </div>
  )
}
