import { LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { MobileMenu } from './MobileMenu'
import './Header.css'

export function Header() {
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="header">
      <button
        type="button"
        className="header__menu-toggle"
        aria-label="Abrir menu"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      <span className="header__user">{user?.name}</span>

      <button type="button" className="header__logout" onClick={() => void logout()}>
        <LogOut size={18} aria-hidden="true" />
        <span>Sair</span>
      </button>

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  )
}
