import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { centsToBRL, parseBRLToCents } from '../../utils/currency'
import './Input.css'

interface CurrencyInputProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  error?: string
  disabled?: boolean
}

// Controller (não register) porque o valor no form é um inteiro (centavos), mas o campo
// exibe uma string formatada — precisa de transformação nos dois sentidos.
export function CurrencyInput<T extends FieldValues>({
  control,
  name,
  label,
  error,
  disabled,
}: CurrencyInputProps<T>) {
  const errorId = error ? `${name}-error` : undefined

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const cents = typeof field.value === 'number' ? field.value : 0
        return (
          <div className="ui-input">
            <label htmlFor={name} className="ui-input__label">
              {label}
            </label>
            <input
              id={name}
              name={field.name}
              ref={field.ref}
              inputMode="numeric"
              className="ui-input__field"
              value={centsToBRL(cents)}
              disabled={disabled}
              aria-invalid={!!error}
              aria-describedby={errorId}
              onChange={(event) => field.onChange(parseBRLToCents(event.target.value))}
              onBlur={field.onBlur}
            />
            {error && (
              <p id={errorId} className="ui-input__error" role="alert">
                {error}
              </p>
            )}
          </div>
        )
      }}
    />
  )
}
