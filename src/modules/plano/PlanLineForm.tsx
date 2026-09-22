import { zodResolver } from '@hookform/resolvers/zod'
import { ClipboardList } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { focusFirstInvalid } from '../../components/forms/focusFirstInvalid'
import { Field, FormSection } from '../../components/forms/LaunchFields'
import { LaunchForm } from '../../components/forms/LaunchForm'
import { SHELL_DESKTOP_QUERY } from '../../components/layout/breakpoints'
import { SegmentedControl } from '../../components/reports/SegmentedControl'
import { CategoryBadge } from '../../components/ui/CategoryBadge'
import { Combobox } from '../../components/ui/Combobox'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Input } from '../../components/ui/Input'
import { assignCategoryColors } from '../../utils/chartColors'
import { formatMonthLabel, monthRange } from '../../utils/date'
import type { Category } from '../categorias/categorias.types'
import { createLineSchema, type LineFormMode, type LineFormValues } from './plano.schemas'
import type { PlanKind, PlanLine } from './plano.types'

interface PlanLineFormProps {
  month: string
  mode: LineFormMode
  // Edição: a linha atual. Criação: opcionalmente o tipo já escolhido pelo botão "Adicionar" da lista.
  line?: PlanLine
  presetKind?: PlanKind
  categories: Category[]
  error?: string | null
  submitting: boolean
  onSubmit: (values: LineFormValues) => Promise<void>
  onCancel: () => void
}

function boolToSegment(value: boolean | undefined): 'true' | 'false' | '' {
  return value === undefined ? '' : value ? 'true' : 'false'
}

// Formulário de linha do plano no padrão dos LaunchForm (valor grande, descrição, categoria, data
// opcional, essencial/supérfluo em saídas). Em linha vinculada só valor e data são editáveis; em
// fatura, só a data. Sem valor padrão nos binários obrigatórios (tipo e essencial/supérfluo).
export function PlanLineForm({
  month,
  mode,
  line,
  presetKind,
  categories,
  error,
  submitting,
  onSubmit,
  onCancel,
}: PlanLineFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)
  const schema = useMemo(() => createLineSchema(month, mode), [month, mode])
  const { monthStart, monthEnd } = monthRange(month)
  const manual = mode === 'manual-create' || mode === 'manual-edit'

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<LineFormValues>({
    resolver: zodResolver(schema),
    shouldFocusError: false,
    defaultValues: {
      kind: line?.kind ?? presetKind,
      description: line?.description ?? '',
      amountCents: line?.planned_amount_cents ?? 0,
      categoryId: line?.category?.id ?? '',
      plannedDate:
        line?.planned_date && line.planned_date >= monthStart && line.planned_date <= monthEnd
          ? line.planned_date
          : '',
      isEssential: line?.is_essential ?? undefined,
    },
  })

  const kind = useWatch({ control, name: 'kind' })

  // Foco no valor só ao criar e só no desktop (no mobile o teclado cobriria o formulário).
  useEffect(() => {
    if (mode === 'manual-create' && window.matchMedia(SHELL_DESKTOP_QUERY).matches) {
      amountRef.current?.focus()
    }
  }, [mode])

  const kindCategories = categories.filter((category) => category.type === kind)
  const colors = assignCategoryColors(kindCategories.map((category) => category.name))
  const categoryOptions = [
    { value: '', label: 'Sem categoria' },
    ...kindCategories.map((category) => ({
      value: category.id,
      label: `${category.icon ?? '📁'} ${category.name}`,
      node: (
        <CategoryBadge
          name={category.name}
          icon={category.icon}
          color={colors.get(category.name) ?? 'var(--color-text-muted)'}
        />
      ),
    })),
  ]

  async function handleValid(values: LineFormValues) {
    if (submittingRef.current) return
    submittingRef.current = true
    try {
      await onSubmit(values)
    } finally {
      submittingRef.current = false
    }
  }

  const title =
    mode === 'manual-create'
      ? 'Nova linha manual'
      : mode === 'manual-edit'
        ? 'Editar linha manual'
        : mode === 'invoice-edit'
          ? 'Editar data da fatura'
          : 'Editar linha do plano'

  return (
    <LaunchForm
      tone="green"
      icon={<ClipboardList size={22} />}
      title={title}
      backLabel="Plano do mês"
      submitLabel={mode === 'manual-create' ? 'Adicionar ao plano' : 'Salvar alterações'}
      dirty={isDirty}
      onCancel={onCancel}
      error={error}
      submitting={submitting}
      formRef={formRef}
      onSubmit={(event) => void handleSubmit(handleValid, () => focusFirstInvalid(formRef))(event)}
    >
      <p className="plano-form-context">
        Plano de {formatMonthLabel(month)}
        {mode === 'linked-edit' && ' · valor e data planejados (o lançamento original não muda)'}
        {mode === 'invoice-edit' && ' · o valor da fatura acompanha o total atual dela'}
      </p>

      {mode !== 'invoice-edit' && (
        <div className="launch-hero">
          <CurrencyInput
            control={control}
            name="amountCents"
            label="Valor"
            requiredMark
            error={errors.amountCents?.message}
            inputRef={amountRef}
            className="launch-amount"
            inputClassName="launch-amount__input"
          />
          {manual ? (
            <Input
              label="Descrição"
              requiredMark
              type="text"
              error={errors.description?.message}
              {...register('description')}
            />
          ) : (
            <p className="plano-form-readonly">
              <span className="plano-form-readonly__label">Descrição</span>
              {line?.description}
            </p>
          )}
        </div>
      )}
      {mode === 'invoice-edit' && (
        <p className="plano-form-readonly">
          <span className="plano-form-readonly__label">Fatura</span>
          {line?.description}
        </p>
      )}

      {mode === 'manual-create' && (
        <FormSection title="Tipo">
          <div className="launch-span-2">
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <SegmentedControl<PlanKind>
                  label="Tipo da linha"
                  required
                  stretch
                  value={field.value ?? ''}
                  options={[
                    { value: 'income', label: 'Entrada' },
                    { value: 'expense', label: 'Saída' },
                  ]}
                  onChange={(value) => {
                    field.onChange(value)
                    setValue('categoryId', '')
                  }}
                  error={errors.kind?.message}
                />
              )}
            />
          </div>
        </FormSection>
      )}

      <FormSection title="Detalhes">
        {manual && (
          <Field id="categoryId" label="Categoria (opcional)" error={errors.categoryId?.message}>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Combobox
                  id="categoryId"
                  variant="field"
                  value={field.value}
                  onChange={field.onChange}
                  options={categoryOptions}
                  placeholder={kind ? 'Sem categoria' : 'Escolha o tipo primeiro'}
                  invalid={!!errors.categoryId}
                />
              )}
            />
          </Field>
        )}
        <Input
          label="Data planejada (opcional)"
          type="date"
          min={monthStart}
          max={monthEnd}
          error={errors.plannedDate?.message}
          {...register('plannedDate')}
        />
        {manual && kind === 'expense' && (
          <div className="launch-span-2">
            <Controller
              control={control}
              name="isEssential"
              render={({ field }) => (
                <SegmentedControl<'true' | 'false'>
                  label="Tipo de gasto"
                  required
                  stretch
                  value={boolToSegment(field.value)}
                  options={[
                    { value: 'true', label: 'Essencial' },
                    { value: 'false', label: 'Supérfluo' },
                  ]}
                  onChange={(value) => field.onChange(value === 'true')}
                  error={errors.isEssential?.message}
                />
              )}
            />
          </div>
        )}
      </FormSection>
    </LaunchForm>
  )
}
