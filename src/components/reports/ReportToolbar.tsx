import type { ReactNode } from 'react'
import './ReportToolbar.css'

interface ReportToolbarProps {
  children: ReactNode
}

// Contêiner em vidro leve com os controles da aba numa única linha (quebra em mobile).
// min-height fixa: a altura e a posição são as mesmas em todos os modos da aba, então
// trocar de modo nunca causa layout shift.
export function ReportToolbar({ children }: ReportToolbarProps) {
  return <div className="report-toolbar">{children}</div>
}

// Campo da toolbar com rótulo visível acima (mesmo estilo do rótulo do SegmentedControl), pra
// que o MonthSwitcher alinhe pela base com os grupos segmentados.
export function ToolbarField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="report-toolbar__field">
      <span className="report-toolbar__label">{label}</span>
      {children}
    </div>
  )
}
