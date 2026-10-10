import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from '../components/layout/Shell'
import { LoginPage } from '../modules/auth/LoginPage'
import { RegisterPage } from '../modules/auth/RegisterPage'
import { SegurancaTab } from '../modules/configuracoes/SegurancaTab'
import { ConfiguracoesPage } from '../modules/configuracoes/ConfiguracoesPage'
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
import { MetaDetalhePage } from '../modules/metas/MetaDetalhePage'
import { MetasPage } from '../modules/metas/MetasPage'
import { OrcamentosPage } from '../modules/orcamentos/OrcamentosPage'
import { PlanoPage } from '../modules/plano/PlanoPage'
import { ComparativoTab } from '../modules/relatorios/ComparativoTab'
import { EvolucaoMensalTab } from '../modules/relatorios/EvolucaoMensalTab'
import { PorCategoriaTab } from '../modules/relatorios/PorCategoriaTab'
import { RelatoriosPage } from '../modules/relatorios/RelatoriosPage'
import { VisaoGeralTab } from '../modules/relatorios/VisaoGeralTab'
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
        <Route path="/plano" element={<PlanoPage />} />
        <Route path="/orcamentos" element={<OrcamentosPage />} />
        <Route path="/metas" element={<MetasPage />} />
        <Route path="/metas/:id" element={<MetaDetalhePage />} />

        <Route path="/relatorios" element={<RelatoriosPage />}>
          <Route index element={<Navigate to="visao-geral" replace />} />
          <Route path="visao-geral" element={<VisaoGeralTab />} />
          <Route path="por-categoria" element={<PorCategoriaTab />} />
          <Route path="evolucao-mensal" element={<EvolucaoMensalTab />} />
          <Route path="comparativo" element={<ComparativoTab />} />
        </Route>

        <Route path="/configuracoes" element={<ConfiguracoesPage />}>
          <Route index element={<Navigate to="perfil" replace />} />
          <Route path="perfil" element={<ProfileForm />} />
          {/* Aba removida — quem tinha /configuracoes/preferencias salva/favoritada cai no
              Perfil em vez de 404. */}
          <Route path="preferencias" element={<Navigate to="/configuracoes/perfil" replace />} />
          <Route path="seguranca" element={<SegurancaTab />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
