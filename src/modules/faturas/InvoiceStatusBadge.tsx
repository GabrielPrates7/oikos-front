import type { InvoiceStatus } from './faturas.types'
import './InvoiceStatusBadge.css'

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  paid: 'Paga',
  overdue: 'Atrasada',
}

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  return (
    <span className={`invoice-status-badge invoice-status-badge--${status}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
