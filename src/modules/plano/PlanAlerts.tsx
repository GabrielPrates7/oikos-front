import { AlertCircle } from 'lucide-react'
import { centsToBRL } from '../../utils/currency'
import type { CandidateKind, PlanSummary } from './plano.types'

interface PlanAlertsProps {
  summary: PlanSummary
  // Abre o painel "Do sistema" na aba do tipo (situação pendente). Não adiciona nada sozinho.
  onOpen: (kind: CandidateKind, trigger: HTMLElement) => void
}

interface AlertCard {
  kind: CandidateKind
  title: string
  count: number
  cents: number
}

// Alertas "Fora do plano": o que está pendente no sistema e não entrou em nenhum plano. Cada cartão
// diz quantos itens e quanto (dados de alerts.not_in_plan) e o botão ABRE o painel "Do sistema" já na
// aba do tipo, com a situação pendente; nada é adicionado em silêncio. Categorias com gasto real sem
// plano ficam listadas com o valor, sem botão.
export function PlanAlerts({ summary, onOpen }: PlanAlertsProps) {
  const notInPlan = summary.alerts.not_in_plan
  const allCards: AlertCard[] = [
    {
      kind: 'expense',
      title: notInPlan.pending_expense_count === 1 ? 'despesa pendente' : 'despesas pendentes',
      count: notInPlan.pending_expense_count,
      cents: notInPlan.expense_cents,
    },
    {
      kind: 'invoice',
      title: notInPlan.invoices_count === 1 ? 'fatura a pagar' : 'faturas a pagar',
      count: notInPlan.invoices_count,
      cents: notInPlan.invoices_cents,
    },
    {
      kind: 'income',
      title: notInPlan.pending_income_count === 1 ? 'entrada pendente' : 'entradas pendentes',
      count: notInPlan.pending_income_count,
      cents: notInPlan.income_cents,
    },
  ]
  const cards = allCards.filter((card) => card.count > 0)
  const unplanned = summary.alerts.unplanned_categories
  if (cards.length === 0 && unplanned.length === 0) return null

  const totalItems = cards.reduce((sum, card) => sum + card.count, 0)

  return (
    <section className="plano-alerts" aria-labelledby="plano-alerts-title">
      <h2 id="plano-alerts-title" className="plano-alerts__title">
        <AlertCircle size={18} aria-hidden="true" />
        Fora do plano
      </h2>
      {cards.length > 0 && (
        <>
          <p className="plano-alerts__lead">
            {totalItems} {totalItems === 1 ? 'item pendente' : 'itens pendentes'} no sistema{' '}
            {totalItems === 1 ? 'não está' : 'não estão'} em nenhum plano.
          </p>
          <ul className="plano-alerts__cards">
            {cards.map((card) => (
              <li key={card.kind} className="plano-alerts__card">
                <span className="plano-alerts__count">
                  {card.count} {card.title}
                </span>
                <span className="plano-alerts__value">{centsToBRL(card.cents)}</span>
                <button
                  type="button"
                  className="plano-alerts__action"
                  onClick={(event) => onOpen(card.kind, event.currentTarget)}
                >
                  Ver e adicionar ao plano
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {unplanned.length > 0 && (
        <div className="plano-alerts__unplanned">
          <h3 className="plano-alerts__subtitle">Categorias com gasto real sem plano</h3>
          <ul>
            {unplanned.map((category) => (
              <li key={category.category_id}>
                <span>{category.name}</span>
                <span className="plano-alerts__unplanned-value">
                  {centsToBRL(category.realized)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
