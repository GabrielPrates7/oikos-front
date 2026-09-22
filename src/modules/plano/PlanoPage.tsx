import { AlertTriangle, ClipboardList, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { isAbortError } from '../../components/reports/abort'
import { ReportErrorNotice } from '../../components/reports/ReportErrorNotice'
import { ReportSkeleton } from '../../components/reports/ReportSkeleton'
import { DropdownMenu } from '../../components/ui/DropdownMenu'
import { InfoTip } from '../../components/ui/InfoTip'
import { MonthYearSelect } from '../../components/ui/MonthYearSelect'
import { Switch } from '../../components/ui/Switch'
import { ApiError } from '../../services/api'
import { assignCategoryColors } from '../../utils/chartColors'
import { centsToBRL } from '../../utils/currency'
import { todayInSaoPaulo } from '../../utils/date'
import { totalPages as computeTotalPages } from '../../utils/pagination'
import { categoriasService } from '../categorias/categorias.service'
import type { Category } from '../categorias/categorias.types'
import { MonthSwitcher } from '../dashboard/MonthSwitcher'
import type { LineFormValues } from './plano.schemas'
import type { LineFormMode } from './plano.schemas'
import { planoService } from './plano.service'
import type { UpdateLineBody } from './plano.service'
import type { CandidateKind, LinkResult, PlanKind, PlanLine, PlanSummary } from './plano.types'
import { PlanCandidatesPanel } from './PlanCandidatesPanel'
import { PlanEmptyGuide } from './PlanEmptyGuide'
import { PlanHealthCard } from './PlanHealthCard'
import { PlanImportPanel } from './PlanImportPanel'
import { PlanAlerts } from './PlanAlerts'
import { PlanByCategory } from './PlanByCategory'
import { PlanCashFlowChart } from './PlanCashFlowChart'
import { PlanCuts } from './PlanCuts'
import { PlanKpis } from './PlanKpis'
import { PlanVsRealizedChart } from './PlanVsRealizedChart'
import { PlanLineForm } from './PlanLineForm'
import { PLAN_PAGE_SIZE, PlanList } from './PlanList'
import { ChartPanel } from '../../components/reports/ChartPanel'
import '../../components/layout/GlowBackground.css'
import './PlanCharts.css'
import './PlanoPage.css'

type View =
  { type: 'plan' } | { type: 'form'; mode: LineFormMode; line?: PlanLine; presetKind?: PlanKind }

type Overlay = { type: 'system'; kind: CandidateKind } | { type: 'import' } | null

type Notice = { tone: 'ok' | 'error'; text: string } | null

function apiMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.status < 500 ? error.message : fallback
}

function modeForLine(line: PlanLine): LineFormMode {
  if (line.source_type === null) return 'manual-edit'
  return line.source_type === 'invoice' ? 'invoice-edit' : 'linked-edit'
}

