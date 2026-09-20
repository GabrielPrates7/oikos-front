import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Minus,
  Scale,
  Table2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { isAbortError } from '../../components/reports/abort'
import { MonthYearPicker } from '../../components/reports/MonthYearPicker'
import { formatPercent1 } from '../../components/reports/reportFormat'
import { ReportErrorNotice } from '../../components/reports/ReportErrorNotice'
import { NameFilter, ReportFilterPanel } from '../../components/reports/ReportFilterPanel'
import {
  currentYearMonthSP,
  matchesName,
  parseMonthString,
  shiftYearMonth,
  toMonthString,
} from '../../components/reports/reportPeriod'
import { ChartPanel } from '../../components/reports/ChartPanel'
import { computeDelta } from '../../components/reports/delta'
import { GlassStatCards } from '../../components/ui/GlassStatCards'
import { ApiError } from '../../services/api'
import { assignCategoryColors } from '../../utils/chartColors'
import { centsToBRL } from '../../utils/currency'
import { formatMonthShort } from '../../utils/date'
import { categoriasService } from '../categorias/categorias.service'
import type { Category } from '../categorias/categorias.types'
import { useReportsFilters } from './useReportsFilters'
import { ComparativoTable } from './ComparativoTable'
import {
  buildRows,
  findHighlights,
  formatDiff,
  formatPct,
  toneOf,
  totalsOf,
} from './comparativo.utils'
import type { CategoryMeta, Tone } from './comparativo.utils'
import { relatoriosService } from './relatorios.service'
import type { ComparisonResult } from './relatorios.types'
import { TERRACOTTA_TEXT } from './visaoGeral.utils'
import './ComparativoTab.css'

const GOOD_COLOR = '#6baf82'
const NEUTRAL_GRAY = '#9ca79e'
const NEUTRAL_CATEGORY_COLOR = '#8a8f89'

const TONE_COLOR: Record<Tone, string> = {
  good: GOOD_COLOR,
  bad: TERRACOTTA_TEXT,
  neutral: NEUTRAL_GRAY,
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

interface MetricFooterProps {
  baseCents: number
  comparedCents: number
  baseLabel: string
  comparedLabel: string
  goodWhenUp: boolean
}

// Linha "Ago/26 R$ X → Set/26 R$ Y" + variação (seta, "+R$ Z (+P%)", "vs {mês base}").
// Sem base ('novo') não há percentual nem valor repetido: só "Sem movimento em {mês base}".
function MetricFooter({
  baseCents,
  comparedCents,
  baseLabel,
  comparedLabel,
  goodWhenUp,
}: MetricFooterProps) {
  const delta = computeDelta(baseCents, comparedCents)
  const tone = toneOf(delta.diff, goodWhenUp)
  const color = TONE_COLOR[tone]
  const amount = centsToBRL(Math.abs(delta.diff))

  let arrow: React.ReactNode
  if (delta.diff > 0) {
    arrow = <ArrowUp size={14} aria-label={`aumento de ${amount}`} role="img" />
  } else if (delta.diff < 0) {
    arrow = <ArrowDown size={14} aria-label={`queda de ${amount}`} role="img" />
  } else {
    arrow = <Minus size={14} aria-hidden="true" />
  }

  let text: string
  let showVs = true
  if (delta.kind === 'novo') {
    text = `Sem movimento em ${baseLabel}`
    showVs = false
  } else if (delta.kind === 'igual') {
    text = 'sem variação'
    showVs = false
  } else if (delta.kind === 'zerou') {
    text = `${formatDiff(delta.diff)} (zerou)`
  } else {
    text = `${formatDiff(delta.diff)} (${formatPct(delta.pct ?? 0)})`
  }

  return (
    <>
      <span className="comparativo-tab__range">
        {baseLabel} {centsToBRL(baseCents)} → {comparedLabel} {centsToBRL(comparedCents)}
      </span>
      <span className="comparativo-tab__variation" style={{ color }}>
        {arrow}
        <span>{text}</span>
        {showVs && <span className="comparativo-tab__vs">vs {baseLabel}</span>}
      </span>
    </>
  )
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando comparativo">
      <div className="comparativo-tab__skeleton-cards">
        {[0, 1, 2].map((index) => (
          <div key={index} className="comparativo-skeleton comparativo-skeleton--card" />
        ))}
      </div>
      <div className="comparativo-skeleton comparativo-skeleton--table" />
    </div>
  )
}

