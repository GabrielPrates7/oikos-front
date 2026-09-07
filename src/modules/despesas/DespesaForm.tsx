import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { BooleanToggle } from '../../components/ui/BooleanToggle'
import { Button } from '../../components/ui/Button'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
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
  // Preenchido só na criação, vindo do atalho "Movimentar" de ContasList/CartoesList —
  // nunca junto com initialData (edição já traz a conta certa em initialData.account_id).
  defaultAccountId?: string
  accounts: Account[]
  categories: Category[]
  error?: string | null
  submitting: boolean
  onSubmit: (data: CreateDespesaFormData) => Promise<void>
  onCancel: () => void
}

export function DespesaForm({
  initialData,
  defaultAccountId,
  accounts,
  categories,
  error,
  submitting,
  onSubmit,
  onCancel,
}: DespesaFormProps) {
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
      accountId: initialData?.account_id ?? defaultAccountId ?? '',
      categoryId: initialData?.category_id ?? '',
      description: initialData?.description ?? '',
      amountCents: initialData?.amount_cents ?? 0,
      paymentMethod: initialData?.payment_method ?? 'debit',
      expenseDate: initialData?.expense_date ?? today(),
      isEssential: initialData?.is_essential,
      isFixed: initialData?.is_fixed,
      isPaid: initialData?.is_paid,
      isPlanned: initialData?.is_planned,
      // Registro antigo (de antes desse campo existir) pode ter is_paid=true com paid_date
      // nulo — cai pra data do lançamento em vez de deixar o campo em branco.
      paidDate: initialData?.paid_date ?? initialData?.expense_date ?? today(),
    },
  })

  const isPaid = useWatch({ control, name: 'isPaid' })
  const expenseDate = useWatch({ control, name: 'expenseDate' })

  // Padrão pedido: data de pagamento = mesma data do lançamento, no momento em que o
  // campo aparece (alternar pra "Pago" com a data ainda vazia) — não sobrescreve se já
  // tinha algo (edição de um registro que já tem sua própria data de pagamento).
  useEffect(() => {
    if (isPaid && !getValues('paidDate')) {
      setValue('paidDate', expenseDate)
    }
  }, [isPaid, expenseDate, getValues, setValue])

  const accountOptions = [
    { value: '', label: 'Selecione uma conta' },
    ...accounts.map((account) => ({ value: account.id, label: account.name })),
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
        label="Conta"
        options={accountOptions}
        error={errors.accountId?.message}
        {...register('accountId')}
      />
      <Select
        label="Categoria"
        options={categoryOptions}
        error={errors.categoryId?.message}
        {...register('categoryId')}
      />
      <Select
        label="Forma de pagamento"
        options={PAYMENT_METHOD_OPTIONS}
        error={errors.paymentMethod?.message}
        {...register('paymentMethod')}
      />
      <Input
        label="Data"
        type="date"
        error={errors.expenseDate?.message}
        {...register('expenseDate')}
      />
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
