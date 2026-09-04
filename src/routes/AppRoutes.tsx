import { Navigate, Route, Routes } from 'react-router-dom'
import { ComingSoon } from '../components/feedback/ComingSoon'
import { Shell } from '../components/layout/Shell'
import { LoginPage } from '../modules/auth/LoginPage'
import { RegisterPage } from '../modules/auth/RegisterPage'
import { ChangePasswordForm } from '../modules/configuracoes/ChangePasswordForm'
import { ConfiguracoesPage } from '../modules/configuracoes/ConfiguracoesPage'
import { ProfileForm } from '../modules/configuracoes/ProfileForm'
import { CartaoDetalhePage } from '../modules/cartoes/CartaoDetalhePage'
import { CartoesPage } from '../modules/cartoes/CartoesPage'
import { CategoriasPage } from '../modules/categorias/CategoriasPage'
import { ContasPage } from '../modules/contas/ContasPage'
import { DespesasPage } from '../modules/despesas/DespesasPage'
import { EntradasPage } from '../modules/entradas/EntradasPage'
import { FaturaDetalhePage } from '../modules/faturas/FaturaDetalhePage'
import { FaturasPage } from '../modules/faturas/FaturasPage'
import { TransferenciasPage } from '../modules/transferencias/TransferenciasPage'
import { ProtectedRoute } from './ProtectedRoute'

const PROTECTED_MODULES: { path: string; title: string }[] = [
  { path: '/dashboard', title: 'Dashboard' },
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

        <Route path="/contas" element={<ContasPage />} />
        <Route path="/categorias" element={<CategoriasPage />} />
        <Route path="/entradas" element={<EntradasPage />} />
        <Route path="/despesas" element={<DespesasPage />} />
        <Route path="/transferencias" element={<TransferenciasPage />} />
        <Route path="/cartoes" element={<CartoesPage />} />
        <Route path="/cartoes/:id" element={<CartaoDetalhePage />} />
        <Route path="/faturas" element={<FaturasPage />} />
        <Route path="/faturas/:id" element={<FaturaDetalhePage />} />

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
