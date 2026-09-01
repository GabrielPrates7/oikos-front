import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import './Shell.css'

export function Shell() {
  return (
    <div className="shell">
      <Sidebar />
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
