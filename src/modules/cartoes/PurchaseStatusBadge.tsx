import type { PurchasePaymentStatus } from '../compras/compras.types'
import './PurchaseStatusBadge.css'

const STATUS_LABELS: Record<PurchasePaymentStatus, string> = {
  paid: 'Paga',
  pending: 'Em aberto',
}

interface PurchaseStatusBadgeProps {
  status: PurchasePaymentStatus
}

export function PurchaseStatusBadge({ status }: PurchaseStatusBadgeProps) {
  return (
    <span className={`purchase-status-badge purchase-status-badge--${status}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
