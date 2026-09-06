import { centsToBRL } from '../../utils/currency'
import './ListTotal.css'

interface ListTotalItem {
  label: string
  valueCents: number
}

interface ListTotalProps {
  items: ListTotalItem[]
}

// Destaque sutil — bem menor que o saldo do Dashboard (44px), só o bastante pra separar
// visualmente do resto da lista sem competir com os filtros acima. Aceita mais de um item
// pra telas como Cartões, que mostram 3 totais lado a lado.
export function ListTotal({ items }: ListTotalProps) {
  return (
    <div className="list-total">
      {items.map((item) => (
        <div key={item.label} className="list-total__item">
          <span className="list-total__label">{item.label}</span>
          <span className="list-total__value">{centsToBRL(item.valueCents)}</span>
        </div>
      ))}
    </div>
  )
}
