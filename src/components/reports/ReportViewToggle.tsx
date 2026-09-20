import { PieChart } from 'lucide-react'
import './ReportViewToggle.css'

interface ReportViewToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  // Tooltip (ex.: por que está desabilitado).
  title?: string
}

// Interruptor "Ver gráficos em formato de pizza" (role="switch"). O estado aparece no
// indicador (trilho com bolinha) E no fundo/borda — nunca só pela cor.
export function ReportViewToggle({
  checked,
  onChange,
  disabled = false,
  title,
}: ReportViewToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      title={title}
      className={`report-view-toggle${checked ? ' report-view-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <PieChart size={16} aria-hidden="true" />
      <span className="report-view-toggle__label">Ver gráficos em formato de pizza</span>
      <span className="report-view-toggle__track" aria-hidden="true">
        <span className="report-view-toggle__knob" />
      </span>
    </button>
  )
}
