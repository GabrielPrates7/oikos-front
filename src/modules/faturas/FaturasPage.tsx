import { Receipt } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { useNavRedirectError } from '../../hooks/useNavRedirectError'
import { ApiError } from '../../services/api'
import { DEFAULT_PAGE_SIZE, totalPages } from '../../utils/pagination'
import { cartoesService } from '../cartoes/cartoes.service'
import type { CreditCard } from '../cartoes/cartoes.types'
import { contasService } from '../contas/contas.service'
import type { Account } from '../contas/contas.types'
import { currentMonthString, formatReferenceMonth, splitMonthString } from '../../utils/date'
import { FaturasList } from './FaturasList'
import { PagarLoteForm } from './PagarLoteForm'
import { faturasService } from './faturas.service'
import type { InvoiceSort } from './faturas.service'
import type { PayFormData } from './pagamento.schema'
import type { InvoiceListItem } from './faturas.types'
import './FaturasPage.css'

// reference_month vem como 'YYYY-MM-01' — reduz pra 'YYYY-MM' pro <select> de mês.

interface BatchPayEntry {
  invoiceId: string
  cardName: string
  referenceMonth: string
}

interface BatchPayResult {
  succeeded: BatchPayEntry[]
  failed: (BatchPayEntry & { message: string }) | null
}

type Mode =
  { type: 'list' } | { type: 'batch-form' } | { type: 'batch-result'; result: BatchPayResult }

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function FaturasPage() {
  const navError = useNavRedirectError()
  const [searchParams] = useSearchParams()
  // Filtro inicial vem do link "Ver faturas" do Detalhe do cartão (?cartao=ID) — só lido
  // na primeira montagem, depois o Select controla o filtro normalmente.
  const [selectedCardId, setSelectedCardId] = useState(() => searchParams.get('cartao') ?? '')
  const [search, setSearch] = useState('')
  // Debounced — a busca vai pro servidor (ILIKE na descrição das compras dentro da fatura,
  // não está disponível no item já carregado no cliente), diferente do padrão client-side
  // usado em Entradas/Despesas.
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  // Mês e Ano abrem no mês/ano ATUAIS (mesma auto-detecção de Entradas/Despesas); '' = Todos.
  // Status ('unpaid' | 'paid' | '') é um filtro à parte — não vive mais dentro do Mês.
  const [monthFilter, setMonthFilterState] = useState(
    () => splitMonthString(currentMonthString()).monthNum,
  )
  const [statusFilter, setStatusFilter] = useState<'' | 'unpaid' | 'paid'>('')
  // Ano abre no ano atual (mesma auto-detecção de Entradas/Despesas); '' = todos os anos.
  const [yearFilter, setYearFilter] = useState(() => String(new Date().getFullYear()))
  const [dueFrom, setDueFrom] = useState('')
  const [dueTo, setDueTo] = useState('')
  const [availableYears, setAvailableYears] = useState<string[]>([String(new Date().getFullYear())])
  const [sortOrder, setSortOrder] = useState<InvoiceSort>('value_desc')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sumCents, setSumCents] = useState(0)
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
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(handle)
  }, [search])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const result = await faturasService.list(
          {
            creditCardId: selectedCardId || undefined,
            search: debouncedSearch || undefined,
            month: monthFilter || 'all',
            status: statusFilter || undefined,
            year: yearFilter || undefined,
            from: dueFrom || undefined,
            to: dueTo || undefined,
            sort: sortOrder,
          },
          { page, pageSize: DEFAULT_PAGE_SIZE },
        )
        if (active) {
          setInvoices(result.items)
          setTotal(result.total)
          setSumCents(result.sumCents)
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
  }, [
    selectedCardId,
    debouncedSearch,
    monthFilter,
    yearFilter,
    statusFilter,
    dueFrom,
    dueTo,
    sortOrder,
    page,
    refreshKey,
  ])

  // Opções do <select> de mês precisam do universo INTEIRO de meses (creditCardId/search
  // aplicados, mas sem filtro de mês nem paginação) — não dá pra derivar da página atual
  // igual antes da paginação existir. pageSize:100 é o mesmo teto pragmático usado em
  // despesas.service (fatura é mensal por cartão, cobre o uso real).
  useEffect(() => {
    let active = true

    async function loadYears() {
      try {
        const result = await faturasService.list(
          {
            creditCardId: selectedCardId || undefined,
            search: debouncedSearch || undefined,
            month: 'all',
          },
          { page: 1, pageSize: 100 },
        )
        if (active) {
          // Sempre inclui o ano atual (valor padrão do select precisa de <option>), mesmo sem
          // fatura nele — mesma regra de Entradas/Despesas.
          const years = new Set([
            String(new Date().getFullYear()),
            ...result.items.map((invoice) => invoice.reference_month.slice(0, 4)),
          ])
          setAvailableYears(Array.from(years).sort((a, b) => b.localeCompare(a)))
        }
      } catch {
        // Não bloqueia a tela por causa disso — o <select> de ano só fica com o ano atual
        // e "Todos".
      }
    }

    void loadYears()

    return () => {
      active = false
    }
  }, [selectedCardId, debouncedSearch, refreshKey])

  function handleCardFilterChange(cardId: string) {
    setPage(1)
    setSelectedCardId(cardId)
    setSelectedInvoiceIds(new Set())
  }

  function handleSearchChange(next: string) {
    setPage(1)
    setSearch(next)
  }

  function handleMonthFilterChange(next: string) {
    setPage(1)
    setMonthFilterState(next)
  }

  function handleYearFilterChange(next: string) {
    setPage(1)
    setYearFilter(next)
  }

  function handleStatusFilterChange(next: '' | 'unpaid' | 'paid') {
    setPage(1)
    setStatusFilter(next)
  }

  function handleDueFromChange(next: string) {
    setPage(1)
    setDueFrom(next)
  }

  function handleDueToChange(next: string) {
    setPage(1)
    setDueTo(next)
  }

  function handleSortOrderChange(next: InvoiceSort) {
    setPage(1)
    setSortOrder(next)
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
    const allSelected =
      payableIds.length > 0 && payableIds.every((id) => selectedInvoiceIds.has(id))
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
      <PageHeader title="Faturas" icon={<Receipt size={22} aria-hidden="true" />} />
      <FormError message={navError ?? loadError} />
      {!loading && (
        <FaturasList
          invoices={invoices}
          cards={cards}
          selectedCardId={selectedCardId}
          onCardFilterChange={handleCardFilterChange}
          search={search}
          onSearchChange={handleSearchChange}
          monthFilter={monthFilter}
          yearFilter={yearFilter}
          onYearFilterChange={handleYearFilterChange}
          availableYears={availableYears}
          dueFrom={dueFrom}
          onDueFromChange={handleDueFromChange}
          dueTo={dueTo}
          onDueToChange={handleDueToChange}
          onMonthFilterChange={handleMonthFilterChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          sortOrder={sortOrder}
          onSortOrderChange={handleSortOrderChange}
          sumCents={sumCents}
          total={total}
          page={page}
          totalPages={totalPages(total, DEFAULT_PAGE_SIZE)}
          onPageChange={setPage}
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
