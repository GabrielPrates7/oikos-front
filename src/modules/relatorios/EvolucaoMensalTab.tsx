import { BarChart3, CalendarDays, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { isAbortError } from '../../components/reports/abort'
import { MonthYearPicker } from '../../components/reports/MonthYearPicker'
import { ReportErrorNotice } from '../../components/reports/ReportErrorNotice'
import { ReportFilterPanel } from '../../components/reports/ReportFilterPanel'
import { ReportSkeleton } from '../../components/reports/ReportSkeleton'
import { currentYearMonthSP } from '../../components/reports/reportPeriod'
import { ChartPanel } from '../../components/reports/ChartPanel'
import { plural } from '../../components/reports/reportFormat'
import { SegmentedControl } from '../../components/reports/SegmentedControl'
import { GlassStatCards } from '../../components/ui/GlassStatCards'
import { ApiError } from '../../services/api'
import { formatMonthShort, todayInSaoPaulo } from '../../utils/date'
import { EvolucaoChart } from './EvolucaoChart'
import { buildPoints, planEvolutionRequest, sliceToEnd, summarize } from './evolucaoMensal.utils'
import { useReportsFilters } from './useReportsFilters'
import { relatoriosService } from './relatorios.service'
import type { MonthlyEvolutionItem } from './relatorios.types'
import { TERRACOTTA_TEXT } from './visaoGeral.utils'
import './EvolucaoMensalTab.css'

type Period = '3' | '6' | '12' | '24'

const PERIOD_OPTIONS: { value: Period; label: string; ariaLabel: string; title: string }[] = [
  { value: '3', label: '3M', ariaLabel: 'Últimos 3 meses', title: 'Últimos 3 meses' },
  { value: '6', label: '6M', ariaLabel: 'Últimos 6 meses', title: 'Últimos 6 meses' },
  { value: '12', label: '12M', ariaLabel: 'Últimos 12 meses', title: 'Últimos 12 meses' },
  { value: '24', label: '24M', ariaLabel: 'Últimos 24 meses', title: 'Últimos 24 meses' },
]

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function EvolucaoMensalTab() {
  const filters = useReportsFilters()
  const [period, setPeriod] = useState<Period>('6')
  const [attempt, setAttempt] = useState(0)
  const [months, setMonths] = useState<MonthlyEvolutionItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Mês final = Mês/Ano do filtro. A API só conhece monthsBack (a partir de hoje): uma única
  // requisição cobre até o mês final e o recorte é feito aqui (ver planEvolutionRequest).
  const plan = planEvolutionRequest(
    { year: filters.year, month: filters.month },
    currentYearMonthSP(),
    Number(period),
  )
  const monthsBack = plan.kind === 'ok' ? plan.monthsBack : 0
  const effectiveMonths = plan.kind === 'ok' ? plan.effectiveMonths : 0
  const endMonth = filters.monthString

  useEffect(() => {
    if (monthsBack === 0) return
    const controller = new AbortController()
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const result = await relatoriosService.getMonthlyEvolution(monthsBack, controller.signal)
        if (active) {
          setMonths(sliceToEnd(result.months, endMonth, effectiveMonths))
        }
      } catch (error) {
        if (active && !isAbortError(error)) {
          setLoadError(errorMessage(error, 'Não foi possível carregar a evolução mensal.'))
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
      controller.abort()
    }
  }, [monthsBack, effectiveMonths, endMonth, attempt])

  const analysis = useMemo(() => {
    if (!months) return null
    // Mês corrente por string YYYY-MM no fuso America/Sao_Paulo.
    const points = buildPoints(months, todayInSaoPaulo().slice(0, 7))
    return { points, summary: summarize(points) }
  }, [months])

  function renderCards() {
    if (!analysis) return null
    const { summary } = analysis
    const net = summary.netCents
    const netColor = net > 0 ? '#6baf82' : net < 0 ? TERRACOTTA_TEXT : undefined

    return (
      <GlassStatCards
        items={[
          {
            label: 'Entradas no período',
            valueCents: summary.incomeCents,
            icon: <TrendingUp size={16} aria-hidden="true" />,
            iconColor: '#6baf82',
          },
          {
            label: 'Despesas no período',
            valueCents: summary.expenseCents,
            icon: <TrendingDown size={16} aria-hidden="true" />,
            iconColor: TERRACOTTA_TEXT,
          },
          {
            label: 'Resultado no período',
            labelTitle:
              'Entradas menos despesas lançadas no mês. Base de lançamentos, diferente do Lucro do Dashboard.',
            valueCents: net,
            valueColor: netColor,
            icon: <Scale size={16} aria-hidden="true" />,
            footer: <span className="evolucao-tab__note">Entradas − despesas lançadas</span>,
          },
          {
            label: 'Média mensal de despesas',
            labelTitle:
              'Considera só os meses com movimento (entradas ou despesas maiores que zero).',
            valueCents: summary.averageExpenseCents ?? undefined,
            valueText: summary.averageExpenseCents === null ? 'sem dados' : undefined,
            icon: <CalendarDays size={16} aria-hidden="true" />,
            footer: (
              <>
                <span className="evolucao-tab__note">
                  {summary.movementCount}{' '}
                  {plural(summary.movementCount, 'mês com movimento', 'meses com movimento')}
                </span>
                {summary.includesCurrentMonth && (
                  <span className="evolucao-tab__note">inclui mês em andamento</span>
                )}
              </>
            ),
          },
        ]}
      />
    )
  }

  function renderChart() {
    if (!analysis) return null
    const { points, summary } = analysis
    const periodMonths = Number(period)

    if (summary.movementCount === 0) {
      return (
        <ChartPanel title="Evolução mensal">
          <div className="evolucao-tab__empty">
            <BarChart3 size={28} aria-hidden="true" />
            <p>Sem lançamentos nos últimos {periodMonths} meses.</p>
          </div>
        </ChartPanel>
      )
    }

    const firstMoving = points[summary.firstMovementIndex]

    return (
      <ChartPanel
        title="Entradas, despesas e resultado por mês"
        subtitle="Resultado = entradas menos despesas lançadas no mês. Base de lançamentos, diferente do Lucro do Dashboard."
      >
        <EvolucaoChart points={points} summary={summary} periodMonths={periodMonths} />
        {summary.firstMovementIndex > 0 && firstMoving && (
          <p className="evolucao-tab__leading-note">
            Sem lançamentos antes de {formatMonthShort(firstMoving.month).toLowerCase()}.
          </p>
        )}
      </ChartPanel>
    )
  }

  function renderBody() {
    if (plan.kind === 'future') {
      return (
        <p className="evolucao-tab__notice" role="status">
          O mês final está no futuro. Escolha o mês atual ou um anterior.
        </p>
      )
    }
    if (plan.kind === 'too-old') {
      return (
        <p className="evolucao-tab__notice" role="status">
          A evolução mensal cobre os últimos 24 meses a partir de hoje. Escolha um mês final mais
          recente.
        </p>
      )
    }
    return (
      <>
        {plan.truncated && (
          <p className="evolucao-tab__notice" role="status">
            Mostrando {plan.effectiveMonths} {plan.effectiveMonths === 1 ? 'mês' : 'meses'} até{' '}
            {formatMonthShort(endMonth)}: a API entrega no máximo 24 meses contados de hoje.
          </p>
        )}
        {loadError && (
          <ReportErrorNotice message={loadError} onRetry={() => setAttempt((count) => count + 1)} />
        )}
        {loading && !loadError && <ReportSkeleton cards={4} panels={1} panelHeight={420} />}
        {!loading && !loadError && analysis && (
          <div>
            {renderCards()}
            {renderChart()}
          </div>
        )}
      </>
    )
  }

  return (
    <div className="evolucao-tab">
      <ReportFilterPanel
        activeCount={filters.isCustom ? 1 : 0}
        onClear={filters.reset}
        controls={
          <SegmentedControl<Period>
            label="Período"
            value={period}
            onChange={setPeriod}
            options={PERIOD_OPTIONS}
          />
        }
      >
        <MonthYearPicker
          label="Mês final"
          month={filters.month}
          year={filters.year}
          years={filters.years}
          onChange={filters.setMonthYear}
        />
      </ReportFilterPanel>
      {renderBody()}
    </div>
  )
}
