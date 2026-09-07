import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { useNavRedirectError } from '../../hooks/useNavRedirectError'
import { ApiError } from '../../services/api'
import { cartoesService } from '../cartoes/cartoes.service'
import type { CreditCard } from '../cartoes/cartoes.types'
import { contasService } from '../contas/contas.service'
import type { Account } from '../contas/contas.types'
import { formatReferenceMonth } from '../../utils/date'
import { FaturasList } from './FaturasList'
import { PagarLoteForm } from './PagarLoteForm'
import { faturasService } from './faturas.service'
import type { PayFormData } from './pagamento.schema'
import type { InvoiceListItem } from './faturas.types'
import './FaturasPage.css'

interface BatchPayEntry {
  invoiceId: string
  cardName: string
  referenceMonth: string
}

interface BatchPayResult {
  succeeded: BatchPayEntry[]
  failed: (BatchPayEntry & { message: string }) | null
}

type Mode = { type: 'list' } | { type: 'batch-form' } | { type: 'batch-result'; result: BatchPayResult }

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function FaturasPage() {
  const navError = useNavRedirectError()
  const [searchParams] = useSearchParams()
  // Filtro inicial vem do link "Ver faturas" do Detalhe do cartão (?cartao=ID) — só lido
  // na primeira montagem, depois o Select controla o filtro normalmente.
  const [selectedCardId, setSelectedCardId] = useState(() => searchParams.get('cartao') ?? '')
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<Mode>({ type: 'list' })
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [batchFormError, setBatchFormError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [cardsResult, accountsResult] = await Promise.all([
          cartoesService.list('all'),
          contasService.list('active'),
        ])
        if (active) {
          setCards(cardsResult)
          setAccounts(accountsResult)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar os cartões.'))
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const result = await faturasService.list(selectedCardId || undefined)
        if (active) {
          setInvoices(result)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar as faturas.'))
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
  }, [selectedCardId, refreshKey])

  function handleCardFilterChange(cardId: string) {
    setSelectedCardId(cardId)
    setSelectedInvoiceIds(new Set())
  }

  function handleToggleInvoiceSelected(invoiceId: string) {
    setSelectedInvoiceIds((current) => {
      const next = new Set(current)
      if (next.has(invoiceId)) {
        next.delete(invoiceId)
      } else {
        next.add(invoiceId)
      }
      return next
    })
  }

  function handleToggleSelectAll() {
    const payableIds = invoices
      .filter((invoice) => invoice.displayStatus !== 'paid')
      .map((invoice) => invoice.id)
    const allSelected = payableIds.length > 0 && payableIds.every((id) => selectedInvoiceIds.has(id))
    setSelectedInvoiceIds(allSelected ? new Set() : new Set(payableIds))
  }

  function handleRequestBatchPay() {
    setBatchFormError(null)
    setMode({ type: 'batch-form' })
  }

  // "Pagar" no menu "..." de um card — reaproveita o fluxo de lote inteiro (mesmo formulário,
  // mesmo resumo de resultado) selecionando só essa fatura, em vez de duplicar a UI de
  // pagamento individual que já existe em FaturaDetalhePage.
  function handleQuickPay(invoiceId: string) {
    setSelectedInvoiceIds(new Set([invoiceId]))
    setBatchFormError(null)
    setMode({ type: 'batch-form' })
  }

  function handleCancelBatchPay() {
    setMode({ type: 'list' })
  }

  async function handleBatchPaySubmit(data: PayFormData) {
    const cardsById = new Map(cards.map((card) => [card.id, card]))
    // Processa na ordem em que aparecem na lista (respeitando o filtro atual) — não na
    // ordem de clique — pra ficar previsível pro usuário.
    const toProcess = invoices.filter((invoice) => selectedInvoiceIds.has(invoice.id))

    setBatchSubmitting(true)
    setBatchFormError(null)

    const succeeded: BatchPayEntry[] = []
    let failed: (BatchPayEntry & { message: string }) | null = null

    for (const invoice of toProcess) {
      const entry: BatchPayEntry = {
        invoiceId: invoice.id,
        cardName: cardsById.get(invoice.credit_card_id)?.name ?? 'Cartão removido',
        referenceMonth: invoice.reference_month,
      }
      try {
        await faturasService.pay(invoice.id, data)
        succeeded.push(entry)
      } catch (error) {
        failed = { ...entry, message: errorMessage(error, 'Erro inesperado. Tente novamente.') }
        break
      }
    }

    setBatchSubmitting(false)
    setSelectedInvoiceIds(new Set())
    setMode({ type: 'batch-result', result: { succeeded, failed } })
    setRefreshKey((key) => key + 1)
  }

  function handleCloseBatchResult() {
    setMode({ type: 'list' })
  }

  if (mode.type === 'batch-form') {
    return (
      <div className="faturas-page">
        <PageHeader title="Pagar faturas em lote" />
        <PagarLoteForm
          count={selectedInvoiceIds.size}
          accounts={accounts}
          error={batchFormError}
          submitting={batchSubmitting}
          onCancel={handleCancelBatchPay}
          onSubmit={handleBatchPaySubmit}
        />
      </div>
    )
  }

  if (mode.type === 'batch-result') {
    const { succeeded, failed } = mode.result
    return (
      <div className="faturas-page">
        <PageHeader title="Resultado do pagamento em lote" />
        {succeeded.length > 0 && (
          <div className="faturas-page__batch-summary faturas-page__batch-summary--success">
            <p className="faturas-page__batch-summary-title">
              {succeeded.length === 1
                ? '1 fatura paga com sucesso:'
                : `${succeeded.length} faturas pagas com sucesso:`}
            </p>
            <ul>
              {succeeded.map((entry) => (
                <li key={entry.invoiceId}>
                  {entry.cardName} — {formatReferenceMonth(entry.referenceMonth)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {failed && (
          <div className="faturas-page__batch-summary faturas-page__batch-summary--failure">
            <p className="faturas-page__batch-summary-title">
              Parou em {failed.cardName} — {formatReferenceMonth(failed.referenceMonth)}:
            </p>
            <p>{failed.message}</p>
          </div>
        )}
        {succeeded.length === 0 && !failed && <p>Nenhuma fatura foi paga.</p>}
        <Button type="button" onClick={handleCloseBatchResult}>
          Voltar pra faturas
        </Button>
      </div>
    )
  }

  return (
    <div className="faturas-page">
      <PageHeader title="Faturas" />
      <FormError message={navError ?? loadError} />
      {!loading && (
        <FaturasList
          invoices={invoices}
          cards={cards}
          selectedCardId={selectedCardId}
          onCardFilterChange={handleCardFilterChange}
          selectedInvoiceIds={selectedInvoiceIds}
          onToggleInvoiceSelected={handleToggleInvoiceSelected}
          onToggleSelectAll={handleToggleSelectAll}
          onRequestBatchPay={handleRequestBatchPay}
          onQuickPay={handleQuickPay}
        />
      )}
    </div>
  )
}
