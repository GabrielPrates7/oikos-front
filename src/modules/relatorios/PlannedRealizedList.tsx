import { centsToBRL } from '../../utils/currency'
import { BUDGET_STATUS_LABELS, getBudgetStatus } from '../orcamentos/budgetStatus'
import type { BudgetStatus } from '../orcamentos/budgetStatus'
import { barColor } from './visaoGeral.utils'
import './PlannedRealizedList.css'

export interface PlannedRealizedRow {
  key: string
  name: string
  icon: string | null
  plannedCents: number
  spentCents: number
}

interface PlannedRealizedListProps {
  rows: PlannedRealizedRow[]
}

// Cor da BARRA por status (clareada por barColor pra ≥3:1 contra o vidro). O texto do
// status usa tons próprios (terracota #cf6b52 em "Excedido") — mesmos limiares de Orçamentos.
const BAR_HEX: Record<BudgetStatus, string> = {
  ok: '#4f8f63',
  warning: '#d9a441',
  over: '#b2543a',
}

function ratio(row: PlannedRealizedRow): number {
  return row.plannedCents > 0 ? row.spentCents / row.plannedCents : -1
}

// Ordena por % usado decrescente; sem limite (planejado zero, sem divisão) vai pro fim.
function sortByUsage(rows: PlannedRealizedRow[]): PlannedRealizedRow[] {
  return [...rows].sort((a, b) => {
    const diff = ratio(b) - ratio(a)
    if (diff !== 0) return diff
    return a.name.localeCompare(b.name, 'pt-BR')
  })
}

function formatUsedPercent(spentCents: number, plannedCents: number): string {
  if (spentCents <= 0 || plannedCents <= 0) return '0%'
  const value = (spentCents / plannedCents) * 100
  return `${value.toFixed(1).replace('.', ',')}%`
}

// Uma linha por categoria com orçamento: barra ÚNICA de progresso (realizado sobre o
// planejado, máx. 100%) e status em texto — a cor comunica só o status.
export function PlannedRealizedList({ rows }: PlannedRealizedListProps) {
  return (
    <ul className="planned-list" aria-label="Planejado x realizado por categoria">
      {sortByUsage(rows).map((row) => {
        const noLimit = row.plannedCents <= 0
        const noSpend = row.spentCents <= 0
        // Mesma regra de Orçamentos: status pelo % arredondado (o backend também arredonda).
        const status = getBudgetStatus(
          noLimit ? 0 : Math.round((row.spentCents / row.plannedCents) * 100),
        )
        const widthPercent = noLimit ? 0 : Math.min(100, (row.spentCents / row.plannedCents) * 100)
        const remaining = row.plannedCents - row.spentCents

        let statusText: string
        let statusClass: string
        if (noLimit) {
          statusText = 'Sem limite'
          statusClass = 'muted'
        } else if (noSpend) {
          statusText = 'Sem gastos'
          statusClass = 'muted'
        } else {
          statusText = BUDGET_STATUS_LABELS[status]
          statusClass = status
        }

        const amounts = noLimit
          ? `${centsToBRL(row.spentCents)} · sem limite`
          : `${centsToBRL(row.spentCents)} de ${centsToBRL(row.plannedCents)} (${formatUsedPercent(row.spentCents, row.plannedCents)})`

        let complement = ''
        if (!noLimit) {
          complement =
            remaining >= 0
              ? `Restam ${centsToBRL(remaining)}`
              : `Excedeu ${centsToBRL(Math.abs(remaining))}`
        }

        return (
          <li key={row.key} className="planned-list__row" title={`${row.name}: ${amounts}`}>
            <div className="planned-list__head">
              <span className="planned-list__name">
                <span aria-hidden="true">{row.icon ?? '📁'}</span>
                <span className="planned-list__label">{row.name}</span>
              </span>
              <span className={`planned-list__status planned-list__status--${statusClass}`}>
                {statusText}
              </span>
            </div>
            <span className="planned-list__track" aria-hidden="true">
              {widthPercent > 0 && (
                <span
                  className="planned-list__fill"
                  style={{
                    width: `${widthPercent}%`,
                    minWidth: 4,
                    background: barColor(BAR_HEX[status]),
                  }}
                />
              )}
            </span>
            <div className="planned-list__foot">
              <span className="planned-list__amounts">{amounts}</span>
              {complement && (
                <span
                  className={`planned-list__complement${remaining < 0 ? ' planned-list__complement--over' : ''}`}
                >
                  {complement}
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
