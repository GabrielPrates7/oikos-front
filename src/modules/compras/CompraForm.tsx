import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import type { Category } from '../categorias/categorias.types'
import { createSchema, type CreateCompraFormData } from './compras.schemas'
import './CompraForm.css'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

interface CompraFormProps {
  categories: Category[]
  error?: string | null
  submitting: boolean
  onSubmit: (data: CreateCompraFormData) => Promise<void>
  onCancel: () => void
}

export function CompraForm({ categories, error, submitting, onSubmit, onCancel }: CompraFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateCompraFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      categoryId: '',
      description: '',
      totalAmountCents: 0,
      installmentsCount: 1,
      purchaseDate: today(),
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
      className="compra-form"
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
        name="totalAmountCents"
        label="Valor total"
        error={errors.totalAmountCents?.message}
      />
      <Select
        label="Categoria"
        options={categoryOptions}
        error={errors.categoryId?.message}
        {...register('categoryId')}
      />
      <Input
        label="Parcelas"
        type="number"
        min={1}
        error={errors.installmentsCount?.message}
        {...register('installmentsCount', { valueAsNumber: true })}
      />
      <Input
        label="Data"
        type="date"
        error={errors.purchaseDate?.message}
        {...register('purchaseDate')}
      />
      <FormError message={error} />
      <div className="compra-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          Criar compra
        </Button>
      </div>
    </form>
  )
}
