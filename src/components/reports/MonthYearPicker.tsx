import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useId } from 'react'
import { MONTH_NAMES_PT } from '../../utils/date'
import { shiftYearMonth } from './reportPeriod'
import '../../modules/dashboard/MonthSwitcher.css'
import './MonthYearPicker.css'

interface MonthYearPickerProps {
  label: string
  month: number
  year: number
  years: number[]
  onChange: (next: { month: number; year: number }) => void
}

// Mês (Janeiro a Dezembro) + Ano em selects, com as setas ‹ › do MonthSwitcher ao redor
// (mesmas classes/estilo do MonthSwitcher; navegação por inteiros com virada de ano).
export function MonthYearPicker({ label, month, year, years, onChange }: MonthYearPickerProps) {
  const labelId = useId()
  // O ano selecionado sempre existe nas opções, mesmo fora da lista da API.
  const yearOptions = years.includes(year) ? years : [year, ...years].sort((a, b) => b - a)

  return (
    <div className="month-year-picker" role="group" aria-labelledby={labelId}>
      <span id={labelId} className="month-year-picker__label">
        {label}
      </span>
      <div className="month-switcher month-year-picker__row">
        <button
          type="button"
          aria-label={`${label}: mês anterior`}
          onClick={() => onChange(shiftYearMonth({ year, month }, -1))}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <select
          className="month-year-picker__select"
          aria-label={`${label}: mês`}
          value={month}
          onChange={(event) => onChange({ month: Number(event.target.value), year })}
        >
          {MONTH_NAMES_PT.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          className="month-year-picker__select month-year-picker__select--year"
          aria-label={`${label}: ano`}
          value={year}
          onChange={(event) => onChange({ month, year: Number(event.target.value) })}
        >
          {yearOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label={`${label}: próximo mês`}
          onClick={() => onChange(shiftYearMonth({ year, month }, 1))}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
