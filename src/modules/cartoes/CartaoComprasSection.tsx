import { Copy, Edit2, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CategoryBadge } from '../../components/ui/CategoryBadge'
import { Combobox } from '../../components/ui/Combobox'
import { EssentialBadge } from '../../components/ui/EssentialBadge'
import { Pagination } from '../../components/ui/Pagination'
import { NotesText, NotesToggle } from '../../components/ui/RowNotes'
import { useOpenNotes } from '../../components/ui/useOpenNotes'
import { assignCategoryColors } from '../../utils/chartColors'
import { centsToBRL } from '../../utils/currency'
import {
  currentMonthString,
  formatDateBR,
  MONTH_NAMES_PT,
  splitMonthString,
} from '../../utils/date'
import { DEFAULT_PAGE_SIZE, totalPages } from '../../utils/pagination'
import type { Category } from '../categorias/categorias.types'
import type { Purchase, PurchasePaymentStatus } from '../compras/compras.types'
import { PurchaseStatusBadge } from './PurchaseStatusBadge'
import './CartaoComprasSection.css'

interface CartaoComprasSectionProps {
  purchases: Purchase[]
  categories: Category[]
  confirmingDeleteId: string | null
  onDuplicate: (purchase: Purchase) => void
  onEdit: (purchase: Purchase) => void
  onDelete: (purchase: Purchase) => void
  onCancelDelete: () => void
}

interface Filters {
  search: string
  categoryId: string
  status: '' | PurchasePaymentStatus
  month: string
  year: string
  from: string
  to: string
}

// Mês/Ano abrem no mês e ano ATUAIS (mesma auto-detecção de Entradas/Despesas, via
// currentMonthString) — "Todos" continua disponível nas duas listas pra ver o histórico
// inteiro. Calculado por chamada (não constante de módulo) pra não ficar preso na data em
// que o app foi carregado.
function defaultFilters(): Filters {
  const { year, monthNum } = splitMonthString(currentMonthString())
  return { search: '', categoryId: '', status: '', month: monthNum, year, from: '', to: '' }
}

// Meses em que a compra "existe": o da própria compra + o de cada fatura onde há parcela dela
// (installment_months). Uma compra de 12x em jun/2026 vive em jun/2026..mai/2027 — filtrar e
// listar anos só pela purchase_date escondia 2027 inteiro. A data da compra continua na união
// (não só as parcelas): uma compra de 28/12 cuja 1ª parcela cai na fatura de jan/2027 ainda
// aparece em dez/2026.
function purchaseMonths(purchase: Purchase): string[] {
  return [purchase.purchase_date.slice(0, 7), ...purchase.installment_months]
}

