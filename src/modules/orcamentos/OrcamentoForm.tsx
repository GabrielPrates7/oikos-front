import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Select } from '../../components/ui/Select'
import type { Category } from '../categorias/categorias.types'
import { createBudgetSchema, type CreateOrcamentoFormData } from './orcamentos.schemas'
import type { Budget } from './orcamentos.types'
import './OrcamentoForm.css'

interface OrcamentoFormProps {
  categories: Category[]
  initialData?: Budget
  error?: string | null
  submitting: boolean
  onSubmit: (data: CreateOrcamentoFormData) => Promise<void>
  onCancel: () => void
}

export function OrcamentoForm({
  categories,
  initialData,
  error,
  submitting,
  onSubmit,
  onCancel,
}: OrcamentoFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateOrcamentoFormData>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      categoryId: initialData?.category_id ?? '',
      limitAmountCents: initialData?.limit_amount_cents ?? 0,
    },
  })

  const categoryOptions = [
    { value: '', label: 'Selecione uma categoria' },
    ...categories.map((category) => ({
      value: category.id,
      label: `${category.icon ?? '📁'} ${category.name}`,
    })),
  ]

  return (
    <form
      className="orcamento-form"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      <Select
        label="Categoria"
        options={categoryOptions}
        error={errors.categoryId?.message}
        {...register('categoryId')}
      />
      <CurrencyInput
        control={control}
        name="limitAmountCents"
        label="Limite"
        error={errors.limitAmountCents?.message}
      />
      <FormError message={error} />
      <div className="orcamento-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initialData ? 'Salvar alterações' : 'Criar orçamento'}
        </Button>
      </div>
    </form>
  )
}
