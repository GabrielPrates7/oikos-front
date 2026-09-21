import type { ReactNode } from 'react'
import './ListFilterRow.css'

interface ListFilterRowProps {
  // Nome acessível da linha (ex.: "Situação e classificação").
  label: string
  children: ReactNode
}

// Linha extra DENTRO do painel de filtros de Entradas/Despesas, abaixo da linha atual e
// separada dela por um divisor sutil. Cada filho é um grupo com rótulo pequeno (o
// SegmentedControl já traz o dele).
export function ListFilterRow({ label, children }: ListFilterRowProps) {
  return (
    <div className="list-filter-row" role="group" aria-label={label}>
      {children}
    </div>
  )
}
