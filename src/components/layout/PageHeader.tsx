import type { ReactNode } from 'react'
import './PageHeader.css'

interface PageHeaderProps {
  title: string
  // Opcional — só Entradas usa até agora (ícone de carteira, pedido do redesign daquela
  // tela). Sem essa prop o header renderiza idêntico a antes em todas as outras telas.
  icon?: ReactNode
  // Opcional: cor do texto do título (ex: cor do banco no detalhe de fatura). Sem ela, o
  // título usa a cor padrão do tema, como em todas as outras telas.
  titleColor?: string
  action?: ReactNode
}

// flex-wrap evita que título comprido (ex: "Transferências") sobreponha o botão de ação
// em telas estreitas — bug encontrado e corrigido na fase de Transferências, generalizado
// aqui pra não se repetir nas próximas telas.
export function PageHeader({ title, icon, titleColor, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header__title-row">
        {icon && <span className="page-header__icon">{icon}</span>}
        <h1 className="page-header__title" style={titleColor ? { color: titleColor } : undefined}>
          {title}
        </h1>
      </div>
      {action}
    </div>
  )
}
