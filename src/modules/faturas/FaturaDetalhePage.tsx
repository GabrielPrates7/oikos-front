import { Receipt, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { CategoryBadge } from '../../components/ui/CategoryBadge'
import { EssentialBadge } from '../../components/ui/EssentialBadge'
import { Pagination } from '../../components/ui/Pagination'
import { ApiError } from '../../services/api'
import { assignCategoryColors } from '../../utils/chartColors'
import { centsToBRL } from '../../utils/currency'
import { formatDateBR, formatReferenceMonth } from '../../utils/date'
import { DEFAULT_PAGE_SIZE, totalPages } from '../../utils/pagination'
import { categoriasService } from '../categorias/categorias.service'
import type { Category } from '../categorias/categorias.types'
import { FALLBACK_COLOR, getBankColor } from '../../utils/bankColors'
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

// 409 = pagamento já processado/cancelado por outra requisição (duplo clique, outra aba) —
// mensagem específica; 404 e demais erros usam a mensagem padrão do backend (errorMessage).
function cancelPaymentErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) {
    return 'Este pagamento já foi processado ou cancelado, atualize a página.'
  }
  return errorMessage(error, 'Não foi possível cancelar o pagamento.')
}

export function FaturaDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [card, setCard] = useState<CreditCard | null>(null)
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([])
  const [allAccounts, setAllAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  // Busca client-side por descricao: a fatura ja vem com todos os itens; mes/ano/cartao nao
  // fazem sentido aqui (e uma fatura especifica).
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  // Cancelar pagamento: confirmação em duas etapas (mesmo padrão de Cartões/Contas/FaturasList).
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [cancelingPayment, setCancelingPayment] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const invoiceResult = await faturasService.getById(id as string)
        const [cardResult, activeAccountsResult, allAccountsResult, categoriesResult] =
          await Promise.all([
            cartoesService.getById(invoiceResult.credit_card_id),
            contasService.list('active'),
            contasService.list('all'),
            categoriasService.list('expense'),
          ])
        if (active) {
          setInvoice(invoiceResult)
          setCard(cardResult)
          setActiveAccounts(activeAccountsResult)
          setAllAccounts(allAccountsResult)
          setCategories(categoriesResult)
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

  function handleRequestCancelPayment() {
    setCancelError(null)
    setConfirmingCancel(true)
  }

  function handleDismissCancelPayment() {
    setConfirmingCancel(false)
  }

  async function handleConfirmCancelPayment() {
    if (!id) return
    setCancelingPayment(true)
    setCancelError(null)
    try {
      await faturasService.cancelPayment(id)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setCancelError(cancelPaymentErrorMessage(error))
    } finally {
      setCancelingPayment(false)
      setConfirmingCancel(false)
    }
  }

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

  const items = invoice?.items
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!items) return []
    return query ? items.filter((item) => item.description.toLowerCase().includes(query)) : items
  }, [items, search])

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

  // Em LOTE com a lista completa de categorias de despesa: mesmo calculo do Historico de
  // compras, entao a cor de cada categoria bate entre as duas telas.
  const categoryColors = assignCategoryColors(categories.map((category) => category.name))
  const pages = totalPages(filteredItems.length, DEFAULT_PAGE_SIZE)
  const currentPage = Math.min(page, Math.max(1, pages))
  const visibleItems = filteredItems.slice(
    (currentPage - 1) * DEFAULT_PAGE_SIZE,
    currentPage * DEFAULT_PAGE_SIZE,
  )

  // Cor do banco no título (nome do cartão = nome do banco). Banco desconhecido fica com a
  // cor padrão do título em vez de virar o verde de fallback do getBankColor.
  const resolvedBankColor = getBankColor(card.name)
  const bankTitleColor = resolvedBankColor === FALLBACK_COLOR ? undefined : resolvedBankColor.base

  const paymentAccount = invoice.payment
    ? allAccounts.find((account) => account.id === invoice.payment?.account_id)
    : undefined

  return (
    <div className="fatura-detalhe-page">
      <Link to="/faturas" className="fatura-detalhe-page__back">
        ← Faturas
      </Link>
      <PageHeader
        title={card.name}
        titleColor={bankTitleColor}
        icon={<Receipt size={22} aria-hidden="true" />}
      />
      <div className="fatura-detalhe-page__meta">
        <span>{formatReferenceMonth(invoice.reference_month)}</span>
        <InvoiceStatusBadge status={invoice.displayStatus} />
      </div>
      <div className="fatura-detalhe-page__total-row">
        <div className="fatura-detalhe-page__total">{centsToBRL(invoice.totalCents)}</div>
        <Link to={`/cartoes/${card.id}`} className="fatura-detalhe-page__card-link">
          Ver no cartão
        </Link>
      </div>

      <h2 className="fatura-detalhe-page__section-title">Itens</h2>
      {invoice.items.length === 0 ? (
        <p className="fatura-detalhe-page__empty">Nenhum item nessa fatura.</p>
      ) : (
        <>
          <div className="fatura-detalhe-page__filters">
            <div className="fatura-detalhe-page__search-field">
              <label htmlFor="fatura-search">Buscar</label>
              <div className="fatura-detalhe-page__search-input">
                <Search size={14} aria-hidden="true" />
                <input
                  id="fatura-search"
                  type="text"
                  placeholder="Buscar por descrição..."
                  value={search}
                  onChange={(event) => {
                    setPage(1)
                    setSearch(event.target.value)
                  }}
                />
              </div>
            </div>
          </div>
          {filteredItems.length === 0 ? (
            <p className="fatura-detalhe-page__empty">Nenhum item encontrado com essa busca.</p>
          ) : (
            <>
              <div className="fatura-detalhe-page__list-wrap">
                <ul className="fatura-detalhe-page__items">
                  {visibleItems.map((item, index) => (
                    <li
                      key={`${item.description}-${index}`}
                      className="fatura-detalhe-page__item-row"
                    >
                      <div className="fatura-detalhe-page__item-info">
                        <div className="fatura-detalhe-page__item-description-row">
                          <span className="fatura-detalhe-page__item-description">
                            {item.description}
                          </span>
                          <EssentialBadge isEssential={item.is_essential} />
                        </div>
                        <span className="fatura-detalhe-page__item-meta">
                          <CategoryBadge
                            name={item.category_name}
                            icon={item.category_icon}
                            color={
                              categoryColors.get(item.category_name) ?? 'var(--color-text-muted)'
                            }
                          />
                          <span>
                            Parcela {item.installment_number}/{item.installments_count}
                          </span>
                        </span>
                      </div>
                      <span className="fatura-detalhe-page__item-amount">
                        {centsToBRL(item.amount_cents)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <Pagination
                page={currentPage}
                totalPages={pages}
                onPageChange={setPage}
                totalItems={filteredItems.length}
                pageSize={DEFAULT_PAGE_SIZE}
                itemLabel="itens"
                alwaysShow
              />
            </>
          )}
        </>
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
          <FormError message={cancelError} />
          {confirmingCancel ? (
            <div className="fatura-detalhe-page__cancel-confirm">
              <p>
                Cancelar o pagamento desta fatura? O valor volta para a conta de origem e a fatura
                volta a &quot;Aberta&quot; ou &quot;Atrasada&quot;.
              </p>
              <div className="fatura-detalhe-page__cancel-confirm-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDismissCancelPayment}
                  disabled={cancelingPayment}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleConfirmCancelPayment()}
                  disabled={cancelingPayment}
                >
                  {cancelingPayment ? 'Cancelando...' : 'Cancelar pagamento'}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="fatura-detalhe-page__cancel-trigger"
              onClick={handleRequestCancelPayment}
            >
              Cancelar pagamento
            </button>
          )}
        </div>
      )}
    </div>
  )
}
