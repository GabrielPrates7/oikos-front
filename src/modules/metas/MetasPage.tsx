import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { useNavRedirectError } from '../../hooks/useNavRedirectError'
import { ApiError } from '../../services/api'
import { DEFAULT_PAGE_SIZE, totalPages } from '../../utils/pagination'
import { MetaForm } from './MetaForm'
import { MetasList } from './MetasList'
import { metasService } from './metas.service'
import type { CreateMetaFormData } from './metas.schemas'
import type { FinancialGoal } from './metas.types'
import './MetasPage.css'

type Mode = { type: 'list' } | { type: 'create' } | { type: 'edit'; goal: FinancialGoal }

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

const GOAL_WITH_CONTRIBUTIONS_MESSAGE =
  'Esta meta já tem aportes e não pode ser excluída. Acesse o detalhe pra removê-los primeiro.'

export function MetasPage() {
  const navError = useNavRedirectError()
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>({ type: 'list' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const result = await metasService.list({ page, pageSize: DEFAULT_PAGE_SIZE })
        if (active) {
          setGoals(result.items)
          setTotal(result.total)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar as metas.'))
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
  }, [page, refreshKey])

  async function handleCreate(data: CreateMetaFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await metasService.create(data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string, data: CreateMetaFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await metasService.update(id, data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(goal: FinancialGoal) {
    try {
      await metasService.remove(goal.id)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setLoadError(GOAL_WITH_CONTRIBUTIONS_MESSAGE)
        return
      }
      setLoadError(errorMessage(error, 'Não foi possível excluir a meta.'))
    }
  }

  function handleCancelForm() {
    setFormError(null)
    setMode({ type: 'list' })
  }

  if (mode.type === 'create' || mode.type === 'edit') {
    return (
      <div className="metas-page">
        <PageHeader title={mode.type === 'create' ? 'Nova meta' : 'Editar meta'} />
        <MetaForm
          initialData={mode.type === 'edit' ? mode.goal : undefined}
          error={formError}
          submitting={submitting}
          onCancel={handleCancelForm}
          onSubmit={(data) =>
            mode.type === 'edit' ? handleUpdate(mode.goal.id, data) : handleCreate(data)
          }
        />
      </div>
    )
  }

  return (
    <div className="metas-page">
      <PageHeader
        title="Metas"
        action={
          <Button type="button" onClick={() => setMode({ type: 'create' })}>
            <Plus size={16} aria-hidden="true" />
            Nova meta
          </Button>
        }
      />
      <FormError message={navError ?? loadError} />
      {!loading && (
        <MetasList
          goals={goals}
          page={page}
          totalPages={totalPages(total, DEFAULT_PAGE_SIZE)}
          onPageChange={setPage}
          onEdit={(goal) => setMode({ type: 'edit', goal })}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
