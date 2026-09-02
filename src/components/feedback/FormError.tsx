import './FormError.css'

interface FormErrorProps {
  message?: string | null
}

// Erro geral do formulário (ex: vindo da API — "credenciais inválidas", "e-mail já
// cadastrado"), não de um campo específico. Renderiza nada se não houver mensagem.
export function FormError({ message }: FormErrorProps) {
  if (!message) {
    return null
  }
  return (
    <p className="form-error" role="alert">
      {message}
    </p>
  )
}
