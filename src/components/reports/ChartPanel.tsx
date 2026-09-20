import type { ReactNode } from 'react'
import './ChartPanel.css'

interface ChartPanelProps {
  title?: string
  subtitle?: string
  children: ReactNode
}

// Painel de vidro padrão para gráficos de Relatórios: largura máxima de 1100px, centralizado,
// com cabeçalho opcional (título em Fraunces e subtítulo discreto).
export function ChartPanel({ title, subtitle, children }: ChartPanelProps) {
  return (
    <section className="chart-panel">
      {(title || subtitle) && (
        <header className="chart-panel__header">
          {title && <h3 className="chart-panel__title">{title}</h3>}
          {subtitle && <p className="chart-panel__subtitle">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  )
}
