import type { ReactNode } from 'react'
import { centsToBRL } from '../../utils/currency'
import './GlassStatCards.css'

interface GlassStatCardItem {
  label: string
  valueCents?: number
  // Valor já formatado (ex.: "42,5%") — tem prioridade sobre valueCents.
  valueText?: string
  // Cor do valor (ex.: resultado negativo em terracota); sem ela, mantém a cor padrão.
  valueColor?: string
  icon: ReactNode
  // Opcionais (Relatórios > Visão Geral): tooltip do rótulo, cor do ícone e uma linha extra
  // abaixo do valor (ex.: variação vs mês anterior). Quem não passa nada renderiza igual a antes.
  labelTitle?: string
  iconColor?: string
  footer?: ReactNode
  // Opcional (Plano do mês): acessório ao lado do rótulo (ex.: botão "?" com explicação). Sem ele o
  // DOM é idêntico ao de antes.
  labelAccessory?: ReactNode
}

interface GlassStatCardsProps {
  items: GlassStatCardItem[]
}

// Cards pequenos de vidro fosco, todos com o mesmo peso — mesma receita visual dos 3 cards
// de resumo de Despesas (DespesasTotalCards), sem o destaque vermelho de "Geral". Usado em
// Cartões (Limite/Disponível/Usado), onde os três valores valem igual.
export function GlassStatCards({ items }: GlassStatCardsProps) {
  return (
    <div className="glass-stat-cards">
      {items.map((item) => (
        <div key={item.label} className="glass-stat-card">
          <div
            className="glass-stat-card__icon"
            style={item.iconColor ? { color: item.iconColor } : undefined}
          >
            {item.icon}
          </div>
          {item.labelAccessory ? (
            <span className="glass-stat-card__label-row">
              <span className="glass-stat-card__label" title={item.labelTitle}>
                {item.label}
              </span>
              {item.labelAccessory}
            </span>
          ) : (
            <span className="glass-stat-card__label" title={item.labelTitle}>
              {item.label}
            </span>
          )}
          <span
            className="glass-stat-card__value"
            style={item.valueColor ? { color: item.valueColor } : undefined}
          >
            {item.valueText ?? centsToBRL(item.valueCents ?? 0)}
          </span>
          {item.footer}
        </div>
      ))}
    </div>
  )
}
