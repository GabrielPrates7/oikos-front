import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { createSchema, type CreateContaFormData } from './contas.schemas'
import { ACCOUNT_TYPE_LABELS } from './contas.types'
import type { Account } from './contas.types'
import './ContaForm.css'

const TYPE_OPTIONS = (Object.entries(ACCOUNT_TYPE_LABELS) as [Account['type'], string][]).map(
  ([value, label]) => ({ value, label }),
)

interface ContaFormProps {
  initialData?: Account
  error?: string | null
  submitting: boolean
  onSubmit: (data: CreateContaFormData) => Promise<void>
  onCancel: () => void
}

export function ContaForm({ initialData, error, submitting, onSubmit, onCancel }: ContaFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateContaFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      bankName: initialData?.bank_name ?? '',
      type: initialData?.type ?? 'checking',
      initialBalanceCents: initialData?.initial_balance_cents ?? 0,
    },
  })

  return (
    <form
      className="conta-form"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      <Input label="Nome" type="text" error={errors.name?.message} {...register('name')} />
      <Input
        label="Banco (opcional)"
        type="text"
        error={errors.bankName?.message}
        {...register('bankName')}
      />
      <Select
        label="Tipo"
        options={TYPE_OPTIONS}
        error={errors.type?.message}
        {...register('type')}
      />
      <CurrencyInput
        control={control}
        name="initialBalanceCents"
        label="Saldo inicial"
        error={errors.initialBalanceCents?.message}
      />
      <FormError message={error} />
      <div className="conta-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initialData ? 'Salvar alterações' : 'Criar conta'}
        </Button>
      </div>
    </form>
  )
}
