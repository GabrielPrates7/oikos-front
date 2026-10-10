import { ChangePasswordForm } from './ChangePasswordForm'
import './SegurancaTab.css'

// Exclusão de conta: auditada e tecnicamente aprovada (ver audit-exclusao-conta/), mas a
// implementação fica pausada até "Exportar meus dados" existir e a própria aba Configurações
// estar pronta e aprovada. Botão presente e visível, só desabilitado — não é uma feature
// escondida, é uma que ainda não pode ser usada.
export function SegurancaTab() {
  return (
    <div className="seguranca-tab">
      <section className="seguranca-tab__section">
        <h2 className="seguranca-tab__section-title">Senha</h2>
        <ChangePasswordForm />
      </section>
      <section className="seguranca-tab__section seguranca-tab__section--danger">
        <h2 className="seguranca-tab__section-title">Excluir minha conta</h2>
        <p className="seguranca-tab__section-description">
          Exclui permanentemente sua conta e todos os seus dados. Esta ação não pode ser
          desfeita.
        </p>
        <div className="seguranca-tab__delete-row">
          <button
            type="button"
            className="seguranca-tab__delete-button"
            disabled
            title="Disponível em breve"
          >
            Excluir minha conta
          </button>
          <span className="seguranca-tab__delete-badge">Disponível em breve</span>
        </div>
      </section>
    </div>
  )
}
