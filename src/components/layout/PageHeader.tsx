import type { ReactNode } from 'react'
import './PageHeader.css'

interface PageHeaderProps {
  title: string
  action?: ReactNode
}

// flex-wrap evita que título comprido (ex: "Transferências") sobreponha o botão de ação
// em telas estreitas — bug encontrado e corrigido na fase de Transferências, generalizado
// aqui pra não se repetir nas próximas telas.
export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      <h1 className="page-header__title">{title}</h1>
      {action}
    </div>
  )
}
