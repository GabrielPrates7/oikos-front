import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { ApiError } from '../../services/api'
import { categoriasService } from '../categorias/categorias.service'
import type { Category } from '../categorias/categorias.types'
import { CompraEditForm } from '../compras/CompraEditForm'
import { CompraForm } from '../compras/CompraForm'
import type { CreateCompraFormData, UpdateCompraFormData } from '../compras/compras.schemas'
import type { Purchase } from '../compras/compras.types'
import { CartaoComprasSection } from './CartaoComprasSection'
import { CartaoVisual } from './CartaoVisual'
import { cartoesService } from './cartoes.service'
import type { CreditCard } from './cartoes.types'
import './CartaoDetalhePage.css'
import './HoloBackground.css'

type Mode =
  | { type: 'view' }
  | { type: 'create-purchase'; duplicateFrom?: Purchase }
  | { type: 'edit-purchase'; purchase: Purchase }

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function CartaoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [card, setCard] = useState<CreditCard | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>({ type: 'view' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!id) return
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [cardResult, purchasesResult, categoriesResult, cardsResult] = await Promise.all([
          cartoesService.getById(id as string),
          cartoesService.getPurchaseHistory(id as string),
          categoriasService.list('expense'),
          cartoesService.list('active'),
        ])
        if (active) {
          setCard(cardResult)
          setPurchases(purchasesResult)
          setCategories(categoriesResult)
          setCards(cardsResult)
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          navigate('/cartoes', { replace: true, state: { error: 'Cartão não encontrado.' } })
          return
        }
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar o cartão.'))
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
  }, [id, refreshKey, navigate])

  async function handleCreatePurchase(data: CreateCompraFormData) {
    if (!id) return
    setSubmitting(true)
    setFormError(null)
    try {
      await cartoesService.createPurchase(id, data)
      setMode({ type: 'view' })
      // Recarrega tudo do servidor (limite disponível + histórico) — nunca soma
      // localmente, já que o cálculo de limite depende de installments/invoices.
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdatePurchase(data: UpdateCompraFormData) {
    if (mode.type !== 'edit-purchase') return
    setSubmitting(true)
    setFormError(null)
    try {
      await cartoesService.updatePurchase(
        mode.purchase.id,
        data,
        mode.purchase.has_paid_installment,
      )
      setMode({ type: 'view' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancelForm() {
    setFormError(null)
    setMode({ type: 'view' })
  }

  function handleEditClick(purchase: Purchase) {
    setConfirmingDeleteId(null)
    setActionError(null)
    setFormError(null)
    setMode({ type: 'edit-purchase', purchase })
  }

  // Duplicar nunca edita a compra original — sempre abre o formulário de criação, só
  // pré-preenchido (ver CompraForm.duplicateFrom). Mesmo padrão de DespesasPage/EntradasPage.
  function handleDuplicateClick(purchase: Purchase) {
    setConfirmingDeleteId(null)
    setActionError(null)
    setFormError(null)
    setMode({ type: 'create-purchase', duplicateFrom: purchase })
  }

  function handleDeleteClick(purchase: Purchase) {
    if (confirmingDeleteId === purchase.id) {
      void handleConfirmDelete(purchase)
    } else {
      setConfirmingDeleteId(purchase.id)
      setActionError(null)
    }
  }

  async function handleConfirmDelete(purchase: Purchase) {
    setActionError(null)
    try {
      await cartoesService.deletePurchase(purchase.id)
      setConfirmingDeleteId(null)
      // Idem create/update: recarrega do servidor — exclusão muda limite disponível e o
      // total das faturas que continham essas parcelas.
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setConfirmingDeleteId(null)
      setActionError(errorMessage(error, 'Não foi possível excluir a compra.'))
    }
  }

  if (mode.type === 'create-purchase') {
    return (
      <div className="cartao-detalhe-page holo-bg">
        <PageHeader title="Nova compra" />
        <CompraForm
          categories={categories}
          duplicateFrom={mode.duplicateFrom}
          error={formError}
          submitting={submitting}
          onCancel={handleCancelForm}
          onSubmit={handleCreatePurchase}
        />
      </div>
    )
  }

  if (mode.type === 'edit-purchase') {
    return (
      <div className="cartao-detalhe-page holo-bg">
        <PageHeader title="Editar compra" />
        <CompraEditForm
          purchase={mode.purchase}
          categories={categories}
          cards={cards}
          locked={mode.purchase.has_paid_installment}
          error={formError}
          submitting={submitting}
          onCancel={handleCancelForm}
          onSubmit={handleUpdatePurchase}
        />
      </div>
    )
  }

  if (loading) {
    return <div className="cartao-detalhe-page holo-bg" />
  }

  if (!card) {
    return (
      <div className="cartao-detalhe-page holo-bg">
        <FormError message={loadError ?? 'Não foi possível carregar o cartão.'} />
      </div>
    )
  }

  return (
    <div className="cartao-detalhe-page holo-bg">
      <Link to="/cartoes" className="cartao-detalhe-page__back">
        ← Cartões
      </Link>
      <PageHeader
        title={card.name}
        action={
          card.status === 'active' ? (
            <Button type="button" onClick={() => setMode({ type: 'create-purchase' })}>
              <Plus size={16} aria-hidden="true" />
              Nova compra
            </Button>
          ) : undefined
        }
      />
      <FormError message={loadError} />
      {/* Pedido explícito: contactless nos dois cartões agora (antes só o Nubank,
          decisão revertida). */}
      <CartaoVisual card={card} size="large" hasContactless />
      <div className="cartao-detalhe-page__meta">
        <span>
          Fecha dia {card.closing_day} · Vence dia {card.due_day}
        </span>
      </div>
      <Link to={`/faturas?cartao=${card.id}`} className="cartao-detalhe-page__invoices-link">
        Ver faturas
      </Link>

      <FormError message={actionError} />
      <CartaoComprasSection
        purchases={purchases}
        categories={categories}
        confirmingDeleteId={confirmingDeleteId}
        onDuplicate={handleDuplicateClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onCancelDelete={() => setConfirmingDeleteId(null)}
      />
    </div>
  )
}
