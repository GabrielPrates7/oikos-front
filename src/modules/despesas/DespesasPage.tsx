import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { ApiError } from '../../services/api'
import { categoriasService } from '../categorias/categorias.service'
import type { Category } from '../categorias/categorias.types'
import { contasService } from '../contas/contas.service'
import type { Account } from '../contas/contas.types'
import { DespesaForm } from './DespesaForm'
import { DespesasList } from './DespesasList'
import { despesasService } from './despesas.service'
import type { CreateDespesaFormData } from './despesas.schemas'
import type { DespesaListEntry, Expense, ExpenseFilters } from './despesas.types'
import './DespesasPage.css'

type Mode =
  | { type: 'list' }
  | { type: 'create'; defaultAccountId?: string }
  | { type: 'edit'; entry: Expense }

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function DespesasPage() {
  // Atalho "Movimentar" de ContasList/CartoesList chega como /despesas?conta=ID — lido só
  // uma vez (inicializador preguiçoso do useState) pra abrir direto no formulário de
  // criação com a conta pré-selecionada.
  const [searchParams] = useSearchParams()
  const [entries, setEntries] = useState<DespesaListEntry[]>([])
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([])
  const [allAccounts, setAllAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<ExpenseFilters>({})
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>(() => {
    const conta = searchParams.get('conta')
    return conta ? { type: 'create', defaultAccountId: conta } : { type: 'list' }
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [activeAccountsResult, allAccountsResult, categoriesResult] = await Promise.all([
          contasService.list('active'),
          contasService.list('all'),
          categoriasService.list('expense'),
        ])
        if (active) {
          setActiveAccounts(activeAccountsResult)
          setAllAccounts(allAccountsResult)
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
        const result = await despesasService.listWithInvoicePayments(filters)
        if (active) {
          setEntries(result)
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
  }, [filters, refreshKey])

  async function handleCreate(data: CreateDespesaFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await despesasService.create(data)
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

  function handleCancelForm() {
    setFormError(null)
    setMode({ type: 'list' })
  }

  if (mode.type === 'create' || mode.type === 'edit') {
    return (
      <div className="despesas-page">
        <PageHeader title={mode.type === 'create' ? 'Nova despesa' : 'Editar despesa'} />
        <DespesaForm
          // react-hook-form registra o <select> como não-controlado: se a lista de contas
          // ainda estiver vazia no primeiro render (dado assíncrono), o valor inicial não
          // encontra a <option> correspondente e não "gruda" depois que ela aparece. A key
          // muda quando activeAccounts termina de carregar, forçando um remount limpo com
          // as options já prontas.
          key={activeAccounts.length}
          initialData={mode.type === 'edit' ? mode.entry : undefined}
          defaultAccountId={mode.type === 'create' ? mode.defaultAccountId : undefined}
          accounts={activeAccounts}
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
          <Button type="button" onClick={() => setMode({ type: 'create' })}>
            <Plus size={16} aria-hidden="true" />
            Nova despesa
          </Button>
        }
      />
      <FormError message={loadError} />
      {!loading && (
        <DespesasList
          entries={entries}
          accounts={allAccounts}
          categories={categories}
          filters={filters}
          onFiltersChange={setFilters}
          onEdit={(entry) => setMode({ type: 'edit', entry })}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
