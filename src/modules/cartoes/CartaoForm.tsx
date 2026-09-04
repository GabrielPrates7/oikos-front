import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Input } from '../../components/ui/Input'
import { createSchema, type CreateCartaoFormData } from './cartoes.schemas'
import type { CreditCard } from './cartoes.types'
import './CartaoForm.css'

interface CartaoFormProps {
  initialData?: CreditCard
  error?: string | null
  submitting: boolean
  onSubmit: (data: CreateCartaoFormData) => Promise<void>
  onCancel: () => void
}

export function CartaoForm({ initialData, error, submitting, onSubmit, onCancel }: CartaoFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateCartaoFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      brand: initialData?.brand ?? '',
      creditLimitCents: initialData?.credit_limit_cents ?? 0,
      closingDay: initialData?.closing_day ?? 1,
      dueDay: initialData?.due_day ?? 1,
    },
  })

  return (
    <form
      className="cartao-form"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      <Input label="Nome" type="text" error={errors.name?.message} {...register('name')} />
      <Input
        label="Bandeira (opcional)"
        type="text"
        error={errors.brand?.message}
        {...register('brand')}
      />
      <CurrencyInput
        control={control}
        name="creditLimitCents"
        label="Limite"
        error={errors.creditLimitCents?.message}
      />
      <Input
        label="Dia de fechamento"
        type="number"
        min={1}
        max={31}
        error={errors.closingDay?.message}
        {...register('closingDay', { valueAsNumber: true })}
      />
      <Input
        label="Dia de vencimento"
        type="number"
        min={1}
        max={31}
        error={errors.dueDay?.message}
        {...register('dueDay', { valueAsNumber: true })}
      />
      <FormError message={error} />
      <div className="cartao-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initialData ? 'Salvar alterações' : 'Criar cartão'}
        </Button>
      </div>
    </form>
  )
}
