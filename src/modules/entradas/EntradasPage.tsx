import { Plus, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { isAbortError } from '../../components/reports/abort'
import { ApiError } from '../../services/api'
import { currentMonthString } from '../../utils/date'
import { DEFAULT_PAGE_SIZE, totalPages } from '../../utils/pagination'
import { categoriasService } from '../categorias/categorias.service'
import type { Category } from '../categorias/categorias.types'
import { contasService } from '../contas/contas.service'
import type { Account } from '../contas/contas.types'
import { EntradaForm } from './EntradaForm'
import { EntradasList } from './EntradasList'
import { entradasService } from './entradas.service'
import type { CreateEntradaFormData } from './entradas.schemas'
import type { IncomeEntry, IncomeEntryFilters } from './entradas.types'
import './EntradasPage.css'

type Mode =
  | { type: 'list' }
  | { type: 'create'; defaultAccountId?: string; duplicateFrom?: IncomeEntry }
  | { type: 'edit'; entry: IncomeEntry }

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function EntradasPage() {
  // Atalho "Movimentar" de ContasList/CartoesList chega como /entradas?conta=ID — lido só
  // uma vez (inicializador preguiçoso do useState) pra abrir direto no formulário de
  // criação com a conta pré-selecionada, sem precisar de efeito nem depender do parâmetro
  // continuar na URL depois.
  const [searchParams] = useSearchParams()
  const [entries, setEntries] = useState<IncomeEntry[]>([])
  const [activeAccounts, setActiveAccounts] = useState<Account[]>([])
  const [allAccounts, setAllAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [years, setYears] = useState<number[]>([])
  // Sempre um mês concreto (nunca "sem filtro") — mostra o mês/ano atuais até o usuário
  // trocar, em vez de deixar os dropdowns "Mês"/"Ano" vazios até o primeiro filtro.
  const [filters, setFilters] = useState<IncomeEntryFilters>({ month: currentMonthString() })
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sumCents, setSumCents] = useState(0)
  const [sumMode, setSumMode] = useState<'pending' | 'default'>('default')
  const [loading, setLoading] = useState(true)
  // A lista (e o painel de filtros dentro dela) fica montada depois da 1ª carga: desmontar a cada
  // troca de filtro tirava o foco do teclado do controle recém-alterado. Durante a recarga ela
  // continua na tela, esmaecida (aria-busy), até a resposta mais nova chegar.
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [mode, setMode] = useState<Mode>(() => {
    const conta = searchParams.get('conta')
    // ?nova=1 vem do menu "Nova Transação" do Dashboard — mesma ideia de ?conta=ID, mas sem
    // conta pré-selecionada.
    if (conta) return { type: 'create', defaultAccountId: conta }
    return searchParams.get('nova') ? { type: 'create' } : { type: 'list' }
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Dados de referência (contas, categorias) — não dependem dos filtros, só recarregam
  // quando uma mutação pode ter afetado o conjunto (refreshKey).
  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [activeAccountsResult, allAccountsResult, categoriesResult, yearsResult] = await Promise.all([
          contasService.list('active'),
          contasService.list('all'),
          categoriasService.list('income'),
          entradasService.getYears(),
        ])
        if (active) {
          setActiveAccounts(activeAccountsResult)
          setAllAccounts(allAccountsResult)
          setCategories(categoriesResult)
          // Ano atual sempre disponível pro dropdown, mesmo sem nenhum lançamento ainda
          // nele (senão o valor padrão pré-selecionado, ver useState acima, não teria uma
          // <option> correspondente na lista).
          const currentYear = new Date().getFullYear()
          setYears(
            Array.from(new Set([currentYear, ...yearsResult])).sort((a, b) => b - a),
          )
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar contas e categorias.'))
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [refreshKey])

  // Cada troca de filtro/página cancela a requisição anterior (AbortController): uma resposta
  // antiga nunca sobrescreve a mais nova, mesmo com troca rápida de filtros.
  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const result = await entradasService.list(
          filters,
          { page, pageSize: DEFAULT_PAGE_SIZE },
          controller.signal,
        )
        if (controller.signal.aborted) return
        setEntries(result.items)
        setTotal(result.total)
        setSumCents(result.sumCents)
        setSumMode(result.sumMode === 'pending' ? 'pending' : 'default')
      } catch (error) {
        if (isAbortError(error) || controller.signal.aborted) return
        setLoadError(errorMessage(error, 'Não foi possível carregar as entradas.'))
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
          setLoadedOnce(true)
        }
      }
    }

    void load()

    return () => {
      controller.abort()
    }
  }, [filters, page, refreshKey])

  // Qualquer mudança de filtro pode reduzir o total de páginas — sem isso, trocar de filtro
  // enquanto na página 3 podia deixar a tela "presa" numa página que não existe mais.
  function handleFiltersChange(next: IncomeEntryFilters) {
    setPage(1)
    setFilters(next)
  }

  async function handleCreate(data: CreateEntradaFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await entradasService.create(data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id: string, data: CreateEntradaFormData) {
    setSubmitting(true)
    setFormError(null)
    try {
      await entradasService.update(id, data)
      setMode({ type: 'list' })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setFormError(errorMessage(error, 'Erro inesperado. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(entry: IncomeEntry) {
    setLoadError(null)
    try {
      await entradasService.remove(entry.id)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setLoadError(errorMessage(error, 'Não foi possível excluir a entrada.'))
    }
  }

  // Atalho da lista — pula o formulário inteiro, só isso muda. Sempre manda receivedDate
  // junto com isReceived (mesma regra do formulário completo).
  async function handleMarkAsReceived(entry: IncomeEntry) {
    setLoadError(null)
    try {
      await entradasService.update(entry.id, { isReceived: true, receivedDate: today() })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setLoadError(errorMessage(error, 'Não foi possível marcar a entrada como recebida.'))
    }
  }

  function handleCancelForm() {
    setFormError(null)
    setMode({ type: 'list' })
  }

  // Duplicar nunca edita o original — sempre abre o formulário de criação, só pré-preenchido
  // (ver EntradaForm.duplicateFrom). Mesmo padrão de DespesasPage.handleDuplicate.
  function handleDuplicate(entry: IncomeEntry) {
    setMode({ type: 'create', duplicateFrom: entry })
  }

  if (mode.type === 'create' || mode.type === 'edit') {
    return (
      <div className="entradas-page">
        <EntradaForm
          // Mesmo motivo do key em DespesasPage: <select> não-controlado do RHF só aplica
          // o valor inicial contra as options que já existem no primeiro render.
          key={activeAccounts.length}
          initialData={mode.type === 'edit' ? mode.entry : undefined}
          duplicateFrom={mode.type === 'create' ? mode.duplicateFrom : undefined}
          defaultAccountId={mode.type === 'create' ? mode.defaultAccountId : undefined}
          accounts={activeAccounts}
          categories={categories}
          error={formError}
          submitting={submitting}
          onCancel={handleCancelForm}
          onSubmit={(data) =>
            mode.type === 'edit' ? handleUpdate(mode.entry.id, data) : handleCreate(data)
          }
        />
      </div>
    )
  }

  return (
    <div className="entradas-page">
      <PageHeader
        title="Entradas"
        icon={<Wallet size={22} aria-hidden="true" />}
        action={
          <button
            type="button"
            className="entradas-page__nova-entrada-button"
            onClick={() => setMode({ type: 'create' })}
          >
            <Plus size={16} aria-hidden="true" />
            Nova entrada
          </button>
        }
      />
      <FormError message={loadError} />
      {loadedOnce && (
        <div
          className={`entradas-page__list${loading ? ' entradas-page__list--loading' : ''}`}
          aria-busy={loading}
        >
        <EntradasList
          entries={entries}
          accounts={allAccounts}
          categories={categories}
          years={years}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          sumCents={sumCents}
          sumMode={sumMode}
          page={page}
          total={total}
          totalPages={totalPages(total, DEFAULT_PAGE_SIZE)}
          onPageChange={setPage}
          onEdit={(entry) => setMode({ type: 'edit', entry })}
          onDelete={handleDelete}
          onMarkAsReceived={handleMarkAsReceived}
          onDuplicate={handleDuplicate}
        />
        </div>
      )}
    </div>
  )
}
