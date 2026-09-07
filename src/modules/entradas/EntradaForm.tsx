import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import type { Account } from '../contas/contas.types'
import type { Category } from '../categorias/categorias.types'
import { createSchema, type CreateEntradaFormData } from './entradas.schemas'
import type { IncomeEntry } from './entradas.types'
import './EntradaForm.css'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

interface EntradaFormProps {
  initialData?: IncomeEntry
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
  defaultAccountId,
  accounts,
  categories,
  error,
  submitting,
  onSubmit,
  onCancel,
}: EntradaFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateEntradaFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      accountId: initialData?.account_id ?? defaultAccountId ?? '',
      categoryId: initialData?.category_id ?? '',
      description: initialData?.description ?? '',
      amountCents: initialData?.amount_cents ?? 0,
      entryDate: initialData?.entry_date ?? today(),
    },
  })

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
      <Input
        label="Data"
        type="date"
        error={errors.entryDate?.message}
        {...register('entryDate')}
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
