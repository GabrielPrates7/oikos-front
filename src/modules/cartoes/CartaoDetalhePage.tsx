import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { EssentialBadge } from '../../components/ui/EssentialBadge'
import { ApiError } from '../../services/api'
import { centsToBRL } from '../../utils/currency'
import { formatDateBR } from '../../utils/date'
import { categoriasService } from '../categorias/categorias.service'
import type { Category } from '../categorias/categorias.types'
import { CompraForm } from '../compras/CompraForm'
import type { CreateCompraFormData } from '../compras/compras.schemas'
import type { Purchase } from '../compras/compras.types'
import { CartaoVisual } from './CartaoVisual'
import { cartoesService } from './cartoes.service'
import type { CreditCard } from './cartoes.types'
import { PurchaseStatusBadge } from './PurchaseStatusBadge'
import './CartaoDetalhePage.css'

type Mode = { type: 'view' } | { type: 'create-purchase' }

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function CartaoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [card, setCard] = useState<CreditCard | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>({ type: 'view' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!id) return
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [cardResult, purchasesResult, categoriesResult] = await Promise.all([
          cartoesService.getById(id as string),
          cartoesService.getPurchaseHistory(id as string),
          categoriasService.list('expense'),
        ])
        if (active) {
          setCard(cardResult)
          setPurchases(purchasesResult)
          setCategories(categoriesResult)
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

  function handleCancelForm() {
    setFormError(null)
    setMode({ type: 'view' })
  }

  if (mode.type === 'create-purchase') {
    return (
      <div className="cartao-detalhe-page">
        <PageHeader title="Nova compra" />
        <CompraForm
          categories={categories}
          error={formError}
          submitting={submitting}
          onCancel={handleCancelForm}
          onSubmit={handleCreatePurchase}
        />
      </div>
    )
  }

  if (loading) {
    return <div className="cartao-detalhe-page" />
  }

  if (!card) {
    return (
      <div className="cartao-detalhe-page">
        <FormError message={loadError ?? 'Não foi possível carregar o cartão.'} />
      </div>
    )
  }

  return (
    <div className="cartao-detalhe-page">
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
      <CartaoVisual card={card} size="large" />
      <div className="cartao-detalhe-page__meta">
        <span>
          Fecha dia {card.closing_day} · Vence dia {card.due_day}
        </span>
      </div>
      <Link to={`/faturas?cartao=${card.id}`} className="cartao-detalhe-page__invoices-link">
        Ver faturas
      </Link>

      <h2 className="cartao-detalhe-page__section-title">Histórico de compras</h2>
      {purchases.length === 0 ? (
        <div className="cartao-detalhe-page__empty">
          <p>Nenhuma compra registrada nesse cartão ainda.</p>
          <p>Crie a primeira compra pra começar a acompanhar o uso do limite.</p>
        </div>
      ) : (
        <ul className="cartao-detalhe-page__purchases">
          {purchases.map((purchase) => (
            <li key={purchase.id} className="cartao-detalhe-page__purchase-row">
              <span className="cartao-detalhe-page__purchase-date">
                {formatDateBR(purchase.purchase_date)}
              </span>
              <div className="cartao-detalhe-page__purchase-info">
                <div className="cartao-detalhe-page__purchase-description-row">
                  <span className="cartao-detalhe-page__purchase-description">
                    {purchase.description}
                  </span>
                  <EssentialBadge isEssential={purchase.is_essential} />
                  <PurchaseStatusBadge status={purchase.payment_status} />
                </div>
                <span className="cartao-detalhe-page__purchase-meta">
                  {purchase.category_icon ?? '📁'} {purchase.category_name} ·{' '}
                  {purchase.installments_count}x
                </span>
              </div>
              <span className="cartao-detalhe-page__purchase-amount">
                {centsToBRL(purchase.total_amount_cents)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
