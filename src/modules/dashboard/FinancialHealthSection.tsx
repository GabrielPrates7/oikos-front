import { BudgetComparisonChart } from '../../components/charts/BudgetComparisonChart'
import type { BudgetComparisonItem } from '../../components/charts/BudgetComparisonChart'
import { SpendingTrendsChart } from '../../components/charts/SpendingTrendsChart'
import type { SpendingTrendsResult } from '../relatorios/relatorios.types'
import { MonthlyEvolutionSummary } from './MonthlyEvolutionSummary'
import type { DashboardTotals } from './dashboard.types'
import './FinancialHealthSection.css'

interface FinancialHealthSectionProps {
  budgetComparisonData: BudgetComparisonItem[]
  spendingTrends: SpendingTrendsResult
  totals: DashboardTotals
}

// 3 itens (sem "Alocação de Ativos", removida deliberadamente da imagem de referência) —
// alargados igualmente pra preencher o espaço que o quarto item deixaria vazio.
export function FinancialHealthSection({
  budgetComparisonData,
  spendingTrends,
  totals,
}: FinancialHealthSectionProps) {
  return (
    <div className="financial-health-section">
      <h2 className="financial-health-section__title">Análise de Saúde Financeira</h2>
      <div className="financial-health-section__grid">
        <div className="financial-health-section__item">
          <h3 className="financial-health-section__item-title">Orçamentos vs Gasto</h3>
          <BudgetComparisonChart
            data={budgetComparisonData}
            emptyMessage="Nenhum orçamento cadastrado nesse mês."
          />
        </div>
        <div className="financial-health-section__item">
          <h3 className="financial-health-section__item-title">Tendências de Gastos Mensais</h3>
          <SpendingTrendsChart
            months={spendingTrends.months}
            categories={spendingTrends.categories}
            emptyMessage="Sem despesas suficientes nos últimos meses pra calcular tendências."
          />
        </div>
        <div className="financial-health-section__item">
          <MonthlyEvolutionSummary totals={totals} />
        </div>
      </div>
    </div>
  )
}
