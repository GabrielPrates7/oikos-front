import { zodResolver } from '@hookform/resolvers/zod'
import { Banknote, CreditCard as CreditCardIcon, Landmark, TrendingDown, Zap } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { SegmentedControl } from '../../components/reports/SegmentedControl'
import { focusFirstInvalid } from '../../components/forms/focusFirstInvalid'
import {
  CardSwatch,
  CountInTotalsRow,
  DateField,
  Field,
  FormSection,
  InstallmentsStepper,
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
import type { CreditCard } from '../cartoes/cartoes.types'
import type { Account } from '../contas/contas.types'
import type { Category } from '../categorias/categorias.types'
import { createSchema, type CreateDespesaFormData } from './despesas.schemas'
import { PAYMENT_METHOD_LABELS } from './despesas.types'
import type { Expense, PaymentMethod } from './despesas.types'

type LaunchPaymentMethod = PaymentMethod | 'credit_card'

const PAYMENT_METHOD_ICONS: Record<LaunchPaymentMethod, React.ReactNode> = {
  debit: <Landmark size={16} />,
  cash: <Banknote size={16} />,
  pix: <Zap size={16} />,
  credit_card: <CreditCardIcon size={16} />,
}

const PAYMENT_METHOD_OPTIONS = (
  Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]
).map(([value, label]) => ({ value, label, icon: PAYMENT_METHOD_ICONS[value] }))

// Booleanos obrigatórios sem valor padrão: undefined = nenhuma opção marcada.
function boolToSegment(value: boolean | undefined): 'true' | 'false' | '' {
  return value === undefined ? '' : value ? 'true' : 'false'
}

interface DespesaFormProps {
  initialData?: Expense
  // Preenchido só na criação, vindo do botão "Duplicar" de DespesasList — nunca junto com
  // initialData (edição não duplica). Mesmos dados do original, exceto a data (sugerida pro
  // mês seguinte, editável) — ver cálculo de expenseDate abaixo.
  duplicateFrom?: Expense
  // Preenchido só na criação, vindo do atalho "Movimentar" de ContasList/CartoesList —
  // nunca junto com initialData (edição já traz a conta certa em initialData.account_id).
  defaultAccountId?: string
  accounts: Account[]
  // Só cartões ativos — usado quando "Forma de pagamento" é "Cartão de crédito". Uma
  // despesa já lançada nunca vira compra de cartão editando, então isso só importa na
  // criação (ver paymentMethodOptions abaixo).
  cards: CreditCard[]
  categories: Category[]
  error?: string | null
  submitting: boolean
  onSubmit: (data: CreateDespesaFormData) => Promise<void>
  onCancel: () => void
}

