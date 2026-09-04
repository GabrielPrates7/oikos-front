import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormError } from '../../components/feedback/FormError'
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

type Mode = { type: 'list' } | { type: 'create' } | { type: 'edit'; entry: IncomeEntry }

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function EntradasPage() {
  const [entries, setEntries] = useState<IncomeEntry[]>([])
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([])
  const [allAccounts, setAllAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filters, setFilters] = useState<IncomeEntryFilters>({})
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>({ type: 'list' })
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

  function handleCancelForm() {
    setFormError(null)
    setMode({ type: 'list' })
  }

  if (mode.type === 'create' || mode.type === 'edit') {
    return (
      <div className="entradas-page">
        <h1 className="entradas-page__title">
          {mode.type === 'create' ? 'Nova entrada' : 'Editar entrada'}
        </h1>
        <EntradaForm
          initialData={mode.type === 'edit' ? mode.entry : undefined}
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
      <div className="entradas-page__header">
        <h1 className="entradas-page__title">Entradas</h1>
        <Button type="button" onClick={() => setMode({ type: 'create' })}>
          <Plus size={16} aria-hidden="true" />
          Nova entrada
        </Button>
      </div>
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
        />
      )}
    </div>
  )
}
