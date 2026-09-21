import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftRight, Banknote, Ellipsis, Wallet, Zap } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { SegmentedControl } from '../../components/reports/SegmentedControl'
import { focusFirstInvalid } from '../../components/forms/focusFirstInvalid'
import {
  CountInTotalsRow,
  DateField,
  Field,
  FormSection,
  Reveal,
} from '../../components/forms/LaunchFields'
import { LaunchForm } from '../../components/forms/LaunchForm'
import { SHELL_DESKTOP_QUERY } from '../../components/layout/breakpoints'
import { AccountBadge } from '../../components/ui/AccountBadge'
import { CategoryBadge } from '../../components/ui/CategoryBadge'
import { Combobox } from '../../components/ui/Combobox'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Input } from '../../components/ui/Input'
import { assignCategoryColors } from '../../utils/chartColors'
import { nextMonthSameDay } from '../../utils/date'
import { todayInSaoPaulo } from '../../utils/period'
import type { Account } from '../contas/contas.types'
import type { Category } from '../categorias/categorias.types'
import { createSchema, type CreateEntradaFormData } from './entradas.schemas'
import { RECEIPT_METHOD_LABELS } from './entradas.types'
import type { IncomeEntry, ReceiptMethod } from './entradas.types'

const RECEIPT_METHOD_ICONS: Record<ReceiptMethod, React.ReactNode> = {
  pix: <Zap size={16} />,
  transfer: <ArrowLeftRight size={16} />,
  cash: <Banknote size={16} />,
  other: <Ellipsis size={16} />,
}

const RECEIPT_METHOD_OPTIONS = (
  Object.entries(RECEIPT_METHOD_LABELS) as [ReceiptMethod, string][]
).map(([value, label]) => ({ value, label, icon: RECEIPT_METHOD_ICONS[value] }))

// Booleanos obrigatórios sem valor padrão: undefined = nenhuma opção marcada.
function boolToSegment(value: boolean | undefined): 'true' | 'false' | '' {
  return value === undefined ? '' : value ? 'true' : 'false'
}

interface EntradaFormProps {
  initialData?: IncomeEntry
  // Preenchido só na criação, vindo do botão "Duplicar" de EntradasList — mesmos dados do
  // original, exceto a data (sugerida pro mês seguinte, editável). Mesmo padrão de
  // DespesaForm.duplicateFrom.
  duplicateFrom?: IncomeEntry
  // Preenchido só na criação, vindo do atalho "Movimentar" de ContasList — nunca junto
  // com initialData (edição já traz a conta certa em initialData.account_id).
  defaultAccountId?: string
  accounts: Account[]
  categories: Category[]
  error?: string | null
  submitting: boolean
  onSubmit: (data: CreateEntradaFormData) => Promise<void>
  onCancel: () => void
}

