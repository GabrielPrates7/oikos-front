import './BooleanToggle.css'

interface BooleanToggleOption {
  value: boolean
  label: string
}

interface BooleanToggleProps {
  label: string
  value: boolean | undefined
  options: [BooleanToggleOption, BooleanToggleOption]
  onChange: (value: boolean) => void
  error?: string
}

// Escolha binária SEM valor pré-marcado — nenhum dos dois botões começa "ativo" quando
// value é undefined (criação), forçando uma decisão intencional. Em edição, value já vem
// preenchido com o dado atual, então um dos botões aparece ativo desde o início.
export function BooleanToggle({ label, value, options, onChange, error }: BooleanToggleProps) {
  return (
    <div className="boolean-toggle-field">
      <span className="boolean-toggle-field__label">{label}</span>
      <div className="boolean-toggle" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            className={`boolean-toggle__button${value === option.value ? ' boolean-toggle__button--active' : ''}`}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && (
        <p className="boolean-toggle-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
