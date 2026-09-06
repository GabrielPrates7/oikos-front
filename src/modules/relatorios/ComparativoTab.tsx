import { ArrowDown, ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormError } from '../../components/feedback/FormError'
import { Input } from '../../components/ui/Input'
import { ApiError } from '../../services/api'
import { centsToBRL } from '../../utils/currency'
import { currentMonthString, formatMonthLabel, shiftMonth } from '../../utils/date'
import { relatoriosService } from './relatorios.service'
import type { ComparisonCategoryItem, ComparisonResult } from './relatorios.types'
import './ComparativoTab.css'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

interface DeltaCardProps {
  label: string
  currentValueCents: number
  deltaCents: number
  positiveIsGood: boolean
}

function DeltaCard({ label, currentValueCents, deltaCents, positiveIsGood }: DeltaCardProps) {
  const isUp = deltaCents > 0
  const isGood = deltaCents === 0 ? null : isUp ? positiveIsGood : !positiveIsGood
  const colorClass =
    isGood === null ? '' : isGood ? 'delta-card__delta--good' : 'delta-card__delta--bad'

  return (
    <div className="delta-card">
      <span className="delta-card__label">{label}</span>
      <span className="delta-card__value">{centsToBRL(currentValueCents)}</span>
      <span className={`delta-card__delta ${colorClass}`}>
        {deltaCents !== 0 &&
          (isUp ? (
            <ArrowUp size={14} aria-hidden="true" />
          ) : (
            <ArrowDown size={14} aria-hidden="true" />
          ))}
        {centsToBRL(Math.abs(deltaCents))}
      </span>
    </div>
  )
}

interface ComparisonTableProps {
  categories: ComparisonCategoryItem[]
  month1Label: string
  month2Label: string
}

function ComparisonTable({ categories, month1Label, month2Label }: ComparisonTableProps) {
  if (categories.length === 0) {
    return (
      <p className="comparativo-tab__table-empty">
        Nenhuma despesa categorizada em nenhum dos dois meses.
      </p>
    )
  }

  const sorted = [...categories].sort(
    (a, b) => Math.abs(b.deltaCents) - Math.abs(a.deltaCents),
  )

  return (
    <div className="comparativo-tab__table-wrapper">
      <table className="comparativo-tab__table">
        <thead>
          <tr>
            <th>Categoria</th>
            <th>{month1Label}</th>
            <th>{month2Label}</th>
            <th>Diferença</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((category) => (
            <tr key={category.categoryId}>
              <td>{category.name}</td>
              <td>{centsToBRL(category.month1Cents)}</td>
              <td>{centsToBRL(category.month2Cents)}</td>
              <td
                className={
                  category.deltaCents > 0
                    ? 'comparativo-tab__delta-up'
                    : category.deltaCents < 0
                      ? 'comparativo-tab__delta-down'
                      : undefined
                }
              >
                {category.deltaCents === 0
                  ? '—'
                  : `${category.deltaCents > 0 ? '+' : ''}${centsToBRL(category.deltaCents)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ComparativoTab() {
  const [month1, setMonth1] = useState(() => shiftMonth(currentMonthString(), -1))
  const [month2, setMonth2] = useState(() => currentMonthString())
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await relatoriosService.getComparison(month1, month2)
        if (active) {
          setResult(data)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar o comparativo.'))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [month1, month2])

  return (
    <div className="comparativo-tab">
      <div className="comparativo-tab__selectors">
        <Input
          label="Mês 1"
          type="month"
          value={month1}
          onChange={(event) => setMonth1(event.target.value)}
        />
        <Input
          label="Mês 2"
          type="month"
          value={month2}
          onChange={(event) => setMonth2(event.target.value)}
        />
      </div>
      <FormError message={loadError} />
      {!loading && result && (
        <>
          <div className="comparativo-tab__deltas">
            <DeltaCard
              label="Entradas"
              currentValueCents={result.month2.incomeCents}
              deltaCents={result.delta.incomeCentsDelta}
              positiveIsGood
            />
            <DeltaCard
              label="Despesas"
              currentValueCents={result.month2.expenseCents}
              deltaCents={result.delta.expenseCentsDelta}
              positiveIsGood={false}
            />
            <DeltaCard
              label="Resultado"
              currentValueCents={result.month2.netCents}
              deltaCents={result.delta.netCentsDelta}
              positiveIsGood
            />
          </div>
          <h2 className="comparativo-tab__table-title">Despesas por categoria</h2>
          <ComparisonTable
            categories={result.categories}
            month1Label={formatMonthLabel(month1)}
            month2Label={formatMonthLabel(month2)}
          />
        </>
      )}
    </div>
  )
}
