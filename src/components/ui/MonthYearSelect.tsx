import { MONTH_NAMES_PT } from '../../utils/date'
import './MonthYearSelect.css'

interface MonthYearSelectProps {
  // 'YYYY-MM'
  month: string
  onChange: (month: string) => void
  label?: string
  // Anos do seletor (o padrão cobre alguns anos pra trás e pra frente do ano atual).
  years?: number[]
}

function defaultYears(): number[] {
  const current = new Date().getFullYear()
  const years: number[] = []
  for (let year = current - 5; year <= current + 5; year++) years.push(year)
  return years
}

// Seletor direto de mês e ano — mesmo estilo dos <select> de "Mês"/"Ano" do painel de filtros de
// Entradas/Despesas (EntradasList.css: appearance:none, seta customizada), ao lado das flechas do
// MonthSwitcher. Ao contrário daqueles, aqui não existe "Todos": é sempre um mês concreto.
export function MonthYearSelect({
  month,
  onChange,
  label = 'Ir para',
  years,
}: MonthYearSelectProps) {
  const [year, monthNum] = month.split('-')
  const yearList = years ?? defaultYears()

  return (
    <div className="month-year-select" role="group" aria-label={label}>
      <select
        aria-label="Mês"
        className="month-year-select__field"
        value={monthNum}
        onChange={(event) => onChange(`${year}-${event.target.value}`)}
      >
        {MONTH_NAMES_PT.map((name, index) => (
          <option key={name} value={String(index + 1).padStart(2, '0')}>
            {name}
          </option>
        ))}
      </select>
      <select
        aria-label="Ano"
        className="month-year-select__field"
        value={year}
        onChange={(event) => onChange(`${event.target.value}-${monthNum}`)}
      >
        {yearList.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
    </div>
  )
}
