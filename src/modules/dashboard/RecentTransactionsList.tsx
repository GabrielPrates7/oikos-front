import { centsToBRL } from '../../utils/currency'
import { formatDateBR } from '../../utils/date'
import type { DashboardRecentTransaction, DashboardTransactionType } from './dashboard.types'
import './RecentTransactionsList.css'

// Fallback só pra tipos sem categoria (transferência, fatura, aporte) — quando a
// transação TEM categoria (entrada/despesa), o ícone vem de tx.categoryIcon, o mesmo
// campo category.icon já usado em "Despesas por categoria" (CategoryBarChart), não um
// mapeamento duplicado.
const TYPE_ICONS: Record<DashboardTransactionType, string> = {
  income: '↗',
  expense: '↘',
  transfer: '⇄',
  invoice_payment: '💳',
  goal_contribution: '🎯',
}

interface RecentTransactionsListProps {
  transactions: DashboardRecentTransaction[]
}

export function RecentTransactionsList({ transactions }: RecentTransactionsListProps) {
  return (
    <div className="recent-transactions">
      <h2 className="recent-transactions__title">Últimas transações</h2>
      {transactions.length === 0 ? (
        <p className="recent-transactions__empty">Nenhuma transação nesse mês.</p>
      ) : (
        <ul className="recent-transactions__rows">
          {transactions.map((tx) => (
            <li key={`${tx.type}-${tx.id}`} className="recent-transactions__row">
              <span
                className={`recent-transactions__icon recent-transactions__icon--${tx.type}`}
                aria-hidden="true"
              >
                {tx.categoryIcon ?? TYPE_ICONS[tx.type]}
              </span>
              <div className="recent-transactions__info">
                <span className="recent-transactions__description">{tx.description}</span>
                <span className="recent-transactions__meta">
                  {formatDateBR(tx.date)} · {tx.accountName}
                  {tx.categoryName ? ` · ${tx.categoryName}` : ''}
                </span>
              </div>
              <span
                className={`recent-transactions__amount recent-transactions__amount--${tx.type}`}
              >
                {centsToBRL(tx.amountCents)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
