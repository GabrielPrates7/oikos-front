import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { isAbortError } from '../../components/reports/abort'
import { MonthYearPicker } from '../../components/reports/MonthYearPicker'
import { ReportErrorNotice } from '../../components/reports/ReportErrorNotice'
import { ReportFilterPanel } from '../../components/reports/ReportFilterPanel'
import { ReportViewToggle } from '../../components/reports/ReportViewToggle'
import { buildPieSlices } from '../../components/reports/pieSlices'
import { usePersistedFlag } from '../../components/reports/usePersistedFlag'
import { useReducedMotion } from '../../components/reports/useReducedMotion'
import { ReportSkeleton } from '../../components/reports/ReportSkeleton'
import { GlassStatCards } from '../../components/ui/GlassStatCards'
import { ApiError } from '../../services/api'
import { FALLBACK_COLOR, getBankColor } from '../../utils/bankColors'
import {
  CHART_COLOR_ACCENT,
  CHART_COLOR_EXPENSE,
  assignCategoryColors,
} from '../../utils/chartColors'
import { shiftMonth } from '../../utils/date'
import { categoriasService } from '../categorias/categorias.service'
import type { Category } from '../categorias/categorias.types'
import { contasService } from '../contas/contas.service'
import type { Account } from '../contas/contas.types'
import { dashboardService } from '../dashboard/dashboard.service'
import { PieCard } from './PieCard'
import { RankedBarsCard } from './RankedBarsCard'
import { useReportsFilters } from './useReportsFilters'
import { SegmentedBarCard } from './SegmentedBarCard'
import type { Segment } from './SegmentedBarCard'
import { relatoriosService } from './relatorios.service'
import { RECEIPT_METHOD_LABELS } from './relatorios.types'
import type {
  ByAccountResult,
  ByCategoryResult,
  ByReceiptMethodResult,
  ComparisonResult,
  EssentialVsSuperfluousResult,
  FixedVsNonFixedResult,
  ReceiptMethod,
} from './relatorios.types'
import {
  RECEIPT_METHOD_COLORS,
  TERRACOTTA_TEXT,
  computeVariation,
  rankAndGroup,
} from './visaoGeral.utils'
import type { RankedItem, Variation } from './visaoGeral.utils'
import './VisaoGeralTab.css'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

const NEUTRAL_BAR_COLOR = '#9ca79e'
const INCOME_GREEN = '#6baf82'

interface VisaoGeralData {
  totalBalanceCents: number
  incomeCents: number
  expenseCents: number
  netCents: number
  incomeByCategory: ByCategoryResult
  byReceiptMethod: ByReceiptMethodResult
  incomeByAccount: ByAccountResult
  expenseByAccount: ByAccountResult
  essentialVsSuperfluous: EssentialVsSuperfluousResult
  fixedVsNonFixed: FixedVsNonFixedResult
  // Só carregam dados auxiliares de exibição (cor de banco por conta e cor de categoria).
  accounts: Account[]
  incomeCategories: Category[]
  // null = comparação indisponível (falhou) — as variações simplesmente não aparecem.
  comparison: ComparisonResult | null
}

// Cor da barra da conta: mesma fonte dos badges (getBankColor). Banco sem cor conhecida cai
// no cinza neutro, igual ao AccountBadge (o verde de fallback do getBankColor pareceria "a
// marca" do app).
function accountColor(accounts: Account[], accountId: string): string {
  const account = accounts.find((item) => item.id === accountId)
  if (!account) return NEUTRAL_BAR_COLOR
  const resolved = getBankColor(account.bank_name, account.color)
  if (resolved === FALLBACK_COLOR) return NEUTRAL_BAR_COLOR
  return resolved.base
}

type Good = 'income' | 'expense' | 'net'

interface VariationLineProps {
  variation: Variation
  kind: Good
}

// Aumento de receita/sobra = bom (verde); aumento de despesa = ruim (terracota); queda de
// despesa = bom. Sempre com seta E texto, nunca só cor.
function VariationLine({ variation, kind }: VariationLineProps) {
  if (variation.direction === 'no-base') {
    return <span className="visao-geral-tab__variation">{variation.percentText}</span>
  }
  if (variation.direction === 'flat') {
    return (
      <span className="visao-geral-tab__variation">
        <Minus size={13} aria-hidden="true" />
        {variation.percentText} vs mês anterior
      </span>
    )
  }
  const isUp = variation.direction === 'up'
  const isGood = kind === 'expense' ? !isUp : isUp
  return (
    <span
      className={`visao-geral-tab__variation visao-geral-tab__variation--${isGood ? 'good' : 'bad'}`}
    >
      {isUp ? (
        <ArrowUpRight size={13} aria-hidden="true" />
      ) : (
        <ArrowDownRight size={13} aria-hidden="true" />
      )}
      {variation.percentText} vs mês anterior
    </span>
  )
}