// Só apresentação: campos, validações (zod), regras e o payload continuam os mesmos de antes.
export function EntradaForm({
  initialData,
  duplicateFrom,
  defaultAccountId,
  accounts,
  categories,
  error,
  submitting,
  onSubmit,
  onCancel,
}: EntradaFormProps) {
  // Edição usa o registro original; duplicar usa a cópia como fonte de todos os campos,
  // exceto a data (calculada à parte, abaixo).
  const source = initialData ?? duplicateFrom
  const formRef = useRef<HTMLFormElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<CreateEntradaFormData>({
    resolver: zodResolver(createSchema),
    // O foco no primeiro campo inválido é feito por focusFirstInvalid (ordem da tela; inclui
    // Combobox e segmentos, que o RHF não alcança sozinho).
    shouldFocusError: false,
    defaultValues: {
      accountId: source?.account_id ?? defaultAccountId ?? '',
      categoryId: source?.category_id ?? '',
      description: source?.description ?? '',
      amountCents: source?.amount_cents ?? 0,
      entryDate: duplicateFrom
        ? nextMonthSameDay(duplicateFrom.entry_date)
        : (initialData?.entry_date ?? todayInSaoPaulo()),
      receiptMethod: source?.receipt_method ?? 'pix',
      // Sem valor padrão de propósito (escolha obrigatória) — igual ao formulário anterior.
      isReceived: source?.is_received,
      isPlanned: source?.is_planned,
      // Registro antigo (de antes desse campo existir) pode ter is_received=true com
      // received_date nulo — cai pra data do lançamento em vez de deixar em branco.
      receivedDate: source?.received_date ?? source?.entry_date ?? todayInSaoPaulo(),
      // Marcado por padrão (fase 1 do campo "contar no total") — ?? true cobre tanto
      // criação (source undefined) quanto registro antigo.
      countInTotals: source?.count_in_totals ?? true,
    },
  })

  const isReceived = useWatch({ control, name: 'isReceived' })
  const entryDate = useWatch({ control, name: 'entryDate' })
  const countInTotals = useWatch({ control, name: 'countInTotals' })

  // Foco automático no valor SÓ ao criar e SÓ no desktop (>= 768px): no mobile o teclado
  // cobriria o formulário e causaria salto de rolagem.
  useEffect(() => {
    if (!initialData && window.matchMedia(SHELL_DESKTOP_QUERY).matches) {
      amountRef.current?.focus()
    }
  }, [initialData])

  // Padrão pedido: data de recebimento = mesma data do lançamento, no momento em que o
  // campo aparece — não sobrescreve se já tinha algo (edição de registro com data própria).
  useEffect(() => {
    if (isReceived && !getValues('receivedDate')) {
      setValue('receivedDate', entryDate)
    }
  }, [isReceived, entryDate, getValues, setValue])

  const categoryColors = assignCategoryColors(categories.map((category) => category.name))
  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: `${category.icon ?? '📁'} ${category.name}`,
    node: (
      <CategoryBadge
        name={category.name}
        icon={category.icon}
        color={categoryColors.get(category.name) ?? 'var(--color-text-muted)'}
      />
    ),
  }))
  const accountOptions = accounts.map((account) => ({
    value: account.id,
    label: account.name,
    node: <AccountBadge name={account.name} bankName={account.bank_name} color={account.color} />,
  }))

  // Trava de duplo envio: o estado `submitting` da página só chega no próximo render; o ref cobre
  // dois cliques/Enter dentro do mesmo instante.
  async function handleValid(data: CreateEntradaFormData) {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      await onSubmit(data)
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <LaunchForm
      tone="green"
      icon={<Wallet size={22} />}
      title={initialData ? 'Editar entrada' : 'Nova entrada'}
      backLabel="Entradas"
      submitLabel={initialData ? 'Salvar alterações' : 'Salvar entrada'}
      dirty={isDirty}
      onCancel={onCancel}
      error={error}
      submitting={submitting}
      formRef={formRef}
      onSubmit={(event) => void handleSubmit(handleValid, () => focusFirstInvalid(formRef))(event)}
    >
      <div className="launch-hero">
        <CurrencyInput
          control={control}
          name="amountCents"
          label="Valor"
          error={errors.amountCents?.message}
          inputRef={amountRef}
          className="launch-amount"
          inputClassName="launch-amount__input"
        />
        <Input
          label="Descrição"
          type="text"
          error={errors.description?.message}
          {...register('description')}
        />
      </div>

      <FormSection title="Detalhes">
        <Field id="categoryId" label="Categoria" required error={errors.categoryId?.message}>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Combobox
                id="categoryId"
                variant="field"
                value={field.value}
                onChange={field.onChange}
                options={categoryOptions}
                placeholder="Selecione uma categoria"
                invalid={!!errors.categoryId}
                required
                describedBy={errors.categoryId ? 'categoryId-error' : undefined}
              />
            )}
          />
        </Field>
        <Field id="accountId" label="Conta" required error={errors.accountId?.message}>
          <Controller
            control={control}
            name="accountId"
            render={({ field }) => (
              <Combobox
                id="accountId"
                variant="field"
                value={field.value}
                onChange={field.onChange}
                options={accountOptions}
                placeholder="Selecione uma conta"
                invalid={!!errors.accountId}
                required
                describedBy={errors.accountId ? 'accountId-error' : undefined}
              />
            )}
          />
        </Field>
        <div className="launch-span-2">
          <Controller
            control={control}
            name="receiptMethod"
            render={({ field }) => (
              <SegmentedControl<ReceiptMethod>
                label="Forma de recebimento"
                stretch
                layout="grid2"
                value={field.value}
                options={RECEIPT_METHOD_OPTIONS}
                onChange={field.onChange}
                error={errors.receiptMethod?.message}
              />
            )}
          />
        </div>
      </FormSection>

      <FormSection title="Data e situação">
        <DateField
          id="entryDate"
          label="Data"
          register={register('entryDate')}
          value={entryDate}
          onPick={(iso) => setValue('entryDate', iso, { shouldDirty: true, shouldValidate: true })}
          error={errors.entryDate?.message}
        />
        <div className="launch-situation">
          <Controller
            control={control}
            name="isReceived"
            render={({ field }) => (
              <SegmentedControl<'true' | 'false'>
                label="Situação"
                required
                stretch
                value={boolToSegment(field.value)}
                options={[
                  { value: 'true', label: 'Recebida' },
                  { value: 'false', label: 'Pendente', accent: 'gold' },
                ]}
                onChange={(value) => field.onChange(value === 'true')}
                error={errors.isReceived?.message}
              />
            )}
          />
          <Reveal open={isReceived === true}>
            <Input
              label="Data do recebimento"
              type="date"
              error={errors.receivedDate?.message}
              {...register('receivedDate')}
            />
          </Reveal>
        </div>
      </FormSection>

      <FormSection title="Classificação">
        <Controller
          control={control}
          name="isPlanned"
          render={({ field }) => (
            <SegmentedControl<'true' | 'false'>
              label="Planejamento"
              required
              stretch
              value={boolToSegment(field.value)}
              options={[
                { value: 'true', label: 'Planejada' },
                { value: 'false', label: 'Não planejada' },
              ]}
              onChange={(value) => field.onChange(value === 'true')}
              error={errors.isPlanned?.message}
            />
          )}
        />
      </FormSection>

      <CountInTotalsRow register={register('countInTotals')} checked={countInTotals} />
    </LaunchForm>
  )
}
