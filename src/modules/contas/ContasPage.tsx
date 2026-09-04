import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { ApiError } from '../../services/api'
import { ContaForm } from './ContaForm'
import { ContasList } from './ContasList'
import { contasService } from './contas.service'
import type { CreateContaFormData } from './contas.schemas'
import type { Account, AccountStatusFilter } from './contas.types'
import './ContasPage.css'

type Mode = { type: 'list' } | { type: 'create' } | { type: 'edit'; account: Account }

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function ContasPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [statusFilter, setStatusFilter] = useState<AccountStatusFilter>('active')
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>({ type: 'list' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  // Bump pra forçar o efeito abaixo a recarregar depois de criar/editar/arquivar, sem
  // chamar setState direto num useEffect a partir de uma função externa (regra do
  // eslint-plugin-react-hooks) — mesmo padrão do AuthContext (função async local ao efeito).
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const result = await contasService.list(statusFilter)
        if (active) {
          setAccounts(result)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar as contas.'))
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
  }, [statusFilter, refreshKey])

  async function handleCreate(data: CreateContaFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await contasService.create(data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string, data: CreateContaFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await contasService.update(id, data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleArchive(account: Account) {
    try {
      await contasService.archive(account.id)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setLoadError(errorMessage(error, 'Não foi possível arquivar a conta.'))
    }
  }

  async function handleActivate(account: Account) {
    try {
      await contasService.activate(account.id)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setLoadError(errorMessage(error, 'Não foi possível reativar a conta.'))
    }
  }

  function handleCancelForm() {
    setFormError(null)
    setMode({ type: 'list' })
  }

  if (mode.type === 'create' || mode.type === 'edit') {
    return (
      <div className="contas-page">
        <h1 className="contas-page__title">
          {mode.type === 'create' ? 'Nova conta' : 'Editar conta'}
        </h1>
        <ContaForm
          initialData={mode.type === 'edit' ? mode.account : undefined}
          error={formError}
          submitting={submitting}
          onCancel={handleCancelForm}
          onSubmit={(data) =>
            mode.type === 'edit' ? handleUpdate(mode.account.id, data) : handleCreate(data)
          }
        />
      </div>
    )
  }

  return (
    <div className="contas-page">
      <div className="contas-page__header">
        <h1 className="contas-page__title">Contas</h1>
        <Button type="button" onClick={() => setMode({ type: 'create' })}>
          <Plus size={16} aria-hidden="true" />
          Nova conta
        </Button>
      </div>
      <FormError message={loadError} />
      {!loading && (
        <ContasList
          accounts={accounts}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onEdit={(account) => setMode({ type: 'edit', account })}
          onArchive={handleArchive}
          onActivate={handleActivate}
        />
      )}
    </div>
  )
}
