import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { BooleanToggle } from '../../components/ui/BooleanToggle'
import { Button } from '../../components/ui/Button'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { nextMonthSameDay } from '../../utils/date'
import type { CreditCard } from '../cartoes/cartoes.types'
import type { Account } from '../contas/contas.types'
import type { Category } from '../categorias/categorias.types'
import { createSchema, type CreateDespesaFormData } from './despesas.schemas'
import { PAYMENT_METHOD_LABELS } from './despesas.types'
import type { Expense, PaymentMethod } from './despesas.types'
import './DespesaForm.css'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

const PAYMENT_METHOD_OPTIONS = (
  Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]
).map(([value, label]) => ({ value, label }))

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

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateDespesaFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      accountId: source?.account_id ?? defaultAccountId ?? '',
      categoryId: source?.category_id ?? '',
      description: source?.description ?? '',
      amountCents: source?.amount_cents ?? 0,
      paymentMethod: source?.payment_method ?? 'debit',
      expenseDate: duplicateFrom
        ? nextMonthSameDay(duplicateFrom.expense_date)
        : (initialData?.expense_date ?? today()),
      isEssential: source?.is_essential,
      isFixed: source?.is_fixed,
      isPaid: source?.is_paid,
      isPlanned: source?.is_planned,
      // Registro antigo (de antes desse campo existir) pode ter is_paid=true com paid_date
      // nulo — cai pra data do lançamento em vez de deixar o campo em branco.
      paidDate: source?.paid_date ?? source?.expense_date ?? today(),
      creditCardId: '',
      installmentsCount: 1,
    },
  })

  const paymentMethod = useWatch({ control, name: 'paymentMethod' })
  const isPaid = useWatch({ control, name: 'isPaid' })
  const expenseDate = useWatch({ control, name: 'expenseDate' })
  const isCreditCard = paymentMethod === 'credit_card'

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
    : [...PAYMENT_METHOD_OPTIONS, { value: 'credit_card', label: 'Cartão de crédito' }]

  const accountOptions = [
    { value: '', label: 'Selecione uma conta' },
    ...accounts.map((account) => ({ value: account.id, label: account.name })),
  ]
  const cardOptions = [
    { value: '', label: 'Selecione um cartão' },
    ...cards.map((card) => ({ value: card.id, label: card.name })),
  ]
  const categoryOptions = [
    { value: '', label: 'Selecione uma categoria' },
    ...categories.map((category) => ({
      value: category.id,
      label: `${category.icon ?? '📁'} ${category.name}`,
    })),
  ]

  return (
    <form
      className="despesa-form"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      <Input
        label="Descrição"
        type="text"
        error={errors.description?.message}
        {...register('description')}
      />
      <CurrencyInput
        control={control}
        name="amountCents"
        label="Valor"
        error={errors.amountCents?.message}
      />
      <Select
        label="Categoria"
        options={categoryOptions}
        error={errors.categoryId?.message}
        {...register('categoryId')}
      />
      <Select
        label="Forma de pagamento"
        options={paymentMethodOptions}
        error={errors.paymentMethod?.message}
        {...register('paymentMethod')}
      />
      {isCreditCard ? (
        <>
          <Select
            label="Cartão"
            options={cardOptions}
            error={errors.creditCardId?.message}
            {...register('creditCardId')}
          />
          <Input
            label="Parcelas"
            type="number"
            min={1}
            error={errors.installmentsCount?.message}
            {...register('installmentsCount', { valueAsNumber: true })}
          />
        </>
      ) : (
        <Select
          label="Conta"
          options={accountOptions}
          error={errors.accountId?.message}
          {...register('accountId')}
        />
      )}
      <Input
        label="Data"
        type="date"
        error={errors.expenseDate?.message}
        {...register('expenseDate')}
      />
      {!isCreditCard && (
        <>
          <Controller
            control={control}
            name="isPaid"
            render={({ field }) => (
              <BooleanToggle
                label="Pago(a) ou pendente?"
                value={field.value}
                options={[
                  { value: true, label: 'Pago(a)' },
                  { value: false, label: 'Pendente' },
                ]}
                onChange={field.onChange}
                error={errors.isPaid?.message}
              />
            )}
          />
          {isPaid && (
            <Input
              label="Data do pagamento"
              type="date"
              error={errors.paidDate?.message}
              {...register('paidDate')}
            />
          )}
        </>
      )}
      <Controller
        control={control}
        name="isPlanned"
        render={({ field }) => (
          <BooleanToggle
            label="Planejado?"
            value={field.value}
            options={[
              { value: true, label: 'Planejado' },
              { value: false, label: 'Não planejado' },
            ]}
            onChange={field.onChange}
            error={errors.isPlanned?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="isEssential"
        render={({ field }) => (
          <BooleanToggle
            label="Essencial ou supérfluo?"
            value={field.value}
            options={[
              { value: true, label: 'Essencial' },
              { value: false, label: 'Supérfluo' },
            ]}
            onChange={field.onChange}
            error={errors.isEssential?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="isFixed"
        render={({ field }) => (
          <BooleanToggle
            label="É gasto fixo?"
            value={field.value}
            options={[
              { value: true, label: 'Sim' },
              { value: false, label: 'Não' },
            ]}
            onChange={field.onChange}
            error={errors.isFixed?.message}
          />
        )}
      />
      <FormError message={error} />
      <div className="despesa-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initialData ? 'Salvar alterações' : 'Criar despesa'}
        </Button>
      </div>
    </form>
  )
}