export function ComparativoTab() {
  // Meses guardados como string YYYY-MM; mês corrente no fuso America/Sao_Paulo e navegação
  // por aritmética de inteiros (shiftMonth) — nunca new Date("YYYY-MM-DD").
  const years = useReportsFilters().years
  const defaultCompared = toMonthString(currentYearMonthSP())
  const defaultBase = toMonthString(shiftYearMonth(currentYearMonthSP(), -1))
  const [baseMonth, setBaseMonth] = useState(defaultBase)
  const [comparedMonth, setComparedMonth] = useState(defaultCompared)
  const [name, setName] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Ícone e cor vêm de fora do relatório (a API não devolve): lista de categorias de despesa,
  // atribuída em lote como no CategoryBadge.
  useEffect(() => {
    let active = true
    categoriasService
      .list('expense')
      .then((list) => {
        if (active) setCategories(list)
      })
      .catch(() => {
        // sem a lista o relatório continua, só com ícone/cor neutros.
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    // Cada troca de filtro cancela a requisição anterior (e ignora resposta atrasada).
    const controller = new AbortController()
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await relatoriosService.getComparison(
          baseMonth,
          comparedMonth,
          controller.signal,
        )
        if (active) {
          setResult(data)
        }
      } catch (error) {
        if (active && !isAbortError(error)) {
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
      controller.abort()
    }
  }, [baseMonth, comparedMonth, attempt])

  const analysis = useMemo(() => {
    if (!result) return null
    const names = Array.from(
      new Set([
        ...categories.map((category) => category.name),
        ...result.categories.map((category) => category.name),
      ]),
    )
    const colors = assignCategoryColors(names)
    const meta = new Map<string, CategoryMeta>()
    for (const category of categories) {
      meta.set(category.id, {
        icon: category.icon,
        color: colors.get(category.name) ?? NEUTRAL_CATEGORY_COLOR,
      })
    }
    // Categoria que não está na lista: cor pelo nome, ícone padrão.
    for (const item of result.categories) {
      if (!meta.has(item.categoryId)) {
        meta.set(item.categoryId, {
          icon: null,
          color: colors.get(item.name) ?? NEUTRAL_CATEGORY_COLOR,
        })
      }
    }
    const rows = buildRows(result.categories, meta, NEUTRAL_CATEGORY_COLOR)
    // Nome filtra só a TABELA (contém, sem acento/caixa). Cards, chips de destaque e o Total
    // seguem sobre TODAS as linhas.
    const visibleRows = rows.filter((row) => matchesName(row.name, name))
    return {
      rows,
      visibleRows,
      totals: totalsOf(rows),
      subtotal: totalsOf(visibleRows),
      highlights: findHighlights(rows),
    }
  }, [result, categories, name])

  function swapMonths() {
    setBaseMonth(comparedMonth)
    setComparedMonth(baseMonth)
  }

  function renderContent() {
    if (!result || !analysis) return null
    // Rótulos vêm do próprio resultado (não do estado), então nunca ficam fora de sincronia
    // com os valores exibidos.
    const baseLabel = formatMonthShort(result.month1.month)
    const comparedLabel = formatMonthShort(result.month2.month)
    const { rows, visibleRows, totals, subtotal, highlights } = analysis
    const filtering = name.trim() !== ''

    const cards = [
      {
        label: 'Entradas',
        base: result.month1.incomeCents,
        compared: result.month2.incomeCents,
        goodWhenUp: true,
        icon: <TrendingUp size={16} aria-hidden="true" />,
        iconColor: GOOD_COLOR,
      },
      {
        label: 'Despesas',
        base: result.month1.expenseCents,
        compared: result.month2.expenseCents,
        goodWhenUp: false,
        icon: <TrendingDown size={16} aria-hidden="true" />,
        iconColor: TERRACOTTA_TEXT,
      },
      {
        label: 'Resultado',
        labelTitle: 'Entradas menos despesas do mês',
        base: result.month1.netCents,
        compared: result.month2.netCents,
        goodWhenUp: true,
        icon: <Scale size={16} aria-hidden="true" />,
      },
    ]

    // Total da tabela (soma das linhas) x card "Despesas": só reporta, nunca força igualdade.
    const baseGap = totals.baseCents - result.month1.expenseCents
    const comparedGap = totals.comparedCents - result.month2.expenseCents
    const diverges = baseGap !== 0 || comparedGap !== 0

    return (
      <>
        <GlassStatCards
          items={cards.map((card) => ({
            label: card.label,
            labelTitle: card.labelTitle,
            valueCents: card.compared,
            icon: card.icon,
            iconColor: card.iconColor,
            footer: (
              <MetricFooter
                baseCents={card.base}
                comparedCents={card.compared}
                baseLabel={baseLabel}
                comparedLabel={comparedLabel}
                goodWhenUp={card.goodWhenUp}
              />
            ),
          }))}
        />

        {(highlights.biggestIncrease || highlights.biggestDrop) && (
          <div className="comparativo-tab__highlights">
            {highlights.biggestIncrease && (
              <div className="comparativo-tab__chip">
                <span className="comparativo-tab__chip-label">Maior aumento:</span>
                <span
                  className="comparativo-tab__chip-name"
                  title={highlights.biggestIncrease.name}
                >
                  {highlights.biggestIncrease.name}
                </span>
                <span className="comparativo-tab__chip-value" style={{ color: TERRACOTTA_TEXT }}>
                  {formatDiff(highlights.biggestIncrease.delta.diff)}
                </span>
              </div>
            )}
            {highlights.biggestDrop && (
              <div className="comparativo-tab__chip">
                <span className="comparativo-tab__chip-label">Maior queda:</span>
                <span className="comparativo-tab__chip-name" title={highlights.biggestDrop.name}>
                  {highlights.biggestDrop.name}
                </span>
                <span className="comparativo-tab__chip-value" style={{ color: GOOD_COLOR }}>
                  {formatDiff(highlights.biggestDrop.delta.diff)}
                </span>
              </div>
            )}
          </div>
        )}

        <ChartPanel title="Despesas por categoria">
          {rows.length === 0 ? (
            <div className="comparativo-tab__empty">
              <Table2 size={28} aria-hidden="true" />
              <p>Sem despesas nos meses selecionados</p>
            </div>
          ) : filtering && visibleRows.length === 0 ? (
            <div className="comparativo-tab__empty">
              <Table2 size={28} aria-hidden="true" />
              <p>Nenhuma categoria corresponde a '{name.trim()}'</p>
              <button type="button" className="comparativo-tab__clear" onClick={() => setName('')}>
                Limpar
              </button>
            </div>
          ) : (
            <>
              {filtering && (
                <p className="comparativo-tab__filter-line">
                  Exibindo {visibleRows.length} de {rows.length}{' '}
                  {rows.length === 1 ? 'categoria' : 'categorias'} · Subtotal {comparedLabel}{' '}
                  {centsToBRL(subtotal.comparedCents)} (
                  {formatPercent1(subtotal.comparedCents, totals.comparedCents)} do total)
                </p>
              )}
              <ComparativoTable
                rows={visibleRows}
                totals={totals}
                subtotal={filtering ? subtotal : undefined}
                baseLabel={baseLabel}
                comparedLabel={comparedLabel}
              />
              {diverges && (
                <p className="comparativo-tab__gap-note" role="note">
                  O total da tabela difere do card Despesas
                  {baseGap !== 0 && ` em ${baseLabel} (${formatDiff(baseGap)})`}
                  {baseGap !== 0 && comparedGap !== 0 && ' e'}
                  {comparedGap !== 0 && ` em ${comparedLabel} (${formatDiff(comparedGap)})`}.
                </p>
              )}
            </>
          )}
        </ChartPanel>
      </>
    )
  }

  const sameMonth = baseMonth === comparedMonth
  const filtering = name.trim() !== ''
  const activeCount =
    (baseMonth !== defaultBase ? 1 : 0) +
    (comparedMonth !== defaultCompared ? 1 : 0) +
    (filtering ? 1 : 0)
  const base = parseMonthString(baseMonth)
  const compared = parseMonthString(comparedMonth)

  return (
    <div className="comparativo-tab">
      <ReportFilterPanel
        activeCount={activeCount}
        onClear={() => {
          setBaseMonth(defaultBase)
          setComparedMonth(defaultCompared)
          setName('')
        }}
        controls={
          <>
            <MonthYearPicker
              label="Mês base"
              month={base.month}
              year={base.year}
              years={years}
              onChange={(next) => setBaseMonth(toMonthString(next))}
            />
            <button
              type="button"
              className="comparativo-tab__swap"
              aria-label="Inverter meses"
              title="Inverter meses"
              onClick={swapMonths}
            >
              <ArrowLeftRight size={16} aria-hidden="true" />
            </button>
            <MonthYearPicker
              label="Mês comparado"
              month={compared.month}
              year={compared.year}
              years={years}
              onChange={(next) => setComparedMonth(toMonthString(next))}
            />
            {sameMonth && (
              <p className="comparativo-tab__same-month" role="status">
                Selecione meses diferentes
              </p>
            )}
          </>
        }
      >
        <NameFilter value={name} onChange={setName} />
      </ReportFilterPanel>
      {loadError && (
        <ReportErrorNotice message={loadError} onRetry={() => setAttempt((count) => count + 1)} />
      )}
      {loading && !loadError && <Skeleton />}
      {!loading && !loadError && renderContent()}
    </div>
  )
}
