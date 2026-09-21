import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { NotesField } from '../../components/forms/NotesField'
import { BooleanToggle } from '../../components/ui/BooleanToggle'
import { Button } from '../../components/ui/Button'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { nextMonthSameDay } from '../../utils/date'
import type { Category } from '../categorias/categorias.types'
import { createSchema, type CreateCompraFormData } from './compras.schemas'
import type { Purchase } from './compras.types'
import './CompraForm.css'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

interface CompraFormProps {
  categories: Category[]
  // Preenchido só vindo do botão "Duplicar" do histórico de compras — mesmos dados da
  // compra original, exceto a data (sugerida pro mês seguinte, editável). Mesmo padrão de
  // DespesaForm/EntradaForm.duplicateFrom; sempre cria uma compra nova ao confirmar.
  duplicateFrom?: Purchase
  error?: string | null
  submitting: boolean
  onSubmit: (data: CreateCompraFormData) => Promise<void>
  onCancel: () => void
}

export function CompraForm({
  categories,
  duplicateFrom,
  error,
  submitting,
  onSubmit,
  onCancel,
}: CompraFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateCompraFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      categoryId: duplicateFrom?.category_id ?? '',
      description: duplicateFrom?.description ?? '',
      totalAmountCents: duplicateFrom?.total_amount_cents ?? 0,
      installmentsCount: duplicateFrom?.installments_count ?? 1,
      purchaseDate: duplicateFrom ? nextMonthSameDay(duplicateFrom.purchase_date) : today(),
      isEssential: duplicateFrom?.is_essential,
      isFixed: duplicateFrom?.is_fixed,
      isPlanned: duplicateFrom?.is_planned,
      // Observação: '' = sem observação (na criação só vai no payload se preenchida). Duplicar copia.
      notes: duplicateFrom?.notes ?? '',
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
      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <NotesField
            id="compra-notes"
            value={field.value ?? ''}
            onChange={field.onChange}
            defaultOpen={!!duplicateFrom?.notes}
            error={errors.notes?.message}
          />
        )}
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
