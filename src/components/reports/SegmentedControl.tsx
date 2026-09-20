import { useId } from 'react'
import './SegmentedControl.css'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
  // Tooltip nativo — usado principalmente pra explicar POR QUE uma opção está desabilitada.
  title?: string
  // Nome acessível quando o rótulo visível é abreviado (ex.: "3M" → "Últimos 3 meses").
  ariaLabel?: string
}

interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
}

// Controle segmentado acessível (role="radiogroup"): o rótulo do grupo fica SEMPRE visível
// (texto pequeno acima) e é o nome acessível do grupo. Opção selecionada = fundo verde
// translúcido + borda verde + texto em peso 600 (não depende só de contorno). Setas do
// teclado movem a seleção entre opções habilitadas.
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  const labelId = useId()
  const enabled = options.filter((option) => !option.disabled)

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, current: T) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const index = enabled.findIndex((option) => option.value === current)
    const next =
      enabled[(index + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length]
    if (next) onChange(next.value)
  }

  return (
    <div className="segmented-control">
      <span id={labelId} className="segmented-control__label">
        {label}
      </span>
      <div className="segmented-control__group" role="radiogroup" aria-labelledby={labelId}>
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={option.disabled}
              title={option.title}
              aria-label={option.ariaLabel}
              tabIndex={selected ? 0 : -1}
              className={`segmented-control__option${selected ? ' segmented-control__option--selected' : ''}`}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => handleKeyDown(event, option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