export function VisaoGeralTab() {
  const filters = useReportsFilters()
  const month = filters.monthString
  const [attempt, setAttempt] = useState(0)
  // Interruptor único: vale para os 6 painéis. Padrão desligado (barras, como sempre foi).
  const pie = usePersistedFlag('oikos.reports.pie.overview')
  const reducedMotion = useReducedMotion()
  // Animação de entrada só quando o usuário liga agora; valor restaurado do localStorage não anima.
  const animatePie = pie.changedInSession && !reducedMotion
  const [data, setData] = useState<VisaoGeralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    // Cada troca de filtro cancela a requisição anterior (e ignora resposta atrasada).
    const controller = new AbortController()
    const { signal } = controller
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [
          summary,
          incomeByCategory,
          byReceiptMethod,
          incomeByAccount,
          expenseByAccount,
          essentialVsSuperfluous,
          fixedVsNonFixed,
          accounts,
          incomeCategories,
          comparison,
        ] = await Promise.all([
          dashboardService.getSummary(month, signal),
          relatoriosService.getByCategory(month, 'income', signal),
          relatoriosService.getByReceiptMethod(month, signal),
          relatoriosService.getByAccount(month, 'income', signal),
          relatoriosService.getByAccount(month, 'expense', signal),
          relatoriosService.getEssentialVsSuperfluous(month, signal),
          relatoriosService.getFixedVsNonFixed(month, signal),
          contasService.list('all'),
          categoriasService.list('income'),
          // Falha na comparação não derruba a aba: só some a variação dos KPIs.
          relatoriosService.getComparison(shiftMonth(month, -1), month, signal).catch(() => null),
        ])
        if (active) {
          setData({
            totalBalanceCents: summary.totalBalanceCents,
            incomeCents: summary.totals.incomeCents,
            expenseCents: summary.totals.expenseCents,
            netCents: summary.totals.netCents,
            incomeByCategory,
            byReceiptMethod,
            incomeByAccount,
            expenseByAccount,
            essentialVsSuperfluous,
            fixedVsNonFixed,
            accounts,
            incomeCategories,
            comparison,
          })
        }
      } catch (error) {
        if (active && !isAbortError(error)) {
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
      controller.abort()
    }
  }, [month, attempt])

  let kpiItems: Parameters<typeof GlassStatCards>[0]['items'] = []
  let incomeRows: RankedItem[] = []
  let receiptRows: RankedItem[] = []
  let incomeAccountRows: RankedItem[] = []
  let expenseAccountRows: RankedItem[] = []

  if (data) {
    const cmp = data.comparison
    // Só mostra a variação se o Mês 2 do comparison for IGUAL ao valor do KPI (mesma base).
    // Se divergir, não força igualdade: esconde a variação daquele KPI e registra os dois
    // números no console pra diagnóstico.
    function variationFor(
      label: string,
      kpiCents: number,
      month2Cents: number | undefined,
      month1Cents: number | undefined,
    ): Variation | null {
      if (!cmp || month2Cents === undefined || month1Cents === undefined) return null
      if (month2Cents !== kpiCents) {
        console.warn(
          `[Relatórios] KPI "${label}" (${kpiCents}) diverge do comparison (${month2Cents})`,
        )
        return null
      }
      return computeVariation(kpiCents, month1Cents)
    }

    const incomeVariation = variationFor(
      'Receitas',
      data.incomeCents,
      cmp?.month2.incomeCents,
      cmp?.month1.incomeCents,
    )
    const expenseVariation = variationFor(
      'Despesas',
      data.expenseCents,
      cmp?.month2.expenseCents,
      cmp?.month1.expenseCents,
    )
    const netVariation = variationFor(
      'Sobra do mês',
      data.netCents,
      cmp?.month2.netCents,
      cmp?.month1.netCents,
    )
    const netShare = data.incomeCents > 0 ? Math.round((data.netCents / data.incomeCents) * 100) : 0

    kpiItems = [
      {
        label: 'Saldo atual',
        labelTitle: 'Soma dos saldos das contas hoje. Não muda com o mês selecionado.',
        valueCents: data.totalBalanceCents,
        icon: <Wallet size={18} aria-hidden="true" />,
      },
      {
        label: 'Receitas',
        valueCents: data.incomeCents,
        icon: <TrendingUp size={18} aria-hidden="true" />,
        iconColor: INCOME_GREEN,
        footer: incomeVariation && <VariationLine variation={incomeVariation} kind="income" />,
      },
      {
        label: 'Despesas',
        valueCents: data.expenseCents,
        icon: <TrendingDown size={18} aria-hidden="true" />,
        iconColor: TERRACOTTA_TEXT,
        footer: expenseVariation && <VariationLine variation={expenseVariation} kind="expense" />,
      },
      {
        label: 'Sobra do mês',
        labelTitle: 'Receitas menos despesas do mês',
        valueCents: data.netCents,
        icon: <PiggyBank size={18} aria-hidden="true" />,
        iconColor: data.netCents >= 0 ? INCOME_GREEN : TERRACOTTA_TEXT,
        footer: (
          <>
            <span className="visao-geral-tab__sub">{netShare}% da receita</span>
            {netVariation && <VariationLine variation={netVariation} kind="net" />}
          </>
        ),
      },
    ]

    const categoryNames = Array.from(
      new Set([
        ...data.incomeCategories.map((category) => category.name),
        ...data.incomeByCategory.categories.map((category) => category.name),
      ]),
    )
    const categoryColors = assignCategoryColors(categoryNames)

    incomeRows = data.incomeByCategory.categories.map((category) => ({
      key: category.categoryId,
      label: category.name,
      icon: category.icon ?? '📁',
      valueCents: category.totalCents,
      color: categoryColors.get(category.name) ?? NEUTRAL_BAR_COLOR,
    }))
    receiptRows = data.byReceiptMethod.methods.map((method) => ({
      key: method.receiptMethod,
      label: RECEIPT_METHOD_LABELS[method.receiptMethod as ReceiptMethod] ?? method.receiptMethod,
      valueCents: method.totalCents,
      color: RECEIPT_METHOD_COLORS[method.receiptMethod] ?? RECEIPT_METHOD_COLORS.other,
    }))
    incomeAccountRows = data.incomeByAccount.accounts.map((account) => ({
      key: account.accountId,
      label: account.name,
      valueCents: account.totalCents,
      color: accountColor(data.accounts, account.accountId),
    }))
    expenseAccountRows = data.expenseByAccount.accounts.map((account) => ({
      key: account.accountId,
      label: account.name,
      valueCents: account.totalCents,
      color: accountColor(data.accounts, account.accountId),
    }))
  }

  // Barras (padrão, idêntico ao de sempre) ou pizza, conforme o interruptor. Mesmos dados nos
  // dois modos — trocar não refaz nenhuma requisição.
  function renderRanked(title: string, items: RankedItem[], emptyMessage: string) {
    if (!pie.value) {
      return (
        <RankedBarsCard
          title={title}
          rows={rankAndGroup(items, NEUTRAL_BAR_COLOR)}
          emptyMessage={emptyMessage}
        />
      )
    }
    return (
      <PieCard
        title={title}
        slices={buildPieSlices(items)}
        emptyMessage={emptyMessage}
        animate={animatePie}
        variant="ranked"
      />
    )
  }

  function renderSegmented(title: string, emptyMessage: string, segments: Segment[]) {
    if (!pie.value) {
      return <SegmentedBarCard title={title} emptyMessage={emptyMessage} segments={segments} />
    }
    return (
      <PieCard
        title={title}
        slices={segments}
        emptyMessage={emptyMessage}
        animate={animatePie}
        variant="segmented"
      />
    )
  }

  return (
    <div className="visao-geral-tab">
      <ReportFilterPanel
        activeCount={filters.isCustom ? 1 : 0}
        onClear={filters.reset}
        controls={<ReportViewToggle checked={pie.value} onChange={pie.update} />}
      >
        <MonthYearPicker
          label="Mês"
          month={filters.month}
          year={filters.year}
          years={filters.years}
          onChange={filters.setMonthYear}
        />
      </ReportFilterPanel>
      {loadError && (
        <ReportErrorNotice message={loadError} onRetry={() => setAttempt((count) => count + 1)} />
      )}
      {loading && !loadError && <ReportSkeleton cards={4} panels={2} panelHeight={260} />}
      {!loading && !loadError && data && (
        <>
          <GlassStatCards items={kpiItems} />

          <section className="visao-geral-tab__section" aria-labelledby="vg-receitas">
            <h2
              id="vg-receitas"
              className="visao-geral-tab__section-title visao-geral-tab__section-title--income"
            >
              Receitas
            </h2>
            <div className="visao-geral-tab__grid">
              {renderRanked('Fonte de receita', incomeRows, 'Sem receitas neste mês')}
              {renderRanked('Forma de recebimento', receiptRows, 'Sem receitas neste mês')}
              {renderRanked('Entrada por conta', incomeAccountRows, 'Sem receitas neste mês')}
            </div>
          </section>

          <section className="visao-geral-tab__section" aria-labelledby="vg-despesas">
            <h2
              id="vg-despesas"
              className="visao-geral-tab__section-title visao-geral-tab__section-title--expense"
            >
              Despesas
            </h2>
            <div className="visao-geral-tab__grid">
              {renderRanked('Saída por conta', expenseAccountRows, 'Sem despesas neste mês')}
              {renderSegmented('Essencial x Supérfluo', 'Sem despesas neste mês', [
                {
                  key: 'essential',
                  label: 'Essencial',
                  valueCents: data.essentialVsSuperfluous.essentialCents,
                  color: CHART_COLOR_ACCENT,
                },
                {
                  key: 'superfluous',
                  label: 'Supérfluo',
                  valueCents: data.essentialVsSuperfluous.superfluousCents,
                  color: CHART_COLOR_EXPENSE,
                },
              ])}
              {renderSegmented('Fixo x Não fixo', 'Sem despesas neste mês', [
                {
                  key: 'fixed',
                  label: 'Fixo',
                  valueCents: data.fixedVsNonFixed.fixedCents,
                  color: CHART_COLOR_ACCENT,
                },
                {
                  key: 'non-fixed',
                  label: 'Não fixo',
                  valueCents: data.fixedVsNonFixed.nonFixedCents,
                  color: CHART_COLOR_EXPENSE,
                },
              ])}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
