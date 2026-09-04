import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { IconPicker } from '../../components/ui/IconPicker'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { createSchema, type CreateCategoriaFormData } from './categorias.schemas'
import { CATEGORY_TYPE_LABELS } from './categorias.types'
import type { Category } from './categorias.types'
import './CategoriaForm.css'

const TYPE_OPTIONS = (Object.entries(CATEGORY_TYPE_LABELS) as [Category['type'], string][]).map(
  ([value, label]) => ({ value, label }),
)

interface CategoriaFormProps {
  initialData?: Category
  error?: string | null
  submitting: boolean
  onSubmit: (data: CreateCategoriaFormData) => Promise<void>
  onCancel: () => void
}

export function CategoriaForm({
  initialData,
  error,
  submitting,
  onSubmit,
  onCancel,
}: CategoriaFormProps) {
  const isEdit = !!initialData
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateCategoriaFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      type: initialData?.type ?? 'expense',
      icon: initialData?.icon ?? undefined,
    },
  })

  return (
    <form
      className="categoria-form"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      <Input label="Nome" type="text" error={errors.name?.message} {...register('name')} />
      {isEdit ? (
        <p className="categoria-form__type-readonly">
          Tipo: {CATEGORY_TYPE_LABELS[initialData.type]}
        </p>
      ) : (
        <Select
          label="Tipo"
          options={TYPE_OPTIONS}
          error={errors.type?.message}
          {...register('type')}
        />
      )}
      <IconPicker control={control} name="icon" label="Ícone" error={errors.icon?.message} />
      <FormError message={error} />
      <div className="categoria-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {isEdit ? 'Salvar alterações' : 'Criar categoria'}
        </Button>
      </div>
    </form>
  )
}
