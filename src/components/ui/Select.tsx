import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import './Input.css'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: SelectOption[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, id, name, options, ...rest },
  ref,
) {
  const selectId = id ?? name
  const errorId = error && selectId ? `${selectId}-error` : undefined

  return (
    <div className="ui-input">
      <label htmlFor={selectId} className="ui-input__label">
        {label}
      </label>
      <select
        id={selectId}
        name={name}
        ref={ref}
        className="ui-input__field"
        aria-invalid={!!error}
        aria-describedby={errorId}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="ui-input__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})
