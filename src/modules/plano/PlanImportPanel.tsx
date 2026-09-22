import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { isAbortError } from '../../components/reports/abort'
import { ApiError } from '../../services/api'
import { formatMonthLabel } from '../../utils/date'
import { planoService } from './plano.service'
import type { ImportResult, ImportSource } from './plano.types'
import { PlanSheet } from './PlanSheet'
import './PlanImportPanel.css'

const ALL_SOURCES: ImportSource[] = ['planned', 'invoices', 'fixed_previous_month']

const SOURCE_LABELS: Record<ImportSource, { title: string; help: string }> = {
  planned: {
    title: 'Lançamentos planejados do mês',
    help: 'Entradas e despesas marcadas como planejadas, além de pendências atrasadas de meses anteriores.',
  },
  invoices: {
    title: 'Faturas do mês',
    help: 'Faturas de cartão com vencimento no mês (ou pagas no mês).',
  },
  fixed_previous_month: {
    title: 'Fixas do mês anterior',
    help: 'Entradas e despesas fixas do mês anterior, com a data no mês seguinte.',
  },
}

function ignoredCount(result: ImportResult): number {
  const { planned, invoices, fixed_previous_month: fixed } = result.sources
  return (
    (planned
      ? planned.income.skipped_already_in_plan +
        planned.income.skipped_settled +
        planned.expense.skipped_already_in_plan +
        planned.expense.skipped_settled
      : 0) +
    (invoices?.skipped_already_in_plan ?? 0) +
    (fixed?.skipped_duplicates ?? 0)
  )
}

function countFor(result: ImportResult | null, source: ImportSource): number | null {
  if (!result) return null
  if (source === 'planned') return result.sources.planned?.added ?? null
  if (source === 'invoices') return result.sources.invoices?.added ?? null
  return result.sources.fixed_previous_month?.added ?? null
}

interface PlanImportPanelProps {
  month: string
  returnFocusRef?: RefObject<HTMLElement | null>
  onClose: () => void
  // Chamado depois de importar de verdade: a tela recarrega o resumo por trás.
  onImported: (result: ImportResult) => void
}

