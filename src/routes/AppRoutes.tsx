import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from '../components/layout/Shell'
import { LoginPage } from '../modules/auth/LoginPage'
import { RegisterPage } from '../modules/auth/RegisterPage'
import { ChangePasswordForm } from '../modules/configuracoes/ChangePasswordForm'
import { ConfiguracoesPage } from '../modules/configuracoes/ConfiguracoesPage'
import { PreferenciasTab } from '../modules/configuracoes/PreferenciasTab'
import { ProfileForm } from '../modules/configuracoes/ProfileForm'
import { CartaoDetalhePage } from '../modules/cartoes/CartaoDetalhePage'
import { CartoesPage } from '../modules/cartoes/CartoesPage'
import { CategoriasPage } from '../modules/categorias/CategoriasPage'
import { ContasPage } from '../modules/contas/ContasPage'
import { ExtratoPage } from '../modules/contas/ExtratoPage'
import { DashboardPage } from '../modules/dashboard/DashboardPage'
import { DespesasPage } from '../modules/despesas/DespesasPage'
import { EntradasPage } from '../modules/entradas/EntradasPage'
import { FaturaDetalhePage } from '../modules/faturas/FaturaDetalhePage'
import { FaturasPage } from '../modules/faturas/FaturasPage'
import { ComparativoTab } from '../modules/relatorios/ComparativoTab'
import { EvolucaoMensalTab } from '../modules/relatorios/EvolucaoMensalTab'
import { PorCategoriaTab } from '../modules/relatorios/PorCategoriaTab'
import { RelatoriosPage } from '../modules/relatorios/RelatoriosPage'
import { TransferenciasPage } from '../modules/transferencias/TransferenciasPage'
import { ProtectedRoute } from './ProtectedRoute'

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
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/contas" element={<ContasPage />} />
        <Route path="/contas/:id/extrato" element={<ExtratoPage />} />
        <Route path="/categorias" element={<CategoriasPage />} />
        <Route path="/entradas" element={<EntradasPage />} />
        <Route path="/despesas" element={<DespesasPage />} />
        <Route path="/transferencias" element={<TransferenciasPage />} />
        <Route path="/cartoes" element={<CartoesPage />} />
        <Route path="/cartoes/:id" element={<CartaoDetalhePage />} />
        <Route path="/faturas" element={<FaturasPage />} />
        <Route path="/faturas/:id" element={<FaturaDetalhePage />} />

        <Route path="/relatorios" element={<RelatoriosPage />}>
          <Route index element={<Navigate to="por-categoria" replace />} />
          <Route path="por-categoria" element={<PorCategoriaTab />} />
          <Route path="evolucao-mensal" element={<EvolucaoMensalTab />} />
          <Route path="comparativo" element={<ComparativoTab />} />
        </Route>

        <Route path="/configuracoes" element={<ConfiguracoesPage />}>
          <Route index element={<Navigate to="perfil" replace />} />
          <Route path="perfil" element={<ProfileForm />} />
          <Route path="preferencias" element={<PreferenciasTab />} />
          <Route path="seguranca" element={<ChangePasswordForm />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
