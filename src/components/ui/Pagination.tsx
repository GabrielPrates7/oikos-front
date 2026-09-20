import { Button } from './Button'
import './Pagination.css'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  // Opcionais — só Entradas passa isso até agora (pedido do redesign daquela tela: números
  // de página + "Exibindo X de Y"). Sem eles, renderiza exatamente como antes (Anterior/
  // Página X de Y/Próxima), preservando as outras 8 telas que usam este componente.
  totalItems?: number
  pageSize?: number
  itemLabel?: string
  // Default false preserva as outras 8 telas (nenhuma passa isso) — só Entradas ativa, pra
  // manter "Exibindo X de Y entradas" sempre visível mesmo com 1 página só (poucos
  // lançamentos ainda não é motivo pra esconder o resumo, ao contrário das outras listas
  // onde "Página 1 de 1" mesmo é só ruído).
  alwaysShow?: boolean
}

// Janela de números ao redor da página atual — evita uma barra infinita em listas com
// muitas páginas. Sempre mostra a 1ª e a última, com "…" quando há um buraco.
function buildPageWindow(page: number, totalPages: number): (number | 'ellipsis')[] {
  const delta = 1
  const pages: (number | 'ellipsis')[] = []
  const start = Math.max(2, page - delta)
  const end = Math.min(totalPages - 1, page + delta)

  pages.push(1)
  if (start > 2) pages.push('ellipsis')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < totalPages - 1) pages.push('ellipsis')
  if (totalPages > 1) pages.push(totalPages)

  return pages
}

// Some sozinho quando cabe tudo numa página só — não faz sentido mostrar "Página 1 de 1"
// com dois botões desabilitados pra uma lista curta.
export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  itemLabel = 'itens',
  alwaysShow = false,
}: PaginationProps) {
  if (totalPages <= 1 && !alwaysShow) return null

  const showNumbers = totalItems !== undefined && pageSize !== undefined

  if (!showNumbers) {
    return (
      <div className="ui-pagination">
        <Button
          type="button"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <span className="ui-pagination__status">
          Página {page} de {totalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
        </Button>
      </div>
    )
  }

  const rangeStart = (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalItems)

  return (
    <div className="ui-pagination ui-pagination--numbered">
      <span className="ui-pagination__summary">
        Exibindo {rangeStart}–{rangeEnd} de {totalItems} {itemLabel}
      </span>
      <div className="ui-pagination__controls">
        <button
          type="button"
          className="ui-pagination__nav-button"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ‹
        </button>
        {buildPageWindow(page, totalPages).map((entry, index) =>
          entry === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="ui-pagination__ellipsis">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              className={`ui-pagination__page-button ${entry === page ? 'ui-pagination__page-button--active' : ''}`}
              aria-current={entry === page ? 'page' : undefined}
              onClick={() => onPageChange(entry)}
            >
              {entry}
            </button>
          ),
        )}
        <button
          type="button"
          className="ui-pagination__nav-button"
          aria-label="Próxima página"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          ›
        </button>
      </div>
      <span className="ui-pagination__status">
        Página {page} de {totalPages}
      </span>
    </div>
  )
}
