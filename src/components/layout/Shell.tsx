import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import './Shell.css'

const SIDEBAR_COLLAPSED_KEY = 'oikos:sidebar-collapsed'

export function Shell() {
  // Estado mora aqui (não dentro do Sidebar) porque o brilho ambiente de fundo
  // (.shell__main::before) também depende da largura da sidebar pra não vazar atrás dela.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? '1' : '0')
    } catch {
      // localStorage indisponível (modo privado, etc.) — só não persiste, não quebra a UI.
    }
  }, [sidebarCollapsed])

  return (
    <div className={`shell${sidebarCollapsed ? ' shell--sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
      />
      <div className="shell__main">
        <Header />
        <main className="shell__content">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
