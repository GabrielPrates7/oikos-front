import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { CurrencyInput } from '../../components/ui/CurrencyInput'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import type { Account } from '../contas/contas.types'
import { createSchema, type CreateTransferenciaFormData } from './transferencias.schemas'
import './TransferenciaForm.css'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

interface TransferenciaFormProps {
  // Preenchido só vindo do atalho "Movimentar" de ContasList/CartoesList — a conta de
  // onde a transferência sai.
  defaultFromAccountId?: string
  accounts: Account[]
  error?: string | null
  submitting: boolean
  onSubmit: (data: CreateTransferenciaFormData) => Promise<void>
  onCancel: () => void
}

export function TransferenciaForm({
  defaultFromAccountId,
  accounts,
  error,
  submitting,
  onSubmit,
  onCancel,
}: TransferenciaFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateTransferenciaFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      fromAccountId: defaultFromAccountId ?? '',
      toAccountId: '',
      amountCents: 0,
      transferDate: today(),
      description: '',
    },
  })

  const accountOptions = [
    { value: '', label: 'Selecione uma conta' },
    ...accounts.map((account) => ({ value: account.id, label: account.name })),
  ]

  return (
    <form
      className="transferencia-form"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      <Select
        label="Conta de origem"
        options={accountOptions}
        error={errors.fromAccountId?.message}
        {...register('fromAccountId')}
      />
      <Select
        label="Conta de destino"
        options={accountOptions}
        error={errors.toAccountId?.message}
        {...register('toAccountId')}
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
        error={errors.transferDate?.message}
        {...register('transferDate')}
      />
      <Input
        label="Descrição (opcional)"
        type="text"
        error={errors.description?.message}
        {...register('description')}
      />
      <FormError message={error} />
      <div className="transferencia-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          Criar transferência
        </Button>
      </div>
    </form>
  )
}
