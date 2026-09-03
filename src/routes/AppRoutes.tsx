import { Navigate, Route, Routes } from 'react-router-dom'
import { ComingSoon } from '../components/feedback/ComingSoon'
import { Shell } from '../components/layout/Shell'
import { LoginPage } from '../modules/auth/LoginPage'
import { RegisterPage } from '../modules/auth/RegisterPage'
import { ChangePasswordForm } from '../modules/configuracoes/ChangePasswordForm'
import { ConfiguracoesPage } from '../modules/configuracoes/ConfiguracoesPage'
import { ProfileForm } from '../modules/configuracoes/ProfileForm'
import { ProtectedRoute } from './ProtectedRoute'

const PROTECTED_MODULES: { path: string; title: string }[] = [
  { path: '/dashboard', title: 'Dashboard' },
  { path: '/contas', title: 'Contas' },
  { path: '/categorias', title: 'Categorias' },
  { path: '/entradas', title: 'Entradas' },
  { path: '/despesas', title: 'Despesas' },
  { path: '/transferencias', title: 'Transferências' },
  { path: '/cartoes', title: 'Cartões' },
  { path: '/faturas', title: 'Faturas' },
  { path: '/relatorios', title: 'Relatórios' },
]

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Shell />
          </ProtectedRoute>
        }
      >
        {PROTECTED_MODULES.map(({ path, title }) => (
          <Route key={path} path={path} element={<ComingSoon title={title} />} />
        ))}

        <Route path="/configuracoes" element={<ConfiguracoesPage />}>
          <Route index element={<Navigate to="perfil" replace />} />
          <Route path="perfil" element={<ProfileForm />} />
          <Route path="preferencias" element={<ComingSoon title="Preferências" />} />
          <Route path="seguranca" element={<ChangePasswordForm />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
