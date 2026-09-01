import { Navigate, Route, Routes } from 'react-router-dom'
import { ComingSoon } from '../components/feedback/ComingSoon'
import { Shell } from '../components/layout/Shell'
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
  { path: '/configuracoes', title: 'Configurações' },
]

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<ComingSoon title="Login" />} />
      <Route path="/register" element={<ComingSoon title="Cadastro" />} />

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
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
