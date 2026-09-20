import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMonthLabel, shiftMonth } from '../../utils/date'
import './MonthSwitcher.css'

interface MonthSwitcherProps {
  month: string
  onChange: (month: string) => void
  // Nome acessível do grupo; o padrão é o de sempre (quem não passa nada não muda).
  label?: string
}

export function MonthSwitcher({ month, onChange, label = 'Mês do resumo' }: MonthSwitcherProps) {
  return (
    <div className="month-switcher" role="group" aria-label={label}>
      <button
        type="button"
        aria-label="Mês anterior"
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <span className="month-switcher__label">{formatMonthLabel(month)}</span>
      <button type="button" aria-label="Próximo mês" onClick={() => onChange(shiftMonth(month, 1))}>
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
