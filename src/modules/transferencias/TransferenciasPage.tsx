import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { ApiError } from '../../services/api'
import { contasService } from '../contas/contas.service'
import type { Account } from '../contas/contas.types'
import { TransferenciaForm } from './TransferenciaForm'
import { TransferenciasList } from './TransferenciasList'
import { transferenciasService } from './transferencias.service'
import type { CreateTransferenciaFormData } from './transferencias.schemas'
import type { Transfer, TransferFilters } from './transferencias.types'
import './TransferenciasPage.css'

type Mode = { type: 'list' } | { type: 'create' }

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function TransferenciasPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([])
  const [allAccounts, setAllAccounts] = useState<Account[]>([])
  const [filters, setFilters] = useState<TransferFilters>({})
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>({ type: 'list' })
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
        const result = await transferenciasService.list(filters)
        if (active) {
          setTransfers(result)
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
  }, [filters, refreshKey])

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
        <h1 className="transferencias-page__title">Nova transferência</h1>
        <TransferenciaForm
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
      <div className="transferencias-page__header">
        <h1 className="transferencias-page__title">Transferências</h1>
        <Button type="button" onClick={() => setMode({ type: 'create' })}>
          <Plus size={16} aria-hidden="true" />
          Nova transferência
        </Button>
      </div>
      <FormError message={loadError} />
      {!loading && (
        <TransferenciasList
          transfers={transfers}
          accounts={allAccounts}
          filters={filters}
          onFiltersChange={setFilters}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
