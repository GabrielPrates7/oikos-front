import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Input } from '../../components/ui/Input'
import { createGoalSchema, type CreateMetaFormData } from './metas.schemas'
import type { FinancialGoal } from './metas.types'
import './MetaForm.css'

interface MetaFormProps {
  initialData?: FinancialGoal
  error?: string | null
  submitting: boolean
  onSubmit: (data: CreateMetaFormData) => Promise<void>
  onCancel: () => void
}

export function MetaForm({ initialData, error, submitting, onSubmit, onCancel }: MetaFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateMetaFormData>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      targetAmountCents: initialData?.target_amount_cents ?? 0,
      targetDate: initialData?.target_date ?? '',
    },
  })

  return (
    <form className="meta-form" onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
      <Input label="Nome" type="text" error={errors.name?.message} {...register('name')} />
      <CurrencyInput
        control={control}
        name="targetAmountCents"
        label="Valor alvo"
        error={errors.targetAmountCents?.message}
      />
      <Input
        label="Data alvo"
        type="date"
        error={errors.targetDate?.message}
        {...register('targetDate')}
      />
      <FormError message={error} />
      <div className="meta-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initialData ? 'Salvar alterações' : 'Criar meta'}
        </Button>
      </div>
    </form>
  )
}
