import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import type { Account } from '../contas/contas.types'
import { createContributionSchema, type CreateAporteFormData } from './metas.schemas'
import './AporteForm.css'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

interface AporteFormProps {
  accounts: Account[]
  error?: string | null
  submitting: boolean
  onSubmit: (data: CreateAporteFormData) => Promise<void>
  onCancel: () => void
}

export function AporteForm({ accounts, error, submitting, onSubmit, onCancel }: AporteFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateAporteFormData>({
    resolver: zodResolver(createContributionSchema),
    defaultValues: {
      accountId: '',
      amountCents: 0,
      contributionDate: today(),
    },
  })

  const accountOptions = [
    { value: '', label: 'Selecione uma conta' },
    ...accounts.map((account) => ({ value: account.id, label: account.name })),
  ]

  return (
    <form
      className="aporte-form"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      <Select
        label="Conta"
        options={accountOptions}
        error={errors.accountId?.message}
        {...register('accountId')}
      />
      <CurrencyInput
        control={control}
        name="amountCents"
        label="Valor"
        error={errors.amountCents?.message}
      />
      <Input
        label="Data"
        type="date"
        error={errors.contributionDate?.message}
        {...register('contributionDate')}
      />
      <FormError message={error} />
      <div className="aporte-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          Registrar aporte
        </Button>
      </div>
    </form>
  )
}
