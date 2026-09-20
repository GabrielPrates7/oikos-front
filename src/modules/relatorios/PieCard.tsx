import { ReportPie } from '../../components/reports/ReportPie'
import type { RankedRow } from './visaoGeral.utils'
import { formatShare } from './visaoGeral.utils'
import './RankedBarsCard.css'
import './SegmentedBarCard.css'

interface PieCardProps {
  title: string
  slices: RankedRow[]
  emptyMessage: string
  animate: boolean
  // Mesmo contêiner de vidro do painel em barras que ele substitui.
  variant: 'ranked' | 'segmented'
}

// Versão em pizza dos painéis da Visão Geral: mesmo contêiner de vidro e mesmo título do modo
// barras (RankedBarsCard / SegmentedBarCard). Total 0 ou sem itens: o mesmo estado vazio.
export function PieCard({ title, slices, emptyMessage, animate, variant }: PieCardProps) {
  const totalCents = slices.reduce((sum, slice) => sum + slice.valueCents, 0)
  const prefix = variant === 'ranked' ? 'ranked-card' : 'segmented-card'

  return (
    <section className={prefix}>
      <h3 className={`${prefix}__title`}>{title}</h3>
      {totalCents <= 0 ? (
        <p className={`${prefix}__empty`}>{emptyMessage}</p>
      ) : (
        <ReportPie
          slices={slices}
          totalCents={totalCents}
          formatShare={formatShare}
          height={220}
          label={title}
          animate={animate}
        />
      )}
    </section>
  )
}