// Plano do mês (/plano): planejamento mensal de entradas e saídas, projeção de caixa e comparação
// planejado x realizado. Todo número vem do backend (GET /plans/:month/summary); a tela só
// apresenta, e recarrega o resumo depois de cada mudança.
export function PlanoPage() {
  const [month, setMonth] = useState(() => todayInSaoPaulo().slice(0, 7))
  const [summary, setSummary] = useState<PlanSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [view, setView] = useState<View>({ type: 'plan' })
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const [savingSetting, setSavingSetting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[] | null>(null)
  const [incomePage, setIncomePage] = useState(1)
  const [expensePage, setExpensePage] = useState(1)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  // Carga do resumo: cancela a requisição anterior ao trocar de mês (AbortController). Os dados do
  // mês anterior ficam na tela (esmaecidos) até o novo chegar — sem salto de layout.
  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const result = await planoService.getSummary(month, controller.signal)
        setSummary(result)
      } catch (error) {
        if (isAbortError(error)) return
        setLoadError('Não foi possível carregar o plano.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [month, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  function handleMonthChange(next: string) {
    // Trocar de mês: a paginação das duas listas volta para a página 1 (não faz sentido continuar
    // na página 2 de um mês diferente).
    setIncomePage(1)
    setExpensePage(1)
    setNotice(null)
    setMonth(next)
  }

  // Categorias (para o formulário manual): carregadas uma vez, sob demanda.
  async function ensureCategories(): Promise<Category[]> {
    if (categories) return categories
    const loaded = await categoriasService.list()
    setCategories(loaded)
    return loaded
  }

  async function openForm(next: View) {
    setNotice(null)
    setFormError(null)
    try {
      await ensureCategories()
    } catch {
      setNotice({ tone: 'error', text: 'Não foi possível carregar as categorias.' })
      return
    }
    setView(next)
  }

  function openOverlay(next: Overlay, returnTo: HTMLElement | null) {
    setNotice(null)
    returnFocusRef.current = returnTo
    setOverlay(next)
  }

  function menuTrigger(): HTMLElement | null {
    return headerRef.current?.querySelector<HTMLElement>('button[aria-haspopup="menu"]') ?? null
  }

  const closeOverlay = useCallback(() => setOverlay(null), [])

  async function handleToggleOpening(next: boolean) {
    if (savingSetting) return
    setSavingSetting(true)
    setNotice(null)
    try {
      await planoService.updateSettings(month, next)
      reload()
    } catch (error) {
      setNotice({
        tone: 'error',
        text: apiMessage(error, 'Não foi possível salvar a configuração.'),
      })
    } finally {
      setSavingSetting(false)
    }
  }

  function handleLinked(result: LinkResult) {
    setOverlay(null)
    const added = result.added.length
    const ignored = result.ignored.length
    setNotice({
      tone: 'ok',
      text: `${added} ${added === 1 ? 'linha adicionada' : 'linhas adicionadas'}${ignored > 0 ? `, ${ignored} ${ignored === 1 ? 'ignorada' : 'ignoradas'}` : ''}.`,
    })
    reload()
  }

  async function handleRemove(line: PlanLine) {
    try {
      await planoService.removeLine(line.id)
      setNotice({
        tone: 'ok',
        text:
          line.source_type === null
            ? 'Linha removida do plano.'
            : 'Linha removida do plano. O lançamento original não foi excluído.',
      })
      reload()
    } catch (error) {
      setNotice({ tone: 'error', text: apiMessage(error, 'Não foi possível remover a linha.') })
    }
  }

  async function handleFormSubmit(values: LineFormValues) {
    if (view.type !== 'form') return
    setSubmitting(true)
    setFormError(null)
    try {
      const { mode, line } = view
      if (mode === 'manual-create') {
        await planoService.createLine(month, {
          kind: values.kind as PlanKind,
          description: values.description.trim(),
          category_id: values.categoryId || undefined,
          planned_amount_cents: values.amountCents,
          planned_date: values.plannedDate || undefined,
          is_essential: values.kind === 'expense' ? values.isEssential : undefined,
        })
      } else if (line) {
        let body: UpdateLineBody
        if (mode === 'manual-edit') {
          body = {
            description: values.description.trim(),
            category_id: values.categoryId || null,
            planned_amount_cents: values.amountCents,
            planned_date: values.plannedDate || null,
          }
          if (line.kind === 'expense') body.is_essential = values.isEssential ?? null
        } else if (mode === 'linked-edit') {
          body = {
            planned_amount_cents: values.amountCents,
            planned_date: values.plannedDate || null,
          }
        } else {
          body = { planned_date: values.plannedDate || null }
        }
        await planoService.updateLine(line.id, body)
      }
      setView({ type: 'plan' })
      setNotice({
        tone: 'ok',
        text: mode === 'manual-create' ? 'Linha adicionada ao plano.' : 'Linha atualizada.',
      })
      reload()
    } catch (error) {
      setFormError(apiMessage(error, 'Não foi possível salvar. Tente de novo.'))
    } finally {
      setSubmitting(false)
    }
  }

  const lines = useMemo(() => summary?.items ?? [], [summary])
  const incomeLines = lines.filter((line) => line.kind === 'income')
  const expenseLines = lines.filter((line) => line.kind === 'expense')
  const categoryColors = useMemo(
    () =>
      assignCategoryColors(lines.flatMap((line) => (line.category ? [line.category.name] : []))),
    [lines],
  )
  // Página efetiva (nunca além do que existe): remover, editar ou adicionar uma linha recarrega o
  // resumo, e se isso deixar a página em que o usuário estava sem linhas (ex.: estava na 2ª página
  // com 11 linhas e sobrou 1 página com 10), a tela já mostra a última válida — sem outro clique.
  const incomePageEffective = Math.min(
    incomePage,
    computeTotalPages(incomeLines.length, PLAN_PAGE_SIZE),
  )
  const expensePageEffective = Math.min(
    expensePage,
    computeTotalPages(expenseLines.length, PLAN_PAGE_SIZE),
  )

  // ------------------------------------------------------------------------------ formulário
  if (view.type === 'form') {
    return (
      <div className="plano">
        <PlanLineForm
          month={month}
          mode={view.mode}
          line={view.line}
          presetKind={view.presetKind}
          categories={categories ?? []}
          error={formError}
          submitting={submitting}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setFormError(null)
            setView({ type: 'plan' })
          }}
        />
      </div>
    )
  }

  // --------------------------------------------------------------------------------- resumo
  const stale = summary !== null && (loading || summary.month !== month)
  const pending = summary?.pending_before_month
  const showFutureWarning = summary?.period === 'future' && (pending?.count ?? 0) > 0
  const level = summary?.health.level
  const showGuide = summary !== null && level === 'none'
  const emptyPlan = summary !== null && summary.counts.lines === 0

  return (
    <div className="plano">
      <div ref={headerRef}>
        <PageHeader
          title="Plano do mês"
          icon={<ClipboardList size={22} />}
          action={
            <DropdownMenu
              label="Adicionar ao plano"
              floating
              triggerClassName="ui-button ui-button--primary plano__add"
              trigger={
                <>
                  <Plus size={16} aria-hidden="true" />
                  Adicionar
                </>
              }
            >
              {(close) => (
                <>
                  <button
                    type="button"
                    className="dropdown-menu__item plan-menu__item"
                    role="menuitem"
                    onClick={() => {
                      close()
                      openOverlay({ type: 'system', kind: 'income' }, menuTrigger())
                    }}
                  >
                    Do sistema
                  </button>
                  <button
                    type="button"
                    className="dropdown-menu__item plan-menu__item"
                    role="menuitem"
                    onClick={() => {
                      close()
                      void openForm({ type: 'form', mode: 'manual-create' })
                    }}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    className="dropdown-menu__item plan-menu__item"
                    role="menuitem"
                    onClick={() => {
                      close()
                      openOverlay({ type: 'import' }, menuTrigger())
                    }}
                  >
                    Importar
                  </button>
                </>
              )}
            </DropdownMenu>
          }
        />
      </div>

      <div className="plano__toolbar">
        <MonthSwitcher month={month} onChange={handleMonthChange} label="Mês do plano" />
        <MonthYearSelect month={month} onChange={handleMonthChange} label="Ir direto para o mês" />
        {summary && !loadError && (
          <div className="plano__opening">
            <Switch
              checked={summary.settings.include_opening_balance}
              disabled={savingSetting || stale}
              onChange={(next) => void handleToggleOpening(next)}
            >
              Contar meu saldo de abertura ({centsToBRL(summary.opening_balance)})
            </Switch>
            <InfoTip label="Sobre o saldo de abertura">
              <p>
                O saldo de abertura é o de 1º do mês; assim o que já foi recebido ou pago neste mês
                não é contado duas vezes. O resultado planejado nunca inclui saldo.
              </p>
            </InfoTip>
          </div>
        )}
      </div>

      {notice && (
        <div
          className={`plano__notice plano__notice--${notice.tone}`}
          role={notice.tone === 'error' ? 'alert' : 'status'}
        >
          <span>{notice.text}</span>
          <button type="button" className="plano__notice-close" onClick={() => setNotice(null)}>
            Fechar aviso
          </button>
        </div>
      )}

      {loadError ? (
        <ReportErrorNotice message={loadError} onRetry={reload} />
      ) : summary === null ? (
        <ReportSkeleton cards={4} panels={2} panelHeight={260} />
      ) : (
        <div className={`plano__content${stale ? ' plano__content--stale' : ''}`} aria-busy={stale}>
          {showFutureWarning && pending && (
            <div className="plano__warning" role="note">
              <AlertTriangle size={18} aria-hidden="true" />
              <p>
                {pending.expense_cents + pending.invoice_cents > 0
                  ? `A abertura deste mês não inclui ${centsToBRL(pending.expense_cents + pending.invoice_cents)} de pendências de meses anteriores. O caixa projetado pode estar otimista.`
                  : `A abertura deste mês não inclui ${centsToBRL(pending.income_cents)} de entradas pendentes de meses anteriores.`}
              </p>
            </div>
          )}

          {showGuide ? (
            <PlanEmptyGuide
              summary={summary}
              onSuggest={(element) => openOverlay({ type: 'import' }, element)}
              onAddFromSystem={(element) =>
                openOverlay({ type: 'system', kind: 'income' }, element)
              }
            />
          ) : (
            <PlanHealthCard summary={summary} />
          )}

          {!emptyPlan && <PlanKpis summary={summary} />}

          {!emptyPlan && (
            <PlanAlerts
              summary={summary}
              onOpen={(kind, trigger) => openOverlay({ type: 'system', kind }, trigger)}
            />
          )}

          {!emptyPlan && (
            <div className="plan-lists">
              <PlanList
                kind="income"
                title="Entradas previstas"
                subtotalCents={summary.planned.inflow}
                lines={incomeLines}
                categoryColors={categoryColors}
                page={incomePageEffective}
                onPageChange={setIncomePage}
                onAdd={(kind, way, trigger) => {
                  if (way === 'system') openOverlay({ type: 'system', kind }, trigger)
                  else void openForm({ type: 'form', mode: 'manual-create', presetKind: kind })
                }}
                onEdit={(line) => void openForm({ type: 'form', mode: modeForLine(line), line })}
                onRemove={handleRemove}
              />
              <PlanList
                kind="expense"
                title="Saídas previstas"
                subtotalCents={summary.planned.outflow}
                lines={expenseLines}
                categoryColors={categoryColors}
                page={expensePageEffective}
                onPageChange={setExpensePage}
                onAdd={(kind, way, trigger) => {
                  if (way === 'system') openOverlay({ type: 'system', kind }, trigger)
                  else void openForm({ type: 'form', mode: 'manual-create', presetKind: kind })
                }}
                onEdit={(line) => void openForm({ type: 'form', mode: modeForLine(line), line })}
                onRemove={handleRemove}
              />
            </div>
          )}

          {!emptyPlan && (
            <>
              <div className="plano-panels">
                <ChartPanel
                  title="Fluxo de caixa do mês"
                  subtitle="Saldo planejado e saldo realizado, em degraus, dia a dia"
                >
                  <PlanCashFlowChart summary={summary} />
                </ChartPanel>
                <ChartPanel
                  title="Planejado x Realizado"
                  subtitle="Entradas, saídas e resultado do mês"
                >
                  <PlanVsRealizedChart summary={summary} />
                </ChartPanel>
              </div>
              <div className="plano-block">
                <ChartPanel
                  title="Planejado x realizado por categoria"
                  subtitle="Onde o plano está sendo cumprido e onde foi ultrapassado"
                >
                  <PlanByCategory summary={summary} />
                </ChartPanel>
              </div>
              <PlanCuts summary={summary} />
            </>
          )}
        </div>
      )}

      {overlay?.type === 'system' && (
        <PlanCandidatesPanel
          month={month}
          initialKind={overlay.kind}
          returnFocusRef={returnFocusRef}
          onClose={closeOverlay}
          onLinked={handleLinked}
        />
      )}
      {overlay?.type === 'import' && (
        <PlanImportPanel
          month={month}
          returnFocusRef={returnFocusRef}
          onClose={closeOverlay}
          onImported={reload}
        />
      )}
    </div>
  )
}
