import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { CardSwatch } from '../../components/forms/LaunchFields'
import { CategoryBadge } from '../../components/ui/CategoryBadge'
import { Pagination } from '../../components/ui/Pagination'
import { isAbortError } from '../../components/reports/abort'
import { assignCategoryColors } from '../../utils/chartColors'
import { centsToBRL } from '../../utils/currency'
import { ApiError } from '../../services/api'
import { totalPages } from '../../utils/pagination'
import { planoService } from './plano.service'
import type { Candidate, CandidateKind, LinkResult, PlanSourceType } from './plano.types'
import { formatDayMonth } from './planoFormat'
import { PlanSheet } from './PlanSheet'
import './PlanCandidatesPanel.css'

const PAGE_SIZE = 20

const TABS: { kind: CandidateKind; label: string }[] = [
  { kind: 'income', label: 'Entradas' },
  { kind: 'expense', label: 'Despesas' },
  { kind: 'invoice', label: 'Faturas' },
]

const SOURCE_TYPE: Record<CandidateKind, PlanSourceType> = {
  income: 'income_entry',
  expense: 'expense',
  invoice: 'invoice',
}

const SITUATION_TEXT: Record<Candidate['situation'], string> = {
  pending: 'Pendente',
  overdue: 'Atrasado',
  received: 'Recebido',
  paid: 'Pago',
}

interface PlanCandidatesPanelProps {
  month: string
  initialKind: CandidateKind
  returnFocusRef?: RefObject<HTMLElement | null>
  onClose: () => void
  // Depois de vincular: a tela recarrega o resumo e mostra o resultado (adicionados/ignorados).
  onLinked: (result: LinkResult) => void
}

