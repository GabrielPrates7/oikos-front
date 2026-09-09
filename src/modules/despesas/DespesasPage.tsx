import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { SuccessMessage } from '../../components/feedback/SuccessMessage'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { DEFAULT_PAGE_SIZE, totalPages } from '../../utils/pagination'
import { cartoesService } from '../cartoes/cartoes.service'
import type { CreditCard } from '../cartoes/cartoes.types'
import { categoriasService } from '../categorias/categorias.service'
import type { Category } from '../categorias/categorias.types'
import { contasService } from '../contas/contas.service'
import type { Account } from '../contas/contas.types'
import { faturasService } from '../faturas/faturas.service'
import { formatReferenceMonth } from '../../utils/date'
import { ApiError } from '../../services/api'
import { DespesaForm } from './DespesaForm'
import { DespesasList } from './DespesasList'
import { despesasService } from './despesas.service'
import type { CreateDespesaFormData } from './despesas.schemas'
import type { DespesaListEntry, Expense, ExpenseFilters, MonthlySummary } from './despesas.types'
import './DespesasPage.css'

type Mode =
  | { type: 'list' }
  | { type: 'create'; defaultAccountId?: string; duplicateFrom?: Expense }
  | { type: 'edit'; entry: Expense }

const EMPTY_SUMMARY: MonthlySummary = {
  totalGeralCents: 0,
  totalPagoCents: 0,
  totalFaltaPagarCents: 0,
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function DespesasPage() {
  // Atalho "Movimentar" de ContasList/CartoesList chega como /despesas?conta=ID — lido só
  // uma vez (inicializador preguiçoso do useState) pra abrir direto no formulário de
  // criação com a conta pré-selecionada.
  const [searchParams] = useSearchParams()
  const [entries, setEntries] = useState<DespesaListEntry[]>([])
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([])
  const [allAccounts, setAllAccounts] = useState<Account[]>([])
  const [activeCards, setActiveCards] = useState<CreditCard[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<ExpenseFilters>({})
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<MonthlySummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>(() => {
    const conta = searchParams.get('conta')
    return conta ? { type: 'create', defaultAccountId: conta } : { type: 'list' }
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [activeAccountsResult, allAccountsResult, activeCardsResult, categoriesResult] =
          await Promise.all([
            contasService.list('active'),
            contasService.list('all'),
            cartoesService.list('active'),
            categoriasService.list('expense'),
          ])
        if (active) {
          setActiveAccounts(activeAccountsResult)
          setAllAccounts(allAccountsResult)
          setActiveCards(activeCardsResult)
          setCategories(categoriesResult)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar contas e categorias.'))
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [refreshKey])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const result = await despesasService.listWithInvoicePayments(filters, {
          page,
          pageSize: DEFAULT_PAGE_SIZE,
        })
        if (active) {
          setEntries(result.items)
          setTotal(result.total)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar as despesas.'))
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
  }, [filters, page, refreshKey])

  // Totais do mês são independentes da paginação da lista — recarregam junto (mesmo
  // gatilho de filtros/refresh), mas não competem com "loading" da lista em si.
  useEffect(() => {
    let active = true

    async function loadSummary() {
      try {
        const result = await despesasService.getMonthlySummary(filters.month)
        if (active) {
          setSummary(result)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar os totais do mês.'))
        }
      }
    }

    void loadSummary()

    return () => {
      active = false
    }
  }, [filters.month, refreshKey])

  function handleFiltersChange(next: ExpenseFilters) {
    setPage(1)
    setFilters(next)
  }

  // "Cartão de crédito" nem aparece na edição (ver DespesaForm) — só a criação passa por
  // aqui com paymentMethod === 'credit_card'. Compra vai pro mesmo POST /purchases que
  // CartaoDetalhePage já usa (cartoesService.createPurchase), nunca POST /expenses — por
  // isso ela nunca aparece em Despesas, só no histórico do cartão.
  async function handleCreate(data: CreateDespesaFormData) {
    setSubmitting(true)
    setFormError(null)
    setSuccessMessage(null)
    try {
      if (data.paymentMethod === 'credit_card') {
        const cardId = data.creditCardId as string
        const installmentsCount = data.installmentsCount as number
        const { installments } = await cartoesService.createPurchase(cardId, {
          categoryId: data.categoryId,
          description: data.description,
          totalAmountCents: data.amountCents,
          installmentsCount,
          purchaseDate: data.expenseDate,
          isEssential: data.isEssential,
          isFixed: data.isFixed,
          isPlanned: data.isPlanned,
        })
        const cardName = activeCards.find((card) => card.id === cardId)?.name ?? 'cartão'
        const firstInstallment = [...installments].sort(
          (a, b) => a.installment_number - b.installment_number,
        )[0]
        const invoice = await faturasService.getById(firstInstallment.invoice_id)
        setSuccessMessage(
          `Lançado na fatura do ${cardName} — parcela 1/${installmentsCount} em ${formatReferenceMonth(invoice.reference_month)}.`,
        )
      } else {
        await despesasService.create(data)
      }
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string, data: CreateDespesaFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await despesasService.update(id, data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(entry: Expense) {
    setLoadError(null)
    try {
      await despesasService.remove(entry.id)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setLoadError(errorMessage(error, 'Não foi possível excluir a despesa.'))
    }
  }

  // Atalho da lista — pula o formulário inteiro, só isso muda. Sempre manda paidDate junto
  // com isPaid (mesma regra do formulário completo, ver despesas.service.toApiPayload).
  async function handleMarkAsPaid(entry: Expense) {
    setLoadError(null)
    try {
      await despesasService.update(entry.id, { isPaid: true, paidDate: today() })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setLoadError(errorMessage(error, 'Não foi possível marcar a despesa como paga.'))
    }
  }

  function handleCancelForm() {
    setFormError(null)
    setMode({ type: 'list' })
  }

  function handleOpenCreate() {
    setSuccessMessage(null)
    setMode({ type: 'create' })
  }

  // Duplicar nunca edita o original — sempre abre o formulário de criação, só pré-preenchido
  // (ver DespesaForm.duplicateFrom). A data sugerida (mês seguinte) é calculada lá dentro.
  function handleDuplicate(entry: Expense) {
    setSuccessMessage(null)
    setMode({ type: 'create', duplicateFrom: entry })
  }

  if (mode.type === 'create' || mode.type === 'edit') {
    return (
      <div className="despesas-page">
        <PageHeader title={mode.type === 'create' ? 'Nova despesa' : 'Editar despesa'} />
        <DespesaForm
          // react-hook-form registra o <select> como não-controlado: se a lista de contas
          // ou cartões ainda estiver vazia no primeiro render (dado assíncrono), o valor
          // inicial não encontra a <option> correspondente e não "gruda" depois que ela
          // aparece. A key muda quando os dois terminam de carregar, forçando um remount
          // limpo com as options já prontas.
          key={`${activeAccounts.length}-${activeCards.length}`}
          initialData={mode.type === 'edit' ? mode.entry : undefined}
          duplicateFrom={mode.type === 'create' ? mode.duplicateFrom : undefined}
          defaultAccountId={mode.type === 'create' ? mode.defaultAccountId : undefined}
          accounts={activeAccounts}
          cards={activeCards}
          categories={categories}
          error={formError}
          submitting={submitting}
          onCancel={handleCancelForm}
          onSubmit={(data) =>
            mode.type === 'edit' ? handleUpdate(mode.entry.id, data) : handleCreate(data)
          }
        />
      </div>
    )
  }

  return (
    <div className="despesas-page">
      <PageHeader
        title="Despesas"
        action={
          <Button type="button" onClick={handleOpenCreate}>
            <Plus size={16} aria-hidden="true" />
            Nova despesa
          </Button>
        }
      />
      <FormError message={loadError} />
      <SuccessMessage message={successMessage} />
      {!loading && (
        <DespesasList
          entries={entries}
          accounts={allAccounts}
          categories={categories}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          summary={summary}
          page={page}
          totalPages={totalPages(total, DEFAULT_PAGE_SIZE)}
          onPageChange={setPage}
          onEdit={(entry) => setMode({ type: 'edit', entry })}
          onDelete={handleDelete}
          onMarkAsPaid={handleMarkAsPaid}
          onDuplicate={handleDuplicate}
        />
      )}
    </div>
  )
}
