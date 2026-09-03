import './SuccessMessage.css'

interface SuccessMessageProps {
  message?: string | null
}

// Mesmo padrão visual/estrutural do FormError, mas pra confirmação de sucesso
// (--color-accent-income). role="status" (não "alert") pois não é um erro urgente.
export function SuccessMessage({ message }: SuccessMessageProps) {
  if (!message) {
    return null
  }
  return (
    <p className="success-message" role="status">
      {message}
    </p>
  )
}
