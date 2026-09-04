import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { ApiError } from '../../services/api'
import { CartaoForm } from './CartaoForm'
import { CartoesList } from './CartoesList'
import { cartoesService } from './cartoes.service'
import type { CreateCartaoFormData } from './cartoes.schemas'
import type { CreditCard, CreditCardStatusFilter } from './cartoes.types'
import './CartoesPage.css'

type Mode = { type: 'list' } | { type: 'create' } | { type: 'edit'; card: CreditCard }

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function CartoesPage() {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [statusFilter, setStatusFilter] = useState<CreditCardStatusFilter>('active')
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
        const result = await cartoesService.list(statusFilter)
        if (active) {
          setCards(result)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar os cartões.'))
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

  async function handleCreate(data: CreateCartaoFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await cartoesService.create(data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string, data: CreateCartaoFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await cartoesService.update(id, data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleArchive(card: CreditCard) {
    try {
      await cartoesService.archive(card.id)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setLoadError(errorMessage(error, 'Não foi possível arquivar o cartão.'))
    }
  }

  async function handleActivate(card: CreditCard) {
    try {
      await cartoesService.activate(card.id)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setLoadError(errorMessage(error, 'Não foi possível reativar o cartão.'))
    }
  }

  function handleCancelForm() {
    setFormError(null)
    setMode({ type: 'list' })
  }

  if (mode.type === 'create' || mode.type === 'edit') {
    return (
      <div className="cartoes-page">
        <PageHeader title={mode.type === 'create' ? 'Novo cartão' : 'Editar cartão'} />
        <CartaoForm
          initialData={mode.type === 'edit' ? mode.card : undefined}
          error={formError}
          submitting={submitting}
          onCancel={handleCancelForm}
          onSubmit={(data) =>
            mode.type === 'edit' ? handleUpdate(mode.card.id, data) : handleCreate(data)
          }
        />
      </div>
    )
  }

  return (
    <div className="cartoes-page">
      <PageHeader
        title="Cartões"
        action={
          <Button type="button" onClick={() => setMode({ type: 'create' })}>
            <Plus size={16} aria-hidden="true" />
            Novo cartão
          </Button>
        }
      />
      <FormError message={loadError} />
      {!loading && (
        <CartoesList
          cards={cards}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onEdit={(card) => setMode({ type: 'edit', card })}
          onArchive={handleArchive}
          onActivate={handleActivate}
        />
      )}
    </div>
  )
}
