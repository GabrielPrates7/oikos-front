import { LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import './Header.css'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="header">
      <span className="header__user">{user?.name}</span>
      <button type="button" className="header__logout" onClick={() => void logout()}>
        <LogOut size={18} aria-hidden="true" />
        <span>Sair</span>
      </button>
    </header>
  )
}
