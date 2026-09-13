import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { ApiError } from '../../services/api'
import { DEFAULT_PAGE_SIZE, totalPages } from '../../utils/pagination'
import { contasService } from '../contas/contas.service'
import type { Account } from '../contas/contas.types'
import { TransferenciaForm } from './TransferenciaForm'
import { TransferenciasList } from './TransferenciasList'
import { transferenciasService } from './transferencias.service'
import type { CreateTransferenciaFormData } from './transferencias.schemas'
import type { Transfer, TransferFilters } from './transferencias.types'
import './TransferenciasPage.css'

type Mode = { type: 'list' } | { type: 'create'; defaultFromAccountId?: string }

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function TransferenciasPage() {
  // Atalho "Movimentar" de ContasList/CartoesList chega como /transferencias?conta=ID —
  // lido só uma vez (inicializador preguiçoso do useState) pra abrir direto no formulário
  // de criação com a conta de origem pré-selecionada.
  const [searchParams] = useSearchParams()
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([])
  const [allAccounts, setAllAccounts] = useState<Account[]>([])
  const [filters, setFilters] = useState<TransferFilters>({})
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sumCents, setSumCents] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>(() => {
    const conta = searchParams.get('conta')
    // ?nova=1 vem do menu "Nova Transação" do Dashboard — mesma ideia de ?conta=ID, mas sem
    // conta de origem pré-selecionada.
    if (conta) return { type: 'create', defaultFromAccountId: conta }
    return searchParams.get('nova') ? { type: 'create' } : { type: 'list' }
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [activeAccountsResult, allAccountsResult] = await Promise.all([
          contasService.list('active'),
          contasService.list('all'),
        ])
        if (active) {
          setActiveAccounts(activeAccountsResult)
          setAllAccounts(allAccountsResult)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar as contas.'))
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
        const result = await transferenciasService.list(filters, {
          page,
          pageSize: DEFAULT_PAGE_SIZE,
        })
        if (active) {
          setTransfers(result.items)
          setTotal(result.total)
          setSumCents(result.sumCents)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar as transferências.'))
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

  function handleFiltersChange(next: TransferFilters) {
    setPage(1)
    setFilters(next)
  }

  async function handleCreate(data: CreateTransferenciaFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await transferenciasService.create(data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(transfer: Transfer) {
    setLoadError(null)
    try {
      await transferenciasService.remove(transfer.id)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setLoadError(errorMessage(error, 'Não foi possível excluir a transferência.'))
    }
  }

  function handleCancelForm() {
    setFormError(null)
    setMode({ type: 'list' })
  }

  if (mode.type === 'create') {
    return (
      <div className="transferencias-page">
        <PageHeader title="Nova transferência" />
        <TransferenciaForm
          // Mesmo motivo do key em DespesasPage: <select> não-controlado do RHF só aplica
          // o valor inicial contra as options que já existem no primeiro render.
          key={activeAccounts.length}
          defaultFromAccountId={mode.type === 'create' ? mode.defaultFromAccountId : undefined}
          accounts={activeAccounts}
          error={formError}
          submitting={submitting}
          onCancel={handleCancelForm}
          onSubmit={handleCreate}
        />
      </div>
    )
  }

  return (
    <div className="transferencias-page">
      <PageHeader
        title="Transferências"
        action={
          <Button type="button" onClick={() => setMode({ type: 'create' })}>
            <Plus size={16} aria-hidden="true" />
            Nova transferência
          </Button>
        }
      />
      <FormError message={loadError} />
      {!loading && (
        <TransferenciasList
          transfers={transfers}
          accounts={allAccounts}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          sumCents={sumCents}
          page={page}
          totalPages={totalPages(total, DEFAULT_PAGE_SIZE)}
          onPageChange={setPage}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
