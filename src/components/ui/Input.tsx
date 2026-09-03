import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import './Input.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

// forwardRef + spread de ...rest é o que deixa esse componente compor direto com
// react-hook-form: <Input label="E-mail" error={errors.email?.message} {...register('email')} />
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, name, ...rest },
  ref,
) {
  const inputId = id ?? name
  const errorId = error && inputId ? `${inputId}-error` : undefined

  return (
    <div className="ui-input">
      <label htmlFor={inputId} className="ui-input__label">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        ref={ref}
        className="ui-input__field"
        aria-invalid={!!error}
        aria-describedby={errorId}
        {...rest}
      />
      {error && (
        <p id={errorId} className="ui-input__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})