// Só apresentação: campos, validações (zod), regras e o payload continuam os mesmos de antes
// (inclusive "Cartão de crédito", que só existe na criação e vira compra parcelada).
export function DespesaForm({
  initialData,
  duplicateFrom,
  defaultAccountId,
  accounts,
  cards,
  categories,
  error,
  submitting,
  onSubmit,
  onCancel,
}: DespesaFormProps) {
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
  } = useForm<CreateDespesaFormData>({
    resolver: zodResolver(createSchema),
    // O foco no primeiro campo inválido é feito por focusFirstInvalid (ordem da tela; inclui
    // Combobox e segmentos, que o RHF não alcança sozinho).
    shouldFocusError: false,
    defaultValues: {
      accountId: source?.account_id ?? defaultAccountId ?? '',
      categoryId: source?.category_id ?? '',
      description: source?.description ?? '',
      amountCents: source?.amount_cents ?? 0,
      paymentMethod: source?.payment_method ?? 'debit',
      expenseDate: duplicateFrom
        ? nextMonthSameDay(duplicateFrom.expense_date)
        : (initialData?.expense_date ?? todayInSaoPaulo()),
      // Sem valor padrão de propósito (escolha obrigatória) — igual ao formulário anterior.
      isEssential: source?.is_essential,
      isFixed: source?.is_fixed,
      isPaid: source?.is_paid,
      isPlanned: source?.is_planned,
      // Registro antigo (de antes desse campo existir) pode ter is_paid=true com paid_date
      // nulo — cai pra data do lançamento em vez de deixar o campo em branco.
      paidDate: source?.paid_date ?? source?.expense_date ?? todayInSaoPaulo(),
      creditCardId: '',
      installmentsCount: 1,
      // Marcado por padrão (fase 1 do campo "contar no total") — ?? true cobre tanto
      // criação (source undefined) quanto registro antigo (de antes desse campo existir).
      countInTotals: source?.count_in_totals ?? true,
    },
  })

  const paymentMethod = useWatch({ control, name: 'paymentMethod' })
  const isPaid = useWatch({ control, name: 'isPaid' })
  const expenseDate = useWatch({ control, name: 'expenseDate' })
  const installmentsCount = useWatch({ control, name: 'installmentsCount' })
  const countInTotals = useWatch({ control, name: 'countInTotals' })
  const isCreditCard = paymentMethod === 'credit_card'

  // Foco automático no valor SÓ ao criar e SÓ no desktop (>= 768px): no mobile o teclado
  // cobriria o formulário e causaria salto de rolagem.
  useEffect(() => {
    if (!initialData && window.matchMedia(SHELL_DESKTOP_QUERY).matches) {
      amountRef.current?.focus()
    }
  }, [initialData])

  // Padrão pedido: data de pagamento = mesma data do lançamento, no momento em que o
  // campo aparece (alternar pra "Pago" com a data ainda vazia) — não sobrescreve se já
  // tinha algo (edição de um registro que já tem sua própria data de pagamento).
  useEffect(() => {
    if (isPaid && !getValues('paidDate')) {
      setValue('paidDate', expenseDate)
    }
  }, [isPaid, expenseDate, getValues, setValue])

  // "Cartão de crédito" só existe na criação — editar uma despesa já lançada não pode
  // virar uma compra parcelada (são recursos diferentes, com edição/exclusão próprias).
  const paymentMethodOptions = initialData
    ? PAYMENT_METHOD_OPTIONS
    : [
        ...PAYMENT_METHOD_OPTIONS,
        {
          value: 'credit_card' as const,
          label: 'Cartão de crédito',
          icon: PAYMENT_METHOD_ICONS.credit_card,
        },
      ]

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
  const cardOptions = cards.map((card) => ({
    value: card.id,
    label: card.name,
    node: <CardSwatch name={card.name} />,
  }))

  // Trava de duplo envio: o estado submitting da página só chega no próximo render; o ref cobre
  // dois cliques/Enter dentro do mesmo instante.
  async function handleValid(data: CreateDespesaFormData) {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      await onSubmit(data)
    } finally {
      submittingRef.current = false
    }
  }

  const booleanSegments = (
    name: 'isEssential' | 'isFixed' | 'isPlanned',
    label: string,
    options: [string, string],
    message: string | undefined,
  ) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SegmentedControl<'true' | 'false'>
          label={label}
          tone="red"
          required
          stretch
          value={boolToSegment(field.value)}
          options={[
            { value: 'true', label: options[0] },
            { value: 'false', label: options[1] },
          ]}
          onChange={(value) => field.onChange(value === 'true')}
          error={message}
        />
      )}
    />
  )

  return (
    <LaunchForm
      tone="red"
      icon={<TrendingDown size={22} />}
      title={initialData ? 'Editar despesa' : 'Nova despesa'}
      backLabel="Despesas"
      submitLabel={initialData ? 'Salvar alterações' : 'Salvar despesa'}
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
        {isCreditCard ? (
          <Field id="creditCardId" label="Cartão" required error={errors.creditCardId?.message}>
            <Controller
              control={control}
              name="creditCardId"
              render={({ field }) => (
                <Combobox
                  id="creditCardId"
                  variant="field"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={cardOptions}
                  placeholder="Selecione um cartão"
                  invalid={!!errors.creditCardId}
                  required
                  describedBy={errors.creditCardId ? 'creditCardId-error' : undefined}
                />
              )}
            />
          </Field>
        ) : (
          <Field id="accountId" label="Conta" required error={errors.accountId?.message}>
            <Controller
              control={control}
              name="accountId"
              render={({ field }) => (
                <Combobox
                  id="accountId"
                  variant="field"
                  value={field.value ?? ''}
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
        )}
        <div className="launch-span-2">
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <SegmentedControl<LaunchPaymentMethod>
                label="Forma de pagamento"
                tone="red"
                stretch
                layout="grid2"
                value={field.value}
                options={paymentMethodOptions}
                onChange={field.onChange}
                error={errors.paymentMethod?.message}
              />
            )}
          />
        </div>
        {isCreditCard && (
          <InstallmentsStepper
            id="installmentsCount"
            label="Parcelas"
            register={register('installmentsCount', { valueAsNumber: true })}
            value={installmentsCount}
            onChange={(next) =>
              setValue('installmentsCount', next, { shouldDirty: true, shouldValidate: true })
            }
            error={errors.installmentsCount?.message}
          />
        )}
      </FormSection>

      <FormSection title="Data e situação">
        <DateField
          id="expenseDate"
          label="Data"
          register={register('expenseDate')}
          value={expenseDate}
          onPick={(iso) =>
            setValue('expenseDate', iso, { shouldDirty: true, shouldValidate: true })
          }
          error={errors.expenseDate?.message}
        />
        {!isCreditCard && (
          <div className="launch-situation">
            <Controller
              control={control}
              name="isPaid"
              render={({ field }) => (
                <SegmentedControl<'true' | 'false'>
                  label="Situação"
                  tone="red"
                  required
                  stretch
                  value={boolToSegment(field.value)}
                  options={[
                    { value: 'true', label: 'Paga' },
                    { value: 'false', label: 'Pendente', accent: 'red' },
                  ]}
                  onChange={(value) => field.onChange(value === 'true')}
                  error={errors.isPaid?.message}
                />
              )}
            />
            <Reveal open={isPaid === true}>
              <Input
                label="Data do pagamento"
                type="date"
                error={errors.paidDate?.message}
                {...register('paidDate')}
              />
            </Reveal>
          </div>
        )}
      </FormSection>

      <FormSection title="Classificação">
        {booleanSegments(
          'isEssential',
          'Tipo',
          ['Essencial', 'Supérfluo'],
          errors.isEssential?.message,
        )}
        {booleanSegments('isFixed', 'Gasto fixo', ['Sim', 'Não'], errors.isFixed?.message)}
        {booleanSegments(
          'isPlanned',
          'Planejamento',
          ['Planejado', 'Não planejado'],
          errors.isPlanned?.message,
        )}
      </FormSection>

      {/* Não se aplica a compra no cartão — purchases (installments) não tem esse campo, só
          income_entries/expenses (fase 1 do escopo). Some da UI nesse modo pra não mostrar um
          controle que seria silenciosamente ignorado. */}
      {!isCreditCard && (
        <CountInTotalsRow register={register('countInTotals')} checked={countInTotals} />
      )}
    </LaunchForm>
  )
}
