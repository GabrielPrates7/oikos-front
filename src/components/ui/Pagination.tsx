import { Button } from './Button'
import './Pagination.css'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

// Some sozinho quando cabe tudo numa página só — não faz sentido mostrar "Página 1 de 1"
// com dois botões desabilitados pra uma lista curta.
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

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
