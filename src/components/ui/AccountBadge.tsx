import { FALLBACK_COLOR, getBankColor } from '../../utils/bankColors'
import './CategoryBadge.css'

interface AccountBadgeProps {
  name: string
  bankName: string | null
  color: string | null
}

// Mesma pílula tintada de CategoryBadge (reusa a classe .category-badge — só a fonte da cor
// muda: getBankColor em vez de assignCategoryColors, e sem ícone).
export function AccountBadge({ name, bankName, color }: AccountBadgeProps) {
  // Conta sem cor cadastrada e fora do mapa de bancos cai num cinza neutro fixo, não no
  // verde de destaque do app (FALLBACK_COLOR): o verde parecia "a cor da marca" e destoava
  // em telas com tema próprio (azul em Transferências, vermelho em Despesas).
  const resolved = getBankColor(bankName, color)
  const base = resolved === FALLBACK_COLOR ? 'var(--color-text-muted)' : resolved.base
  return (
    <span
      className="category-badge"
      style={{
        color: base,
        backgroundColor: `color-mix(in srgb, ${base} 18%, transparent)`,
        borderColor: `color-mix(in srgb, ${base} 40%, transparent)`,
      }}
    >
      {name}
    </span>
  )
}
