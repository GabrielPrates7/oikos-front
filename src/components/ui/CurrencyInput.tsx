import type { Ref } from 'react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { centsToBRL, parseBRLToCents } from '../../utils/currency'
import './Input.css'

interface CurrencyInputProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  error?: string
  disabled?: boolean
  requiredMark?: boolean
  // Opcionais (formulários de Entrada/Despesa): ref do <input> (foco automático) e classes extras.
  inputRef?: Ref<HTMLInputElement>
  className?: string
  inputClassName?: string
}

// Controller (não register) porque o valor no form é um inteiro (centavos), mas o campo
// exibe uma string formatada — precisa de transformação nos dois sentidos.
export function CurrencyInput<T extends FieldValues>({
  control,
  name,
  label,
  error,
  disabled,
  requiredMark,
  inputRef,
  className,
  inputClassName,
}: CurrencyInputProps<T>) {
  const errorId = error ? `${name}-error` : undefined

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const cents = typeof field.value === 'number' ? field.value : 0
        return (
          <div className={`ui-input${className ? ` ${className}` : ''}`}>
            <label htmlFor={name} className="ui-input__label">
              {label}
              {requiredMark && (
                <span className="ui-input__required" aria-hidden="true">
                  {' '}
                  *
                </span>
              )}
            </label>
            <input
              id={name}
              name={field.name}
              ref={(element) => {
                field.ref(element)
                if (typeof inputRef === 'function') inputRef(element)
                else if (inputRef) inputRef.current = element
              }}
              inputMode="numeric"
              className={`ui-input__field${inputClassName ? ` ${inputClassName}` : ''}`}
              value={centsToBRL(cents)}
              disabled={disabled}
              aria-invalid={!!error}
              aria-required={requiredMark || undefined}
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
