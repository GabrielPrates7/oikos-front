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
        {...rest}
      />
      {error && <p className="ui-input__error">{error}</p>}
    </div>
  )
})
