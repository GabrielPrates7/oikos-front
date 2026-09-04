import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { ICON_OPTIONS } from './iconOptions'
import './IconPicker.css'

interface IconPickerProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  error?: string
}

export function IconPicker<T extends FieldValues>({
  control,
  name,
  label,
  error,
}: IconPickerProps<T>) {
  const errorId = error ? `${name}-error` : undefined

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const selected = typeof field.value === 'string' ? field.value : undefined
        return (
          <div className="ui-input">
            <span className="ui-input__label" id={`${name}-label`}>
              {label}
            </span>
            <div
              className="icon-picker"
              role="group"
              aria-labelledby={`${name}-label`}
              aria-describedby={errorId}
            >
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`icon-picker__option${icon === selected ? ' icon-picker__option--selected' : ''}`}
                  aria-pressed={icon === selected}
                  aria-label={icon}
                  onClick={() => field.onChange(icon === selected ? undefined : icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
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
