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
import { EntradaForm } from './EntradaForm'
import { EntradasList } from './EntradasList'
import { entradasService } from './entradas.service'
import type { CreateEntradaFormData } from './entradas.schemas'
import type { IncomeEntry, IncomeEntryFilters } from './entradas.types'
import './EntradasPage.css'

type Mode =
  | { type: 'list' }
  | { type: 'create'; defaultAccountId?: string }
  | { type: 'edit'; entry: IncomeEntry }

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function EntradasPage() {
  // Atalho "Movimentar" de ContasList/CartoesList chega como /entradas?conta=ID — lido só
  // uma vez (inicializador preguiçoso do useState) pra abrir direto no formulário de
  // criação com a conta pré-selecionada, sem precisar de efeito nem depender do parâmetro
  // continuar na URL depois.
  const [searchParams] = useSearchParams()
  const [entries, setEntries] = useState<IncomeEntry[]>([])
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([])
  const [allAccounts, setAllAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<IncomeEntryFilters>({})
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>(() => {
    const conta = searchParams.get('conta')
    return conta ? { type: 'create', defaultAccountId: conta } : { type: 'list' }
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Dados de referência (contas, categorias) — não dependem dos filtros, só recarregam
  // quando uma mutação pode ter afetado o conjunto (refreshKey).
  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [activeAccountsResult, allAccountsResult, categoriesResult] = await Promise.all([
          contasService.list('active'),
          contasService.list('all'),
          categoriasService.list('income'),
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
        const result = await entradasService.list(filters)
        if (active) {
          setEntries(result)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar as entradas.'))
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

  async function handleCreate(data: CreateEntradaFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await entradasService.create(data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string, data: CreateEntradaFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await entradasService.update(id, data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(entry: IncomeEntry) {
    setLoadError(null)
    try {
      await entradasService.remove(entry.id)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setLoadError(errorMessage(error, 'Não foi possível excluir a entrada.'))
    }
  }

  // Atalho da lista — pula o formulário inteiro, só isso muda. Sempre manda receivedDate
  // junto com isReceived (mesma regra do formulário completo).
  async function handleMarkAsReceived(entry: IncomeEntry) {
    setLoadError(null)
    try {
      await entradasService.update(entry.id, { isReceived: true, receivedDate: today() })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setLoadError(errorMessage(error, 'Não foi possível marcar a entrada como recebida.'))
    }
  }

  function handleCancelForm() {
    setFormError(null)
    setMode({ type: 'list' })
  }

  if (mode.type === 'create' || mode.type === 'edit') {
    return (
      <div className="entradas-page">
        <PageHeader title={mode.type === 'create' ? 'Nova entrada' : 'Editar entrada'} />
        <EntradaForm
          // Mesmo motivo do key em DespesasPage: <select> não-controlado do RHF só aplica
          // o valor inicial contra as options que já existem no primeiro render.
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
    <div className="entradas-page">
      <PageHeader
        title="Entradas"
        action={
          <Button type="button" onClick={() => setMode({ type: 'create' })}>
            <Plus size={16} aria-hidden="true" />
            Nova entrada
          </Button>
        }
      />
      <FormError message={loadError} />
      {!loading && (
        <EntradasList
          entries={entries}
          accounts={allAccounts}
          categories={categories}
          filters={filters}
          onFiltersChange={setFilters}
          onEdit={(entry) => setMode({ type: 'edit', entry })}
          onDelete={handleDelete}
          onMarkAsReceived={handleMarkAsReceived}
        />
      )}
    </div>
  )
}
