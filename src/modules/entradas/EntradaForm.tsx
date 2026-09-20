import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { BooleanToggle } from '../../components/ui/BooleanToggle'
import { Button } from '../../components/ui/Button'
import { Checkbox } from '../../components/ui/Checkbox'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { nextMonthSameDay } from '../../utils/date'
import type { Account } from '../contas/contas.types'
import type { Category } from '../categorias/categorias.types'
import { createSchema, type CreateEntradaFormData } from './entradas.schemas'
import { RECEIPT_METHOD_LABELS } from './entradas.types'
import type { IncomeEntry, ReceiptMethod } from './entradas.types'
import './EntradaForm.css'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

const RECEIPT_METHOD_OPTIONS = (
  Object.entries(RECEIPT_METHOD_LABELS) as [ReceiptMethod, string][]
).map(([value, label]) => ({ value, label }))

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

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateEntradaFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      accountId: source?.account_id ?? defaultAccountId ?? '',
      categoryId: source?.category_id ?? '',
      description: source?.description ?? '',
      amountCents: source?.amount_cents ?? 0,
      entryDate: duplicateFrom
        ? nextMonthSameDay(duplicateFrom.entry_date)
        : (initialData?.entry_date ?? today()),
      receiptMethod: source?.receipt_method ?? 'pix',
      isReceived: source?.is_received,
      isPlanned: source?.is_planned,
      // Registro antigo (de antes desse campo existir) pode ter is_received=true com
      // received_date nulo — cai pra data do lançamento em vez de deixar em branco.
      receivedDate: source?.received_date ?? source?.entry_date ?? today(),
      // Marcado por padrão (fase 1 do campo "contar no total") — ?? true cobre tanto
      // criação (source undefined) quanto registro antigo (de antes desse campo existir,
      // count_in_totals viria undefined se não fosse pelo default do backend).
      countInTotals: source?.count_in_totals ?? true,
    },
  })

  const isReceived = useWatch({ control, name: 'isReceived' })
  const entryDate = useWatch({ control, name: 'entryDate' })

  // Padrão pedido: data de recebimento = mesma data do lançamento, no momento em que o
  // campo aparece — não sobrescreve se já tinha algo (edição de registro com data própria).
  useEffect(() => {
    if (isReceived && !getValues('receivedDate')) {
      setValue('receivedDate', entryDate)
    }
  }, [isReceived, entryDate, getValues, setValue])

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
      className="entrada-form"
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
        label="Forma de recebimento"
        options={RECEIPT_METHOD_OPTIONS}
        error={errors.receiptMethod?.message}
        {...register('receiptMethod')}
      />
      <Input
        label="Data"
        type="date"
        error={errors.entryDate?.message}
        {...register('entryDate')}
      />
      <Controller
        control={control}
        name="isReceived"
        render={({ field }) => (
          <BooleanToggle
            label="Recebida ou pendente?"
            value={field.value}
            options={[
              { value: true, label: 'Recebida' },
              { value: false, label: 'Pendente' },
            ]}
            onChange={field.onChange}
            error={errors.isReceived?.message}
          />
        )}
      />
      {isReceived && (
        <Input
          label="Data do recebimento"
          type="date"
          error={errors.receivedDate?.message}
          {...register('receivedDate')}
        />
      )}
      <Controller
        control={control}
        name="isPlanned"
        render={({ field }) => (
          <BooleanToggle
            label="Planejada?"
            value={field.value}
            options={[
              { value: true, label: 'Planejada' },
              { value: false, label: 'Não planejada' },
            ]}
            onChange={field.onChange}
            error={errors.isPlanned?.message}
          />
        )}
      />
      <Checkbox
        label="Contar no total geral e nos gráficos"
        {...register('countInTotals')}
      />
      <FormError message={error} />
      <div className="entrada-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initialData ? 'Salvar alterações' : 'Criar entrada'}
        </Button>
      </div>
    </form>
  )
}
