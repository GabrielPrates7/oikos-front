import './ReportSkeleton.css'

interface ReportSkeletonProps {
  // Quantos blocos de card pequeno e quantos painéis grandes desenhar.
  cards?: number
  panels?: number
  panelHeight?: number
}

// Skeleton em vidro (mesma cara dos cards/painéis de Relatórios) enquanto carrega — mantém a
// altura aproximada do conteúdo pra trocar de filtro sem salto de layout.
export function ReportSkeleton({ cards = 3, panels = 1, panelHeight = 280 }: ReportSkeletonProps) {
  return (
    <div className="report-skeleton" aria-busy="true" aria-label="Carregando">
      {cards > 0 && (
        <div className="report-skeleton__cards">
          {Array.from({ length: cards }, (_, index) => (
            <div key={index} className="report-skeleton__block report-skeleton__block--card" />
          ))}
        </div>
      )}
      {Array.from({ length: panels }, (_, index) => (
        <div
          key={index}
          className="report-skeleton__block report-skeleton__block--panel"
          style={{ height: panelHeight }}
        />
      ))}
    </div>
  )
}
