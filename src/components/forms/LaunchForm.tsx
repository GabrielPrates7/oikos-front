import type { FormEventHandler, ReactNode, RefObject } from 'react'
import { Button } from '../ui/Button'
import { DISCARD_CONTROL_ATTR, useDiscardConfirm } from './useDiscardConfirm'
import './LaunchForm.css'

interface LaunchFormProps {
  // Tom da tela: verde (Entradas) ou vermelho (Despesas).
  tone: 'green' | 'red'
  icon: ReactNode
  title: string
  // Nome da tela de origem no link do cabeçalho: "← Entradas" / "← Despesas".
  backLabel: string
  submitLabel: string
  // Há alterações não salvas: Cancelar e o link do cabeçalho pedem confirmação antes de sair.
  dirty: boolean
  onCancel: () => void
  // Erro geral vindo da API (faixa no topo do painel, role="alert").
  error?: string | null
  submitting: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  formRef: RefObject<HTMLFormElement | null>
  children: ReactNode
}

// Casca visual dos formulários de Entrada e Despesa: cabeçalho (link de volta + título), um único
// painel de vidro com borda tingida pelo tom da tela, faixa de erro da API e rodapé com Cancelar
// e Salvar (sticky acima da barra inferior no mobile). Não conhece campos nem regras: isso fica
// em EntradaForm/DespesaForm, que só mudam de apresentação.
//
// O formulário troca a lista na MESMA rota (a URL não muda), então o link "← Entradas" não navega:
// tem o mesmo comportamento do Cancelar, inclusive a confirmação em duas etapas.
export function LaunchForm({
  tone,
  icon,
  title,
  backLabel,
  submitLabel,
  dirty,
  onCancel,
  error,
  submitting,
  onSubmit,
  formRef,
  children,
}: LaunchFormProps) {
  const { confirmingSource, request } = useDiscardConfirm(dirty, onCancel)

  return (
    <div className={`launch-form launch-form--${tone}`}>
      <div className="launch-form__header">
        <button
          type="button"
          className="launch-form__back"
          {...{ [DISCARD_CONTROL_ATTR]: '' }}
          onClick={() => request('back')}
        >
          {confirmingSource === 'back' ? 'Descartar alterações?' : `← ${backLabel}`}
        </button>
        <h1 className="launch-form__title">
          <span className="launch-form__title-icon" aria-hidden="true">
            {icon}
          </span>
          {title}
        </h1>
      </div>
      <form className="launch-form__panel" onSubmit={onSubmit} noValidate ref={formRef}>
        {error && (
          <div className="launch-form__error" role="alert">
            {error}
          </div>
        )}
        {children}
        <div className="launch-form__footer">
          <Button
            type="button"
            variant="secondary"
            {...{ [DISCARD_CONTROL_ATTR]: '' }}
            onClick={() => request('cancel')}
          >
            {confirmingSource === 'cancel' ? 'Descartar alterações?' : 'Cancelar'}
          </Button>
          <button
            type="submit"
            className="ui-button launch-form__submit"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting && <span className="ui-button__spinner" aria-hidden="true" />}
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