// Importar: escolhe as fontes e SEMPRE mostra a prévia (dry_run) com a contagem por fonte antes do
// botão de confirmação. "Incluir também os já recebidos/pagos do mês" vem MARCADO por padrão (mantém
// o caixa projetado completo). Depois de confirmar, mostra "N adicionadas, M ignoradas".
export function PlanImportPanel({
  month,
  returnFocusRef,
  onClose,
  onImported,
}: PlanImportPanelProps) {
  const [sources, setSources] = useState<Set<ImportSource>>(new Set(ALL_SOURCES))
  const [includeSettled, setIncludeSettled] = useState(true)
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const [previewLoading, setPreviewLoading] = useState(true)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [done, setDone] = useState<ImportResult | null>(null)

  useEffect(() => {
    if (done || sources.size === 0) return
    const controller = new AbortController()

    async function load() {
      setPreviewLoading(true)
      setPreviewError(null)
      try {
        const result = await planoService.importItems(
          month,
          {
            sources: ALL_SOURCES.filter((source) => sources.has(source)),
            include_settled: includeSettled,
            dry_run: true,
          },
          controller.signal,
        )
        setPreview(result)
      } catch (error) {
        if (isAbortError(error)) return
        setPreview(null)
        setPreviewError('Não foi possível calcular a prévia.')
      } finally {
        if (!controller.signal.aborted) setPreviewLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [month, sources, includeSettled, retryKey, done])

  function toggleSource(source: ImportSource) {
    setSources((current) => {
      const next = new Set(current)
      if (next.has(source)) next.delete(source)
      else next.add(source)
      return next
    })
  }

  async function handleImport() {
    if (importing || !activePreview) return
    setImporting(true)
    setImportError(null)
    try {
      const result = await planoService.importItems(month, {
        sources: ALL_SOURCES.filter((s) => sources.has(s)),
        include_settled: includeSettled,
        dry_run: false,
      })
      setDone(result)
      onImported(result)
    } catch (error) {
      setImportError(
        error instanceof ApiError && error.status < 500
          ? error.message
          : 'Não foi possível importar. Tente de novo.',
      )
    } finally {
      setImporting(false)
    }
  }

  // Sem fontes escolhidas não há prévia (e nada carregando), mesmo que a última ainda esteja no estado.
  const activePreview = sources.size === 0 ? null : preview
  const loadingNow = sources.size > 0 && previewLoading
  const total = activePreview?.total_added ?? 0
  const overdue = activePreview?.sources.planned?.overdue_previous_months ?? 0

  return (
    <PlanSheet
      title="Importar para o plano"
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      footer={
        done ? (
          <button
            type="button"
            className="ui-button ui-button--primary plan-import__submit"
            onClick={onClose}
          >
            Concluir
          </button>
        ) : (
          <>
            {importError && (
              <p className="plan-import__error" role="alert">
                {importError}
              </p>
            )}
            <button
              type="button"
              className="ui-button ui-button--primary plan-import__submit"
              disabled={!activePreview || loadingNow || total === 0 || importing}
              aria-busy={importing}
              onClick={() => void handleImport()}
            >
              {importing && <span className="ui-button__spinner" aria-hidden="true" />}
              {total === 0
                ? 'Nada para importar'
                : `Importar ${total} ${total === 1 ? 'linha' : 'linhas'}`}
            </button>
          </>
        )
      }
    >
      <p className="plan-import__intro">
        Traz lançamentos do sistema para o plano de {formatMonthLabel(month)}. Veja a prévia antes
        de confirmar: nada é gravado até você importar.
      </p>

      {done ? (
        <div className="plan-import__done" role="status">
          <CheckCircle2 size={22} aria-hidden="true" />
          <p>
            {done.total_added} {done.total_added === 1 ? 'adicionada' : 'adicionadas'},{' '}
            {ignoredCount(done)} {ignoredCount(done) === 1 ? 'ignorada' : 'ignoradas'}.
          </p>
        </div>
      ) : (
        <>
          <fieldset className="plan-import__sources">
            <legend className="plan-import__legend">Fontes</legend>
            {ALL_SOURCES.map((source) => {
              const selected = sources.has(source)
              const count = countFor(activePreview, source)
              return (
                <label key={source} className="plan-import__source">
                  <input type="checkbox" checked={selected} onChange={() => toggleSource(source)} />
                  <span className="plan-import__source-text">
                    <span className="plan-import__source-title">{SOURCE_LABELS[source].title}</span>
                    <span className="plan-import__source-help">{SOURCE_LABELS[source].help}</span>
                  </span>
                  <span className="plan-import__count" aria-live="polite">
                    {!selected
                      ? '—'
                      : loadingNow
                        ? '…'
                        : count === null
                          ? '—'
                          : `${count} ${count === 1 ? 'linha' : 'linhas'}`}
                  </span>
                </label>
              )
            })}
          </fieldset>

          <label className="plan-import__settled">
            <input
              type="checkbox"
              checked={includeSettled}
              disabled={!sources.has('planned')}
              onChange={(event) => setIncludeSettled(event.target.checked)}
            />
            <span className="plan-import__source-text">
              <span className="plan-import__source-title">
                Incluir também os já recebidos/pagos do mês
              </span>
              <span className="plan-import__source-help">
                Mantém o caixa projetado completo: o saldo de abertura é o do dia 1, então o que já
                foi pago ou recebido neste mês precisa estar no plano.
              </span>
            </span>
          </label>

          <section
            className="plan-import__preview"
            aria-label="Prévia da importação"
            aria-busy={loadingNow}
          >
            <h3 className="plan-import__preview-title">Prévia</h3>
            {previewError ? (
              <div role="status">
                <p className="plan-import__error">{previewError}</p>
                <button
                  type="button"
                  className="plan-import__retry"
                  onClick={() => setRetryKey((n) => n + 1)}
                >
                  Tentar de novo
                </button>
              </div>
            ) : sources.size === 0 ? (
              <p className="plan-import__muted">Escolha ao menos uma fonte.</p>
            ) : loadingNow && !activePreview ? (
              <p className="plan-import__muted">Calculando a prévia…</p>
            ) : activePreview ? (
              <ul className="plan-import__preview-list">
                {ALL_SOURCES.filter((source) => sources.has(source)).map((source) => (
                  <li key={source}>
                    <span>{SOURCE_LABELS[source].title}</span>
                    <strong>{countFor(activePreview, source) ?? 0}</strong>
                  </li>
                ))}
                <li className="plan-import__preview-total">
                  <span>Total a adicionar</span>
                  <strong>{activePreview.total_added}</strong>
                </li>
              </ul>
            ) : null}
            {overdue > 0 && (
              <p className="plan-import__warning" role="note">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>
                  {overdue} {overdue === 1 ? 'item' : 'itens'} de meses anteriores (pendências
                  atrasadas).
                </span>
              </p>
            )}
          </section>
        </>
      )}
    </PlanSheet>
  )
}
