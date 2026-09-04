import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { ApiError } from '../../services/api'
import { centsToBRL } from '../../utils/currency'
import { formatDateBR, formatReferenceMonth } from '../../utils/date'
import { cartoesService } from '../cartoes/cartoes.service'
import type { CreditCard } from '../cartoes/cartoes.types'
import { contasService } from '../contas/contas.service'
import type { Account } from '../contas/contas.types'
import { InvoiceStatusBadge } from './InvoiceStatusBadge'
import { PagarFaturaForm } from './PagarFaturaForm'
import type { PayFormData } from './pagamento.schema'
import { faturasService } from './faturas.service'
import type { InvoiceDetail } from './faturas.types'
import './FaturaDetalhePage.css'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function FaturaDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [card, setCard] = useState<CreditCard | null>(null)
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([])
  const [allAccounts, setAllAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
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
        const invoiceResult = await faturasService.getById(id as string)
        const [cardResult, activeAccountsResult, allAccountsResult] = await Promise.all([
          cartoesService.getById(invoiceResult.credit_card_id),
          contasService.list('active'),
          contasService.list('all'),
        ])
        if (active) {
          setInvoice(invoiceResult)
          setCard(cardResult)
          setActiveAccounts(activeAccountsResult)
          setAllAccounts(allAccountsResult)
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          navigate('/faturas', { replace: true, state: { error: 'Fatura não encontrada.' } })
          return
        }
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar a fatura.'))
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

  async function handlePay(data: PayFormData) {
    if (!id) return
    setSubmitting(true)
    setFormError(null)
    try {
      await faturasService.pay(id, data)
      // Recarrega tudo do servidor — status, itens e o novo registro de pagamento.
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="fatura-detalhe-page" />
  }

  if (!invoice || !card) {
    return (
      <div className="fatura-detalhe-page">
        <FormError message={loadError ?? 'Não foi possível carregar a fatura.'} />
      </div>
    )
  }

  const paymentAccount = invoice.payment
    ? allAccounts.find((account) => account.id === invoice.payment?.account_id)
    : undefined

  return (
    <div className="fatura-detalhe-page">
      <Link to="/faturas" className="fatura-detalhe-page__back">
        ← Faturas
      </Link>
      <PageHeader title={card.name} />
      <div className="fatura-detalhe-page__meta">
        <span>{formatReferenceMonth(invoice.reference_month)}</span>
        <InvoiceStatusBadge status={invoice.displayStatus} />
      </div>
      <div className="fatura-detalhe-page__total">{centsToBRL(invoice.totalCents)}</div>

      <h2 className="fatura-detalhe-page__section-title">Itens</h2>
      {invoice.items.length === 0 ? (
        <p className="fatura-detalhe-page__empty">Nenhum item nessa fatura.</p>
      ) : (
        <ul className="fatura-detalhe-page__items">
          {invoice.items.map((item, index) => (
            <li key={`${item.description}-${index}`} className="fatura-detalhe-page__item-row">
              <div className="fatura-detalhe-page__item-info">
                <span className="fatura-detalhe-page__item-description">{item.description}</span>
                <span className="fatura-detalhe-page__item-meta">
                  {item.category_icon ?? '📁'} {item.category_name} · Parcela{' '}
                  {item.installment_number}/{item.installments_count}
                </span>
              </div>
              <span className="fatura-detalhe-page__item-amount">
                {centsToBRL(item.amount_cents)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {invoice.displayStatus !== 'paid' ? (
        <PagarFaturaForm
          accounts={activeAccounts}
          error={formError}
          submitting={submitting}
          onSubmit={handlePay}
        />
      ) : (
        <div className="fatura-detalhe-page__paid-confirmation">
          <p className="fatura-detalhe-page__paid-title">Fatura paga</p>
          {invoice.payment && (
            <>
              <p>Data do pagamento: {formatDateBR(invoice.payment.payment_date)}</p>
              <p>Conta: {paymentAccount?.name ?? 'Conta removida'}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
