import { BudgetComparisonChart } from '../../components/charts/BudgetComparisonChart'
import type { BudgetComparisonItem } from '../../components/charts/BudgetComparisonChart'
import { SpendingTrendsChart } from '../../components/charts/SpendingTrendsChart'
import type { MonthlyEvolutionItem, SpendingTrendsResult } from '../relatorios/relatorios.types'
import { MonthlyCashFlowPanel } from './MonthlyCashFlowPanel'
import './FinancialHealthSection.css'

interface FinancialHealthSectionProps {
  budgetComparisonData: BudgetComparisonItem[]
  spendingTrends: SpendingTrendsResult
  monthlyEvolution: MonthlyEvolutionItem[]
}

// 3 itens (sem "Alocação de Ativos", removida deliberadamente da imagem de referência) —
// alargados igualmente pra preencher o espaço que o quarto item deixaria vazio.
export function FinancialHealthSection({
  budgetComparisonData,
  spendingTrends,
  monthlyEvolution,
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
            orientation="vertical"
          />
        </div>
        <div className="financial-health-section__item">
          {/* Sufixo dinâmico (não "(6 meses)" fixo) — reflete o tamanho real da janela
              recebida da API (spendingTrends.months), que já é configurável via
              monthsBack no backend; hardcoded ficaria errado se esse padrão mudar. */}
          <h3 className="financial-health-section__item-title">
            Tendências de Gastos Mensais ({spendingTrends.months.length} meses)
          </h3>
          <SpendingTrendsChart
            months={spendingTrends.months}
            categories={spendingTrends.categories}
            emptyMessage="Sem despesas suficientes nos últimos meses pra calcular tendências."
          />
        </div>
        <div className="financial-health-section__item">
          <MonthlyCashFlowPanel months={monthlyEvolution} />
        </div>
      </div>
    </div>
  )
}
