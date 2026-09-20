import { Percent, Target, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { isAbortError } from '../../components/reports/abort'
import { MonthYearPicker } from '../../components/reports/MonthYearPicker'
import { RankedBars } from '../../components/reports/RankedBars'
import { ReportPie } from '../../components/reports/ReportPie'
import { ReportViewToggle } from '../../components/reports/ReportViewToggle'
import { PIE_REST_COLOR, buildPieSlices } from '../../components/reports/pieSlices'
import { usePersistedFlag } from '../../components/reports/usePersistedFlag'
import { useReducedMotion } from '../../components/reports/useReducedMotion'
import { ReportErrorNotice } from '../../components/reports/ReportErrorNotice'
import { NameFilter, ReportFilterPanel } from '../../components/reports/ReportFilterPanel'
import { ReportSkeleton } from '../../components/reports/ReportSkeleton'
import { matchesName } from '../../components/reports/reportPeriod'
import { formatPercent1, plural, sumCents } from '../../components/reports/reportFormat'
import { SegmentedControl } from '../../components/reports/SegmentedControl'
import { GlassStatCards } from '../../components/ui/GlassStatCards'
import { ApiError } from '../../services/api'
import { assignCategoryColors } from '../../utils/chartColors'
import { centsToBRL } from '../../utils/currency'
import { categoriasService } from '../categorias/categorias.service'
import type { Category } from '../categorias/categorias.types'
import { orcamentosService } from '../orcamentos/orcamentos.service'
import type { Budget } from '../orcamentos/orcamentos.types'
import { PlannedRealizedList } from './PlannedRealizedList'
import type { PlannedRealizedRow } from './PlannedRealizedList'
import { relatoriosService } from './relatorios.service'
import type { ByCategoryResult, ReportCategoryType } from './relatorios.types'
import { useReportsFilters } from './useReportsFilters'
import { rankAndGroup } from './visaoGeral.utils'
import type { RankedItem } from './visaoGeral.utils'
import '../../components/reports/ReportToolbar.css'
import './PorCategoriaTab.css'

type Mode = 'real' | 'planned'

type View =
  | { kind: 'real'; result: ByCategoryResult; categories: Category[] }
  | { kind: 'planned'; budgets: Budget[]; categories: Category[] }

const REST_COLOR = '#8a8f89'
const NEUTRAL_COLOR = '#8a8f89'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function PorCategoriaTab() {
  const filters = useReportsFilters()
  const month = filters.monthString
  const [name, setName] = useState('')
  const [attempt, setAttempt] = useState(0)
  // Pizza: só vale em Realizado. A preferência salva não é apagada ao trocar de modo.
  const pie = usePersistedFlag('oikos.reports.pie.category')
  const reducedMotion = useReducedMotion()
  const animatePie = pie.changedInSession && !reducedMotion
  const [type, setType] = useState<ReportCategoryType>('expense')
  const [mode, setMode] = useState<Mode>('real')
  const [view, setView] = useState<View | null>(null)
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
        if (mode === 'real') {
          const [result, categories] = await Promise.all([
            relatoriosService.getByCategory(month, type, signal),
            // Só pra bater a cor com a do CategoryBadge (atribuída em lote com a lista
            // completa); se falhar, o relatório continua com as cores do próprio resultado.
            categoriasService.list(type).catch(() => [] as Category[]),
          ])
          if (active) setView({ kind: 'real', result, categories })
        } else {
          const [budgets, categories] = await Promise.all([
            orcamentosService.list(month),
            categoriasService.list('expense'),
          ])
          if (active) setView({ kind: 'planned', budgets, categories })
        }
      } catch (error) {
        if (active && !isAbortError(error)) {
          setLoadError(
            errorMessage(
              error,
              mode === 'real'
                ? 'Não foi possível carregar o relatório.'
                : 'Não foi possível carregar os orçamentos.',
            ),
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
      controller.abort()
    }
  }, [month, type, mode, attempt])

  const typeLabel = type === 'expense' ? 'Despesas' : 'Entradas'

  const realRows = useMemo(() => {
    if (view?.kind !== 'real') return null
    const names = Array.from(
      new Set([
        ...view.categories.map((category) => category.name),
        ...view.result.categories.map((category) => category.name),
      ]),
    )
    const colors = assignCategoryColors(names)
    const items: RankedItem[] = view.result.categories.map((category) => ({
      key: category.categoryId,
      label: category.name,
      valueCents: category.totalCents,
      color: colors.get(category.name) ?? NEUTRAL_COLOR,
      icon: category.icon ?? '📁',
    }))
    // Filtro por nome (contém, sem acento/caixa) sobre as linhas já retornadas. Percentuais
    // continuam relativos ao TOTAL sem filtro.
    const matched = items.filter((item) => matchesName(item.label, name))
    return {
      // Total = soma das linhas retornadas (não outro cálculo).
      totalCents: sumCents(view.result.categories.map((category) => category.totalCents)),
      count: view.result.categories.length,
      items,
      matched,
      matchedCount: matched.length,
      subtotalCents: sumCents(matched.map((item) => item.valueCents)),
      // >10 categorias: 9 maiores + "Demais (N)".
      rows: rankAndGroup(matched, REST_COLOR, 10, 9),
      sorted: [...matched].sort((a, b) => b.valueCents - a.valueCents),
    }
  }, [view, name])

  const plannedRows = useMemo<PlannedRealizedRow[] | null>(() => {
    if (view?.kind !== 'planned') return null
    return view.budgets.map((budget) => {
      const category = view.categories.find((item) => item.id === budget.category_id)
      return {
        key: budget.id,
        name: category?.name ?? 'Categoria removida',
        icon: category?.icon ?? null,
        plannedCents: budget.limit_amount_cents,
        spentCents: budget.spentCents,
      }
    })
  }, [view])

  // Fatias: sem filtro, os itens agrupados em até 7. Com Nome ativo, as que casam (até 6) +
  // "Fora do filtro (N)" em cinza, mantendo o anel como 100% do total.
  function pieSlices(
    all: RankedItem[],
    matchedItems: RankedItem[],
    total: number,
    subtotal: number,
    filtering: boolean,
  ) {
    if (!filtering) return buildPieSlices(all)
    const slices = buildPieSlices(matchedItems, 6)
    const outsideCount = all.length - matchedItems.length
    if (outsideCount > 0 && total - subtotal > 0) {
      slices.push({
        key: '__outside__',
        label: `Fora do filtro (${outsideCount})`,
        valueCents: total - subtotal,
        color: PIE_REST_COLOR,
        isRest: true,
      })
    }
    return slices
  }

  function renderReal() {
    if (view?.kind !== 'real' || !realRows) return null
    const { totalCents, count, matchedCount, subtotalCents, rows, sorted, items, matched } =
      realRows
    const filtering = name.trim() !== ''
    const panelTitle = `${typeLabel} por categoria`
    const topThree = sumCents(sorted.slice(0, 3).map((item) => item.valueCents))

    return (
      <section className="report-panel por-categoria-panel">
        <header className="por-categoria-panel__header">
          <h3 className="por-categoria-panel__title">{panelTitle}</h3>
          {count > 0 && (
            <div className="por-categoria-panel__summary">
              <span className="por-categoria-panel__total">{centsToBRL(totalCents)}</span>
              <span className="por-categoria-panel__count">
                {count} {plural(count, 'categoria', 'categorias')}
              </span>
            </div>
          )}
        </header>
        {filtering && count > 0 && (
          <p className="por-categoria-panel__filter-line">
            Exibindo {matchedCount} de {count} {plural(count, 'categoria', 'categorias')} · Subtotal{' '}
            {centsToBRL(subtotalCents)} ({formatPercent1(subtotalCents, totalCents)} do total)
          </p>
        )}
        {count === 0 ? (
          <p className="por-categoria-panel__empty">
            {type === 'expense'
              ? 'Nenhuma despesa categorizada nesse mês.'
              : 'Nenhuma entrada categorizada nesse mês.'}
          </p>
        ) : matchedCount === 0 ? (
          <div className="por-categoria-panel__empty">
            <p>Nenhuma categoria corresponde a '{name.trim()}'</p>
            <button
              type="button"
              className="por-categoria-panel__clear"
              onClick={() => setName('')}
            >
              Limpar
            </button>
          </div>
        ) : (
          <>
            {!filtering && count >= 4 && (
              <p className="por-categoria-panel__insight">
                As 3 maiores categorias somam {formatPercent1(topThree, totalCents)} do total.
              </p>
            )}
            {pie.value ? (
              <ReportPie
                slices={pieSlices(items, matched, totalCents, subtotalCents, filtering)}
                totalCents={totalCents}
                formatShare={formatPercent1}
                height={300}
                label={panelTitle}
                animate={animatePie}
                center={
                  filtering
                    ? {
                        valueCents: subtotalCents,
                        caption: `${formatPercent1(subtotalCents, totalCents)} do total`,
                      }
                    : undefined
                }
              />
            ) : (
              <RankedBars rows={rows} totalCents={totalCents} label={panelTitle} />
            )}
          </>
        )}
      </section>
    )
  }

  function renderPlanned() {
    if (view?.kind !== 'planned' || !plannedRows) return null
    const planned = sumCents(plannedRows.map((row) => row.plannedCents))
    const spent = sumCents(plannedRows.map((row) => row.spentCents))

    return (
      <>
        <GlassStatCards
          items={[
            {
              label: 'Planejado',
              valueCents: planned,
              icon: <Target size={16} aria-hidden="true" />,
            },
            {
              label: 'Realizado',
              valueCents: spent,
              icon: <Wallet size={16} aria-hidden="true" />,
            },
            {
              label: '% usado',
              valueText: planned > 0 ? formatPercent1(spent, planned) : '—',
              icon: <Percent size={16} aria-hidden="true" />,
            },
          ]}
        />
        <p className="por-categoria-tab__note">Mostra apenas categorias com orçamento no mês.</p>
        <section className="report-panel por-categoria-panel">
          <header className="por-categoria-panel__header">
            <h3 className="por-categoria-panel__title">Planejado x realizado</h3>
            {plannedRows.length > 0 && (
              <span className="por-categoria-panel__count">
                {plannedRows.length} {plural(plannedRows.length, 'categoria', 'categorias')}
              </span>
            )}
          </header>
          {plannedRows.length === 0 ? (
            <p className="por-categoria-panel__empty">
              Nenhum orçamento cadastrado nesse mês. Crie um em Orçamentos pra acompanhar planejado
              x realizado aqui.
            </p>
          ) : (
            <PlannedRealizedList rows={plannedRows} />
          )}
        </section>
      </>
    )
  }

  const showContent = !loading && !loadError && view?.kind === mode
  // Nome só vale em Realizado (orçamentos são por categoria já cadastrada, sem busca).
  const nameActive = mode === 'real' && name.trim() !== ''
  const activeCount = (filters.isCustom ? 1 : 0) + (nameActive ? 1 : 0)

  return (
    <div className="por-categoria-tab">
      <ReportFilterPanel
        activeCount={activeCount}
        onClear={() => {
          filters.reset()
          setName('')
        }}
        controls={
          <>
            <SegmentedControl<ReportCategoryType>
              label="Tipo"
              value={type}
              onChange={setType}
              options={[
                {
                  value: 'expense',
                  label: 'Despesas',
                },
                {
                  value: 'income',
                  label: 'Entradas',
                  disabled: mode === 'planned',
                  title: mode === 'planned' ? 'Orçamentos existem apenas para despesas' : undefined,
                },
              ]}
            />

            <SegmentedControl<Mode>
              label="Modo"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'real', label: 'Realizado' },
                {
                  value: 'planned',
                  label: 'Planejado x Realizado',
                  disabled: type === 'income',
                  title: type === 'income' ? 'Orçamentos existem apenas para despesas' : undefined,
                },
              ]}
            />
            <ReportViewToggle
              checked={pie.value}
              onChange={pie.update}
              disabled={mode === 'planned'}
              title={mode === 'planned' ? 'Disponível apenas em Realizado' : undefined}
            />
          </>
        }
      >
        <MonthYearPicker
          label="Mês"
          month={filters.month}
          year={filters.year}
          years={filters.years}
          onChange={filters.setMonthYear}
        />
        <NameFilter
          value={name}
          onChange={setName}
          disabled={mode === 'planned'}
          title={
            mode === 'planned' ? 'Orçamentos são mensais e por categoria cadastrada' : undefined
          }
        />
      </ReportFilterPanel>
      {loadError && (
        <ReportErrorNotice message={loadError} onRetry={() => setAttempt((count) => count + 1)} />
      )}
      {loading && !loadError && <ReportSkeleton cards={mode === 'planned' ? 3 : 0} panels={1} />}
      {showContent && (mode === 'real' ? renderReal() : renderPlanned())}
    </div>
  )
}
