import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { Input } from '../../components/ui/Input'
import { ApiError } from '../../services/api'
import { centsToBRL } from '../../utils/currency'
import { formatDateBR } from '../../utils/date'
import { contasService } from './contas.service'
import type { Account, AccountStatement, StatementEntryType } from './contas.types'
import './ExtratoPage.css'

const TYPE_LABELS: Record<StatementEntryType, string> = {
  income: 'Entrada',
  expense: 'Despesa',
  transfer_out: 'Transferência enviada',
  transfer_in: 'Transferência recebida',
  invoice_payment: 'Pagamento de fatura',
}

// true = tipo reduz o saldo da conta — mesmo sinal usado em accounts.service.getStatement
// no backend (entradas e transferências recebidas aumentam, o resto reduz).
const REDUCES_BALANCE: Record<StatementEntryType, boolean> = {
  income: false,
  expense: true,
  transfer_out: true,
  transfer_in: false,
  invoice_payment: true,
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function ExtratoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [account, setAccount] = useState<Account | null>(null)
  const [statement, setStatement] = useState<AccountStatement | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let active = true

    async function loadAccount() {
      try {
        const result = await contasService.getById(id as string)
        if (active) {
          setAccount(result)
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          navigate('/contas', { replace: true, state: { error: 'Conta não encontrada.' } })
          return
        }
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar a conta.'))
        }
      }
    }

    void loadAccount()

    return () => {
      active = false
    }
  }, [id, navigate])

  useEffect(() => {
    if (!id) return
    let active = true

    async function loadStatement() {
      setLoading(true)
      setLoadError(null)
      try {
        const result = await contasService.getStatement(id as string, from || undefined, to || undefined)
        if (active) {
          setStatement(result)
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          navigate('/contas', { replace: true, state: { error: 'Conta não encontrada.' } })
          return
        }
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar o extrato.'))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadStatement()

    return () => {
      active = false
    }
  }, [id, from, to, navigate])

  if (loading && !statement) {
    return <div className="extrato-page" />
  }

  if (!account) {
    return (
      <div className="extrato-page">
        <FormError message={loadError ?? 'Não foi possível carregar a conta.'} />
      </div>
    )
  }

  return (
    <div className="extrato-page">
      <Link to="/contas" className="extrato-page__back">
        ← Contas
      </Link>
      <PageHeader title={`Extrato · ${account.name}`} />

      <div className="extrato-page__filters">
        <Input label="De" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <Input label="Até" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
      </div>

      <FormError message={loadError} />

      {statement && (
        <>
          <div className="extrato-page__summary">
            <div className="extrato-page__summary-item">
              <span className="extrato-page__summary-label">Saldo de abertura</span>
              <span className="extrato-page__summary-value">
                {centsToBRL(statement.openingBalanceCents)}
              </span>
            </div>
            <div className="extrato-page__summary-item">
              <span className="extrato-page__summary-label">Saldo de fechamento</span>
              <span className="extrato-page__summary-value">
                {centsToBRL(statement.closingBalanceCents)}
              </span>
            </div>
          </div>

          {statement.entries.length === 0 ? (
            <div className="extrato-page__empty">
              <p>Nenhum lançamento nesse período.</p>
              <p>Ajuste o filtro de datas ou registre uma movimentação nessa conta.</p>
            </div>
          ) : (
            <div className="extrato-page__table-wrapper">
              <table className="extrato-page__table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.entries.map((entry) => {
                    const reduces = REDUCES_BALANCE[entry.type]
                    return (
                      <tr key={`${entry.type}-${entry.id}`}>
                        <td>{formatDateBR(entry.date)}</td>
                        <td>
                          <div className="extrato-page__type-cell">
                            <span className="extrato-page__type-label">
                              {TYPE_LABELS[entry.type]}
                            </span>
                            <span className="extrato-page__description">{entry.description}</span>
                          </div>
                        </td>
                        <td
                          className={
                            reduces
                              ? 'extrato-page__amount extrato-page__amount--expense'
                              : 'extrato-page__amount extrato-page__amount--income'
                          }
                        >
                          {reduces ? '-' : '+'}
                          {centsToBRL(entry.amountCents)}
                        </td>
                        <td className="extrato-page__running-balance">
                          {centsToBRL(entry.runningBalanceCents)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