// Painel "Do sistema": escolhe entradas, despesas e faturas que já existem no sistema e ainda não
// estão em nenhum plano. Busca e paginação no SERVIDOR; a seleção é mantida ao trocar de aba e de
// página. Gaveta no desktop, folha no mobile (PlanSheet).
export function PlanCandidatesPanel({
  month,
  initialKind,
  returnFocusRef,
  onClose,
  onLinked,
}: PlanCandidatesPanelProps) {
  const [kind, setKind] = useState<CandidateKind>(initialKind)
  const [onlyPending, setOnlyPending] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ candidates: Candidate[]; total: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selected, setSelected] = useState<Map<string, { type: PlanSourceType; id: string }>>(
    new Map(),
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Busca com atraso curto (a consulta é no servidor).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const result = await planoService.listCandidates(
          month,
          {
            kind,
            status: onlyPending ? 'pending' : 'all',
            search: search || undefined,
            page,
            pageSize: PAGE_SIZE,
          },
          controller.signal,
        )
        setData({ candidates: result.candidates, total: result.total })
      } catch (error) {
        if (isAbortError(error)) return
        setLoadError('Não foi possível carregar os lançamentos.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [month, kind, onlyPending, search, page, reloadKey])

  function toggle(candidate: Candidate) {
    setSelected((current) => {
      const next = new Map(current)
      const key = `${candidate.kind}:${candidate.id}`
      if (next.has(key)) next.delete(key)
      else next.set(key, { type: SOURCE_TYPE[candidate.kind], id: candidate.id })
      return next
    })
  }

  async function handleAdd() {
    if (selected.size === 0 || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      const result = await planoService.link(month, [...selected.values()])
      onLinked(result)
    } catch (error) {
      setSaveError(
        error instanceof ApiError && error.status < 500
          ? error.message
          : 'Não foi possível adicionar ao plano. Tente de novo.',
      )
    } finally {
      setSaving(false)
    }
  }

  const candidates = data?.candidates ?? []
  const colors = assignCategoryColors(
    candidates.flatMap((candidate) => (candidate.category ? [candidate.category.name] : [])),
  )

  return (
    <PlanSheet
      title="Adicionar do sistema"
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      footer={
        <>
          {saveError && (
            <p className="plan-cand__error" role="alert">
              {saveError}
            </p>
          )}
          <button
            type="button"
            className="ui-button ui-button--primary plan-cand__submit"
            disabled={selected.size === 0 || saving}
            aria-busy={saving}
            onClick={() => void handleAdd()}
          >
            {saving && <span className="ui-button__spinner" aria-hidden="true" />}
            {selected.size === 0 ? 'Adicionar ao plano' : `Adicionar ${selected.size} ao plano`}
          </button>
        </>
      }
    >
      <div className="plan-cand__tabs" role="tablist" aria-label="Tipo de lançamento">
        {TABS.map((tab) => (
          <button
            key={tab.kind}
            type="button"
            role="tab"
            aria-selected={kind === tab.kind}
            className={`plan-cand__tab${kind === tab.kind ? ' plan-cand__tab--active' : ''}`}
            onClick={() => {
              setKind(tab.kind)
              setPage(1)
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="plan-cand__filters">
        <label className="plan-cand__search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Buscar</span>
          <input
            type="search"
            value={searchInput}
            placeholder={kind === 'invoice' ? 'Buscar por cartão' : 'Buscar por descrição'}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>
        <label className="plan-cand__pending">
          <input
            type="checkbox"
            checked={onlyPending}
            onChange={(event) => {
              setOnlyPending(event.target.checked)
              setPage(1)
            }}
          />
          Só pendentes
        </label>
      </div>
      <p className="plan-cand__hint">
        Só aparece o que ainda não está em nenhum plano: do mês, atrasados de meses anteriores e o
        que foi pago ou recebido neste mês.
      </p>

      <div className="plan-cand__list-wrap" aria-busy={loading}>
        {loadError ? (
          <div className="plan-cand__state" role="status">
            <p>{loadError}</p>
            <button
              type="button"
              className="plan-cand__retry"
              onClick={() => setReloadKey((n) => n + 1)}
            >
              Tentar de novo
            </button>
          </div>
        ) : data === null ? (
          <p className="plan-cand__state">Carregando…</p>
        ) : candidates.length === 0 ? (
          <p className="plan-cand__state">Nada para adicionar aqui.</p>
        ) : (
          <ul className={`plan-cand__list${loading ? ' plan-cand__list--loading' : ''}`}>
            {candidates.map((candidate) => {
              const key = `${candidate.kind}:${candidate.id}`
              const checked = selected.has(key)
              return (
                <li key={key}>
                  <label className={`plan-cand__row${checked ? ' plan-cand__row--checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(candidate)}
                      aria-label={`Selecionar ${candidate.description}`}
                    />
                    <span className="plan-cand__row-main">
                      <span className="plan-cand__row-title">
                        {candidate.credit_card ? (
                          <CardSwatch name={candidate.credit_card.name} />
                        ) : (
                          candidate.description
                        )}
                      </span>
                      <span className="plan-cand__row-meta">
                        {candidate.category && (
                          <CategoryBadge
                            name={candidate.category.name}
                            icon={candidate.category.icon}
                            color={colors.get(candidate.category.name) ?? 'var(--color-text-muted)'}
                          />
                        )}
                        <span>
                          {candidate.kind === 'invoice' ? 'vence ' : ''}
                          {formatDayMonth(candidate.date)}
                        </span>
                        <span className={`plan-badge plan-badge--${candidate.situation}`}>
                          {SITUATION_TEXT[candidate.situation]}
                        </span>
                        {candidate.is_planned !== null && (
                          <span className="plan-badge plan-badge--soft">
                            {candidate.is_planned ? 'Planejado' : 'Não planejado'}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="plan-cand__row-amount">
                      {centsToBRL(candidate.amount_cents)}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {data && data.total > PAGE_SIZE && (
        <Pagination
          page={page}
          totalPages={totalPages(data.total, PAGE_SIZE)}
          onPageChange={setPage}
        />
      )}
    </PlanSheet>
  )
}
