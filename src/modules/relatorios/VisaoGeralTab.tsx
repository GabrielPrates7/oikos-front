import { useEffect, useState } from 'react'
import { PieChartCard } from '../../components/charts/PieChartCard'
import type { PieChartSlice } from '../../components/charts/PieChartCard'
import { FormError } from '../../components/feedback/FormError'
import { ApiError } from '../../services/api'
import {
  CHART_COLOR_ACCENT,
  CHART_COLOR_EXPENSE,
  CHART_COLOR_INCOME,
  shadesOf,
} from '../../utils/chartColors'
import { currentMonthString } from '../../utils/date'
import { MonthSwitcher } from '../dashboard/MonthSwitcher'
import { relatoriosService } from './relatorios.service'
import { RECEIPT_METHOD_LABELS } from './relatorios.types'
import type {
  ByAccountResult,
  ByCategoryResult,
  ByReceiptMethodResult,
  EssentialVsSuperfluousResult,
  FixedVsNonFixedResult,
  ReceiptMethod,
} from './relatorios.types'
import './VisaoGeralTab.css'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

// Ordena do maior pro menor e atribui uma sombra de opacidade por posição — mesma
// convenção "mais escura = maior valor" do CategoryBarChart.
function toSlices(
  items: { label: string; valueCents: number }[],
  baseColor: string,
): PieChartSlice[] {
  const sorted = [...items].sort((a, b) => b.valueCents - a.valueCents)
  const colors = shadesOf(baseColor, sorted.length)
  return sorted.map((item, index) => ({
    label: item.label,
    valueCents: item.valueCents,
    color: colors[index],
  }))
}

interface VisaoGeralData {
  incomeByCategory: ByCategoryResult
  byReceiptMethod: ByReceiptMethodResult
  incomeByAccount: ByAccountResult
  expenseByAccount: ByAccountResult
  essentialVsSuperfluous: EssentialVsSuperfluousResult
  fixedVsNonFixed: FixedVsNonFixedResult
}

export function VisaoGeralTab() {
  const [month, setMonth] = useState(() => currentMonthString())
  const [data, setData] = useState<VisaoGeralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [
          incomeByCategory,
          byReceiptMethod,
          incomeByAccount,
          expenseByAccount,
          essentialVsSuperfluous,
          fixedVsNonFixed,
        ] = await Promise.all([
          relatoriosService.getByCategory(month, 'income'),
          relatoriosService.getByReceiptMethod(month),
          relatoriosService.getByAccount(month, 'income'),
          relatoriosService.getByAccount(month, 'expense'),
          relatoriosService.getEssentialVsSuperfluous(month),
          relatoriosService.getFixedVsNonFixed(month),
        ])
        if (active) {
          setData({
            incomeByCategory,
            byReceiptMethod,
            incomeByAccount,
            expenseByAccount,
            essentialVsSuperfluous,
            fixedVsNonFixed,
          })
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar a visão geral.'))
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
  }, [month])

  return (
    <div className="visao-geral-tab">
      <div className="visao-geral-tab__controls">
        <MonthSwitcher month={month} onChange={setMonth} />
      </div>
      <FormError message={loadError} />
      {!loading && data && (
        <div className="visao-geral-tab__grid">
          <PieChartCard
            title="Fonte de receita"
            emptyMessage="Nenhuma entrada categorizada nesse mês."
            data={toSlices(
              data.incomeByCategory.categories.map((c) => ({
                label: `${c.icon ?? '📁'} ${c.name}`,
                valueCents: c.totalCents,
              })),
              CHART_COLOR_INCOME,
            )}
          />
          <PieChartCard
            title="Forma de recebimento"
            emptyMessage="Nenhuma entrada nesse mês."
            data={toSlices(
              data.byReceiptMethod.methods.map((m) => ({
                label: RECEIPT_METHOD_LABELS[m.receiptMethod as ReceiptMethod] ?? m.receiptMethod,
                valueCents: m.totalCents,
              })),
              CHART_COLOR_INCOME,
            )}
          />
          <PieChartCard
            title="Entrada por conta"
            emptyMessage="Nenhuma entrada nesse mês."
            data={toSlices(
              data.incomeByAccount.accounts.map((a) => ({ label: a.name, valueCents: a.totalCents })),
              CHART_COLOR_INCOME,
            )}
          />
          <PieChartCard
            title="Saída por conta"
            emptyMessage="Nenhuma saída nesse mês."
            data={toSlices(
              data.expenseByAccount.accounts.map((a) => ({
                label: a.name,
                valueCents: a.totalCents,
              })),
              CHART_COLOR_EXPENSE,
            )}
          />
          <PieChartCard
            title="Essencial x Supérfluo"
            emptyMessage="Nenhuma despesa nesse mês."
            data={[
              {
                label: 'Essencial',
                valueCents: data.essentialVsSuperfluous.essentialCents,
                color: CHART_COLOR_ACCENT,
              },
              {
                label: 'Supérfluo',
                valueCents: data.essentialVsSuperfluous.superfluousCents,
                color: CHART_COLOR_EXPENSE,
              },
            ]}
          />
          <PieChartCard
            title="Fixo x Não fixo"
            emptyMessage="Nenhuma despesa nesse mês."
            data={[
              {
                label: 'Fixo',
                valueCents: data.fixedVsNonFixed.fixedCents,
                color: CHART_COLOR_ACCENT,
              },
              {
                label: 'Não fixo',
                valueCents: data.fixedVsNonFixed.nonFixedCents,
                color: CHART_COLOR_EXPENSE,
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}
