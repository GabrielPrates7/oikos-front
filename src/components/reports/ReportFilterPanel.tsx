import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import './ReportFilterPanel.css'

interface ReportFilterPanelProps {
  // Quantos filtros diferem do padrão (mês/ano ≠ atual, nome preenchido...). > 0 mostra
  // "Limpar filtros" e o contador do modo colapsado no mobile.
  activeCount: number
  onClear: () => void
  // Campos de filtro (Mês/Ano, Nome...). No mobile ficam num painel colapsável.
  children: ReactNode
  // Controles da aba (Tipo, Modo, Período, Visualização) — sempre visíveis, inclusive colapsado.
  controls?: ReactNode
}

// Painel de filtros no padrão de Entradas/Despesas (campos em linha, "Limpar filtros" só quando
// algo difere do padrão), com o vidro de Relatórios (--reports-glass-bg). Abaixo de 640px os
// filtros ficam atrás de um botão "Filtros (n)".
export function ReportFilterPanel({
  activeCount,
  onClear,
  children,
  controls,
}: ReportFilterPanelProps) {
  const [open, setOpen] = useState(false)
  const fieldsId = useId()

  return (
    <div className="report-filters">
      <button
        type="button"
        className="report-filters__toggle"
        aria-expanded={open}
        aria-controls={fieldsId}
        onClick={() => setOpen((current) => !current)}
      >
        <SlidersHorizontal size={15} aria-hidden="true" />
        Filtros{activeCount > 0 ? ` (${activeCount})` : ''}
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={`report-filters__chevron${open ? ' report-filters__chevron--open' : ''}`}
        />
      </button>
      <div
        id={fieldsId}
        className={`report-filters__fields${open ? ' report-filters__fields--open' : ''}`}
      >
        {children}
      </div>
      {controls}
      {activeCount > 0 && (
        <button type="button" className="report-filters__clear" onClick={onClear}>
          <X size={14} aria-hidden="true" />
          Limpar filtros
        </button>
      )}
    </div>
  )
}

interface NameFilterProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  // Tooltip explicando por que está desabilitado.
  title?: string
}

// Campo "Nome" (busca) — mesma aparência do "Buscar" de Entradas/Despesas.
export function NameFilter({
  value,
  onChange,
  placeholder = 'Buscar categoria...',
  disabled = false,
  title,
}: NameFilterProps) {
  const id = useId()
  return (
    <div className="report-filters__field report-filters__field--name" title={title}>
      <label htmlFor={id}>Nome</label>
      <div
        className={`report-filters__search${disabled ? ' report-filters__search--disabled' : ''}`}
      >
        <Search size={14} aria-hidden="true" />
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  )
}
