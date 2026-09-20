import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { ApiError } from '../../services/api'
import { centsToBRL } from '../../utils/currency'
import { formatDateBR } from '../../utils/date'
import { contasService } from '../contas/contas.service'
import type { Account } from '../contas/contas.types'
import { AporteForm } from './AporteForm'
import type { CreateAporteFormData } from './metas.schemas'
import { metasService } from './metas.service'
import type { GoalDetail } from './metas.types'
import './MetaDetalhePage.css'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function MetaDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [goal, setGoal] = useState<GoalDetail | null>(null)
  // Contas ativas alimentam o Select do aporte; todas (inclusive arquivadas) resolvem o
  // nome da conta de aportes antigos — mesmo padrão de FaturaDetalhePage pro pagamento.
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([])
  const [allAccounts, setAllAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  // ?aportar=1 (vindo do botao "Aportar" do card em /metas) abre o formulario ja aberto.
  const [searchParams, setSearchParams] = useSearchParams()
  const [showAporteForm, setShowAporteForm] = useState(() => searchParams.get('aportar') === '1')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmingContributionId, setConfirmingContributionId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const contributionsRef = useRef<HTMLUListElement>(null)

  // Consome o parametro: recarregar a pagina depois de cancelar nao reabre o formulario.
  useEffect(() => {
    if (searchParams.get('aportar') === '1') {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!id) return
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [goalResult, activeAccountsResult, allAccountsResult] = await Promise.all([
          metasService.getById(id as string),
          contasService.list('active'),
          contasService.list('all'),
        ])
        if (active) {
          setGoal(goalResult)
          setActiveAccounts(activeAccountsResult)
          setAllAccounts(allAccountsResult)
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          navigate('/metas', { replace: true, state: { error: 'Meta não encontrada.' } })
          return
        }
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar a meta.'))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [id, refreshKey, navigate])

  useEffect(() => {
    if (!confirmingContributionId) return

    function handlePointerDown(event: MouseEvent) {
      if (!contributionsRef.current?.contains(event.target as Node)) {
        setConfirmingContributionId(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [confirmingContributionId])

  async function handleCreateContribution(data: CreateAporteFormData) {
    if (!id) return
    setSubmitting(true)
    setFormError(null)
    try {
      await metasService.createContribution(id, data)
      setShowAporteForm(false)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleDeleteContributionClick(contributionId: string) {
    if (confirmingContributionId === contributionId) {
      setConfirmingContributionId(null)
      void handleDeleteContribution(contributionId)
    } else {
      setConfirmingContributionId(contributionId)
    }
  }

  async function handleDeleteContribution(contributionId: string) {
    if (!id) return
    try {
      await metasService.deleteContribution(id, contributionId)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setLoadError(errorMessage(error, 'Não foi possível excluir o aporte.'))
    }
  }

  if (loading) {
    return <div className="meta-detalhe-page" />
  }

  if (!goal) {
    return (
      <div className="meta-detalhe-page">
        <FormError message={loadError ?? 'Não foi possível carregar a meta.'} />
      </div>
    )
  }

  const percent =
    goal.target_amount_cents > 0
      ? Math.min(100, Math.round((goal.currentAmountCents / goal.target_amount_cents) * 100))
      : 0

  return (
    <div className="meta-detalhe-page">
      <Link to="/metas" className="meta-detalhe-page__back">
        ← Metas
      </Link>
      <PageHeader title={goal.name} />
      <div className="meta-detalhe-page__meta">
        <span>Até {formatDateBR(goal.target_date)}</span>
      </div>
      <div className="meta-detalhe-page__amounts">
        <span className="meta-detalhe-page__current">{centsToBRL(goal.currentAmountCents)}</span>
        <span className="meta-detalhe-page__target">
          {' '}
          de {centsToBRL(goal.target_amount_cents)}
        </span>
      </div>
      <div className="meta-detalhe-page__bar-track">
        <div className="meta-detalhe-page__bar-fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="meta-detalhe-page__percent">{percent}% concluído</span>

      <FormError message={loadError} />

      {showAporteForm ? (
        <>
          <h2 className="meta-detalhe-page__section-title">Novo aporte</h2>
          <AporteForm
            accounts={activeAccounts}
            error={formError}
            submitting={submitting}
            onCancel={() => {
              setFormError(null)
              setShowAporteForm(false)
            }}
            onSubmit={handleCreateContribution}
          />
        </>
      ) : (
        <div className="meta-detalhe-page__new-contribution">
          <Button type="button" onClick={() => setShowAporteForm(true)}>
            <Plus size={16} aria-hidden="true" />
            Novo aporte
          </Button>
        </div>
      )}

      <h2 className="meta-detalhe-page__section-title">Aportes</h2>
      {goal.contributions.length === 0 ? (
        <p className="meta-detalhe-page__empty">Nenhum aporte registrado ainda.</p>
      ) : (
        <ul className="meta-detalhe-page__contributions" ref={contributionsRef}>
          {goal.contributions.map((contribution) => {
            const account = allAccounts.find((item) => item.id === contribution.account_id)
            const isConfirming = confirmingContributionId === contribution.id
            return (
              <li key={contribution.id} className="meta-detalhe-page__contribution-row">
                <div className="meta-detalhe-page__contribution-info">
                  <span className="meta-detalhe-page__contribution-date">
                    {formatDateBR(contribution.contribution_date)}
                  </span>
                  <span className="meta-detalhe-page__contribution-account">
                    {account?.name ?? 'Conta removida'}
                  </span>
                </div>
                <span className="meta-detalhe-page__contribution-amount">
                  {centsToBRL(contribution.amount_cents)}
                </span>
                <div className="meta-detalhe-page__contribution-actions">
                  {isConfirming ? (
                    <>
                      <button
                        type="button"
                        className="meta-detalhe-page__confirm-delete"
                        onClick={() => handleDeleteContributionClick(contribution.id)}
                      >
                        Confirmar exclusão?
                      </button>
                      <button
                        type="button"
                        className="meta-detalhe-page__cancel-delete"
                        onClick={() => setConfirmingContributionId(null)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Excluir aporte de ${centsToBRL(contribution.amount_cents)}`}
                      onClick={() => handleDeleteContributionClick(contribution.id)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
