import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { BooleanToggle } from '../../components/ui/BooleanToggle'
import { Button } from '../../components/ui/Button'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import type { CreditCard } from '../cartoes/cartoes.types'
import type { Category } from '../categorias/categorias.types'
import { updateSchema, type UpdateCompraFormData } from './compras.schemas'
import type { Purchase } from './compras.types'
import './CompraForm.css'

interface CompraEditFormProps {
  purchase: Purchase
  categories: Category[]
  cards: CreditCard[]
  // true quando a compra já tem parcela paga — trava valor/parcelas/data/cartão (mesma
  // regra do backend, ver purchases.service.update). description/categoria/essencial/fixo
  // continuam livres.
  locked: boolean
  error?: string | null
  submitting: boolean
  onSubmit: (data: UpdateCompraFormData) => Promise<void>
  onCancel: () => void
}

export function CompraEditForm({
  purchase,
  categories,
  cards,
  locked,
  error,
  submitting,
  onSubmit,
  onCancel,
}: CompraEditFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UpdateCompraFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      categoryId: purchase.category_id,
      description: purchase.description,
      totalAmountCents: purchase.total_amount_cents,
      installmentsCount: purchase.installments_count,
      purchaseDate: purchase.purchase_date,
      isEssential: purchase.is_essential,
      isFixed: purchase.is_fixed,
      creditCardId: purchase.credit_card_id,
    },
  })

  const categoryOptions = [
    { value: '', label: 'Selecione uma categoria' },
    ...categories.map((category) => ({
      value: category.id,
      label: `${category.icon ?? '📁'} ${category.name}`,
    })),
  ]

  const cardOptions = cards.map((card) => ({ value: card.id, label: card.name }))

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
      <Select
        label="Categoria"
        options={categoryOptions}
        error={errors.categoryId?.message}
        {...register('categoryId')}
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

      {locked && (
        <p className="compra-form__locked-note">
          Não é possível alterar valor, parcelas, data ou cartão: esta compra já tem parcela paga.
        </p>
      )}

      <CurrencyInput
        control={control}
        name="totalAmountCents"
        label="Valor total"
        error={errors.totalAmountCents?.message}
        disabled={locked}
      />
      <Input
        label="Parcelas"
        type="number"
        min={1}
        disabled={locked}
        error={errors.installmentsCount?.message}
        {...register('installmentsCount', { valueAsNumber: true })}
      />
      <Input
        label="Data"
        type="date"
        disabled={locked}
        error={errors.purchaseDate?.message}
        {...register('purchaseDate')}
      />
      <Select
        label="Cartão"
        options={cardOptions}
        disabled={locked}
        error={errors.creditCardId?.message}
        {...register('creditCardId')}
      />

      <FormError message={error} />
      <div className="compra-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          Salvar alterações
        </Button>
      </div>
    </form>
  )
}
