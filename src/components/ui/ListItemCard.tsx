import type { ReactNode } from 'react'
import './ListItemCard.css'

interface ListItemCardProps {
  // Coluna fixa à esquerda (data). ReactNode pra caber texto simples sempre formatado igual.
  date: ReactNode
  title: ReactNode
  // Selos/toggle inline ao lado do título (NotesToggle, Fixa, Essencial/Supérfluo, Pendente,
  // Pagamento de fatura, status de compra etc.) — cada lista monta o que já mostra hoje.
  badges?: ReactNode
  // Linha de metadados abaixo do título (categoria, conta, parcelas...). Livre de propósito:
  // Entradas usa CategoryBadge, Despesas usa texto simples — o cartão não impõe formato.
  meta?: ReactNode
  amount: ReactNode
  amountTone: 'income' | 'expense'
  // Botões/links de ação, ou o par "Confirmar exclusão?"/"Cancelar" — também livre: uma
  // lista pode não ter ação nenhuma (linha de pagamento de fatura).
  actions?: ReactNode
  // Painel de observação expandido (reusa a classe compartilhada `.notes-panel`, que já
  // quebra pra linha inteira dentro do flex-wrap da linha).
  notesPanel?: ReactNode
  // Tinta de fundo + barra lateral (linha pendente). Ausente = sem tinta (Compras não usa).
  tint?: 'gold' | 'expense'
}

// Cartão de linha genérico, extraído do "Histórico de compras" (CartaoComprasSection) pra
// ser reusado nas listas mobile de Entradas e Despesas. Mesma forma sempre: data à esquerda,
// bloco de título+selos+metadados no meio, valor à direita, ações no fim — o conteúdo de
// cada slot é decidido por quem chama, não por este componente.
export function ListItemCard({
  date,
  title,
  badges,
  meta,
  amount,
  amountTone,
  actions,
  notesPanel,
  tint,
}: ListItemCardProps) {
  return (
    <li className={`list-item-card${tint ? ` list-item-card--tint-${tint}` : ''}`}>
      <span className="list-item-card__date">{date}</span>
      <div className="list-item-card__info">
        <div className="list-item-card__title-row">
          <span className="list-item-card__title">{title}</span>
          {badges}
        </div>
        {meta && <div className="list-item-card__meta">{meta}</div>}
      </div>
      <span className={`list-item-card__amount list-item-card__amount--${amountTone}`}>
        {amount}
      </span>
      <div className="list-item-card__actions">{actions}</div>
      {notesPanel}
    </li>
  )
}
