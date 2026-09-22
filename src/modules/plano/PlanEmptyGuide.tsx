import { ClipboardList } from 'lucide-react'
import { centsToBRL } from '../../utils/currency'
import type { PlanSummary } from './plano.types'
import './PlanEmptyGuide.css'

interface PlanEmptyGuideProps {
  summary: PlanSummary
  onSuggest: (element: HTMLElement) => void
  onAddFromSystem: (element: HTMLElement) => void
}

// Estado vazio guiado ("Monte seu plano"): sem semáforo (nem verde, nem vermelho). Vale para o plano
// sem nenhuma linha (EMPTY_PLAN) e para o plano em que todas as linhas foram liquidadas antes do mês
// e não contam (NO_COUNTED_ITEMS).
export function PlanEmptyGuide({ summary, onSuggest, onAddFromSystem }: PlanEmptyGuideProps) {
  const noCounted = summary.health.reasons.includes('NO_COUNTED_ITEMS')
  const withOpening = summary.settings.include_opening_balance
  return (
    <section className="plan-guide" aria-labelledby="plan-guide-title">
      <div className="plan-guide__icon" aria-hidden="true">
        <ClipboardList size={26} />
      </div>
      <h2 id="plan-guide-title" className="plan-guide__title">
        Monte seu plano
      </h2>
      {noCounted ? (
        <p className="plan-guide__lead">
          As linhas deste plano foram todas liquidadas antes do início do mês: elas já estão no
          saldo de abertura e não entram nas somas. Adicione o que ainda vai acontecer neste mês.
        </p>
      ) : (
        <p className="plan-guide__lead">
          Planeje as entradas e as saídas do mês e veja se o caixa fecha, em três passos.
        </p>
      )}
      <ol className="plan-guide__steps">
        <li>
          <strong>Saldo.</strong> Decida se o plano conta o seu saldo de abertura (
          {centsToBRL(summary.opening_balance)}) —{' '}
          {withOpening ? 'hoje está contando' : 'hoje não está contando'}. O interruptor fica logo
          acima.
        </li>
        <li>
          <strong>Importar.</strong> Traga do sistema os lançamentos planejados, as faturas e as
          despesas fixas do mês anterior. Você vê uma prévia antes de confirmar.
        </li>
        <li>
          <strong>Revisar.</strong> Ajuste valores e datas, remova o que não faz sentido e complete
          com linhas manuais.
        </li>
      </ol>
      <div className="plan-guide__actions">
        <button
          type="button"
          className="ui-button ui-button--primary plan-guide__primary"
          onClick={(event) => onSuggest(event.currentTarget)}
        >
          Sugestão automática
        </button>
        <button
          type="button"
          className="ui-button ui-button--secondary plan-guide__secondary"
          onClick={(event) => onAddFromSystem(event.currentTarget)}
        >
          Adicionar do sistema
        </button>
      </div>
    </section>
  )
}
