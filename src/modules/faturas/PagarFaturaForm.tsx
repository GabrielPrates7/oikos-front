import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormError } from '../../components/feedback/FormError'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import type { Account } from '../contas/contas.types'
import { paySchema, type PayFormData } from './pagamento.schema'
import './PagarFaturaForm.css'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

interface PagarFaturaFormProps {
  accounts: Account[]
  error?: string | null
  submitting: boolean
  onSubmit: (data: PayFormData) => Promise<void>
}

export function PagarFaturaForm({ accounts, error, submitting, onSubmit }: PagarFaturaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PayFormData>({
    resolver: zodResolver(paySchema),
    defaultValues: {
      accountId: '',
      paymentDate: today(),
    },
  })

  const accountOptions = [
    { value: '', label: 'Selecione uma conta' },
    ...accounts.map((account) => ({ value: account.id, label: account.name })),
  ]

  return (
    <form
      className="pagar-fatura-form"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      <h2 className="pagar-fatura-form__title">Pagar fatura</h2>
      <Select
        label="Conta"
        options={accountOptions}
        error={errors.accountId?.message}
        {...register('accountId')}
      />
      <Input
        label="Data do pagamento"
        type="date"
        error={errors.paymentDate?.message}
        {...register('paymentDate')}
      />
      <FormError message={error} />
      <Button type="submit" loading={submitting}>
        Pagar fatura
      </Button>
    </form>
  )
}
