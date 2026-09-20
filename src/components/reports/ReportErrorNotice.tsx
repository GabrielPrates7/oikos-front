import { RotateCw } from 'lucide-react'
import './ReportErrorNotice.css'

interface ReportErrorNoticeProps {
  message: string
  onRetry: () => void
}

// Erro de carga com "Tentar de novo". aria-live="polite": o leitor de tela anuncia sem
// interromper.
export function ReportErrorNotice({ message, onRetry }: ReportErrorNoticeProps) {
  return (
    <div className="report-error" role="status" aria-live="polite">
      <p className="report-error__message">{message}</p>
      <button type="button" className="report-error__retry" onClick={onRetry}>
        <RotateCw size={14} aria-hidden="true" />
        Tentar de novo
      </button>
    </div>
  )
}