// GET /credit-cards/:id/purchases devolve o histórico INTEIRO do cartão, sem filtro nem
// paginação no servidor — então busca, filtros e paginação aqui são todos client-side (o
// volume de compras de um único cartão comporta isso, mesma decisão da busca de
// Entradas/Despesas).
export function CartaoComprasSection({
  purchases,
  categories,
  confirmingDeleteId,
  onDuplicate,
  onEdit,
  onDelete,
  onCancelDelete,
}: CartaoComprasSectionProps) {
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [page, setPage] = useState(1)

  function handleFilterChange(patch: Partial<Filters>) {
    onCancelDelete()
    setPage(1)
    setFilters((current) => ({ ...current, ...patch }))
  }

  const defaults = defaultFilters()
  // Mês/Ano no valor padrão (atual) não contam como filtro ativo — só desvios deles.
  const hasFilters =
    filters.search !== '' ||
    filters.categoryId !== '' ||
    filters.status !== '' ||
    filters.month !== defaults.month ||
    filters.year !== defaults.year ||
    filters.from !== '' ||
    filters.to !== ''
  // Em LOTE com a lista completa — mesmo motivo de EntradasList (evita colisão de cor).
  const categoryColors = assignCategoryColors(categories.map((category) => category.name))

  const years = useMemo(
    () =>
      // Anos com compra OU parcela/fatura real deste cartão, mais o ano atual (senão o valor
      // padrão do select não teria <option> — mesma regra de EntradasPage/DespesasPage).
      Array.from(
        new Set([
          defaultFilters().year,
          ...purchases.flatMap((purchase) => purchaseMonths(purchase).map((ym) => ym.slice(0, 4))),
        ]),
      ).sort((a, b) => b.localeCompare(a)),
    [purchases],
  )

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase()
    return purchases.filter((purchase) => {
      if (query && !purchase.description.toLowerCase().includes(query)) return false
      if (filters.categoryId && purchase.category_id !== filters.categoryId) return false
      if (filters.status && purchase.payment_status !== filters.status) return false
      // De/Até explícitos sempre ganham de Mês/Ano (mesma regra de Entradas/Despesas: quem
      // digita um intervalo está pedindo aquele intervalo, não o mês do seletor).
      if (filters.from || filters.to) {
        if (filters.from && purchase.purchase_date < filters.from) return false
        if (filters.to && purchase.purchase_date > filters.to) return false
        return true
      }
      // Mês E ano precisam bater no MESMO mês da compra/parcela (não um mês numa parcela e o
      // ano em outra).
      if (filters.year || filters.month) {
        return purchaseMonths(purchase).some(
          (ym) =>
            (!filters.year || ym.slice(0, 4) === filters.year) &&
            (!filters.month || ym.slice(5, 7) === filters.month),
        )
      }
      return true
    })
  }, [purchases, filters])

  const pages = totalPages(filtered.length, DEFAULT_PAGE_SIZE)
  const currentPage = Math.min(page, Math.max(1, pages))
  const visible = filtered.slice(
    (currentPage - 1) * DEFAULT_PAGE_SIZE,
    currentPage * DEFAULT_PAGE_SIZE,
  )

  const notes = useOpenNotes()

  return (
    <section className="cartao-compras">
      <h2 className="cartao-compras__title">Histórico de compras</h2>

      {purchases.length > 0 && (
        <div className="cartao-compras__filters">
          <div className="cartao-compras__filter-field cartao-compras__filter-field--search">
            <label htmlFor="compras-search">Buscar</label>
            <div className="cartao-compras__search-input">
              <Search size={14} aria-hidden="true" />
              <input
                id="compras-search"
                type="text"
                placeholder="Buscar por descrição..."
                value={filters.search}
                onChange={(event) => handleFilterChange({ search: event.target.value })}
              />
            </div>
          </div>
          <div className="cartao-compras__filter-field">
            <label htmlFor="compras-category">Categoria</label>
            <Combobox
              id="compras-category"
              value={filters.categoryId}
              onChange={(value) => handleFilterChange({ categoryId: value })}
              options={[
                { value: '', label: 'Todas' },
                ...categories.map((category) => ({
                  value: category.id,
                  label: `${category.icon ?? '📁'} ${category.name}`,
                })),
              ]}
            />
          </div>
          <div className="cartao-compras__filter-field">
            <label htmlFor="compras-status">Status</label>
            <select
              id="compras-status"
              value={filters.status}
              onChange={(event) =>
                handleFilterChange({ status: event.target.value as Filters['status'] })
              }
            >
              <option value="">Todos</option>
              <option value="paid">Paga</option>
              <option value="pending">Em aberto</option>
            </select>
          </div>
          <div className="cartao-compras__filter-field">
            <label htmlFor="compras-month">Mês</label>
            <select
              id="compras-month"
              value={filters.month}
              onChange={(event) => handleFilterChange({ month: event.target.value })}
            >
              <option value="">Todos</option>
              {MONTH_NAMES_PT.map((name, index) => (
                <option key={name} value={String(index + 1).padStart(2, '0')}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="cartao-compras__filter-field">
            <label htmlFor="compras-year">Ano</label>
            <select
              id="compras-year"
              value={filters.year}
              onChange={(event) => handleFilterChange({ year: event.target.value })}
            >
              <option value="">Todos</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="cartao-compras__filter-field">
            <label htmlFor="compras-from">De</label>
            <input
              id="compras-from"
              type="date"
              value={filters.from}
              onChange={(event) => handleFilterChange({ from: event.target.value })}
            />
          </div>
          <div className="cartao-compras__filter-field">
            <label htmlFor="compras-to">Até</label>
            <input
              id="compras-to"
              type="date"
              value={filters.to}
              onChange={(event) => handleFilterChange({ to: event.target.value })}
            />
          </div>
          {hasFilters && (
            <button
              type="button"
              className="cartao-compras__clear-filters"
              onClick={() => {
                onCancelDelete()
                setPage(1)
                setFilters(defaultFilters())
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {purchases.length === 0 ? (
        <div className="cartao-compras__empty">
          <p>Nenhuma compra registrada nesse cartão ainda.</p>
          <p>Crie a primeira compra pra começar a acompanhar o uso do limite.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cartao-compras__empty">
          <p>Nenhuma compra encontrada com esses filtros.</p>
        </div>
      ) : (
        <>
          <div className="cartao-compras__list-wrap">
            <ul className="cartao-compras__list">
              {visible.map((purchase) => {
                const isConfirmingDelete = confirmingDeleteId === purchase.id
                return (
                  <li key={purchase.id} className="cartao-compras__row">
                    <span className="cartao-compras__date">
                      {formatDateBR(purchase.purchase_date)}
                    </span>
                    <div className="cartao-compras__info">
                      <div className="cartao-compras__description-row">
                        <span className="cartao-compras__description">{purchase.description}</span>
                        {purchase.notes && (
                          <NotesToggle
                            panelId={`notes-${purchase.id}`}
                            open={notes.isOpen(purchase.id)}
                            onToggle={() => notes.toggle(purchase.id)}
                          />
                        )}
                        <EssentialBadge isEssential={purchase.is_essential} />
                        <PurchaseStatusBadge status={purchase.payment_status} />
                      </div>
                      <span className="cartao-compras__meta">
                        <CategoryBadge
                          name={purchase.category_name}
                          icon={purchase.category_icon}
                          color={
                            categoryColors.get(purchase.category_name) ?? 'var(--color-text-muted)'
                          }
                        />
                        <span>{purchase.installments_count}x</span>
                      </span>
                    </div>
                    <span className="cartao-compras__amount">
                      {centsToBRL(purchase.total_amount_cents)}
                    </span>
                    <div className="cartao-compras__actions">
                      {isConfirmingDelete ? (
                        <>
                          <button
                            type="button"
                            className="cartao-compras__confirm-delete"
                            onClick={() => onDelete(purchase)}
                          >
                            Confirmar exclusão?
                          </button>
                          <button
                            type="button"
                            className="cartao-compras__cancel-delete"
                            onClick={onCancelDelete}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            aria-label={`Duplicar ${purchase.description}`}
                            onClick={() => onDuplicate(purchase)}
                          >
                            <Copy size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Editar ${purchase.description}`}
                            onClick={() => onEdit(purchase)}
                          >
                            <Edit2 size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Excluir ${purchase.description}`}
                            onClick={() => onDelete(purchase)}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                    {purchase.notes && (
                      <div
                        id={`notes-${purchase.id}`}
                        className="notes-panel"
                        hidden={!notes.isOpen(purchase.id)}
                      >
                        <NotesText notes={purchase.notes} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
          <Pagination
            page={currentPage}
            totalPages={pages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={DEFAULT_PAGE_SIZE}
            itemLabel="compras"
            alwaysShow
          />
        </>
      )}
    </section>
  )
}
