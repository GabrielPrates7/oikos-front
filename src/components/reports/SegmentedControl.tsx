import { useId, useRef } from 'react'
import type { ReactNode } from 'react'
import './SegmentedControl.css'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
  // Tooltip nativo — usado principalmente pra explicar POR QUE uma opção está desabilitada.
  title?: string
  // Nome acessível quando o rótulo visível é abreviado (ex.: "3M" → "Últimos 3 meses").
  ariaLabel?: string
  // Destaque opcional SÓ quando esta opção está selecionada (ex.: "Pendentes" nas listas de
  // Entradas/Despesas): 'gold' = tom do badge Pendente de Entradas; 'red' = o de Despesas.
  // Sem isso, o visual é o padrão do controle.
  accent?: 'gold' | 'red'
  // Ícone opcional antes do rótulo (formulários de Entrada/Despesa — forma de pagamento).
  icon?: ReactNode
}

interface SegmentedControlProps<T extends string> {
  label: string
  // '' = nenhuma opção selecionada (campo obrigatório sem valor padrão nos formulários).
  value: T | ''
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  // 'green' (padrão, o de Relatórios) | 'red' (tema de Despesas): troca só a cor da opção
  // selecionada.
  tone?: 'green' | 'red'
  // Mobile (< 768px): o grupo ocupa a largura toda, as opções dividem o espaço (flex: 1) e
  // ganham alvo de toque >= 44px. Desktop igual ao padrão.
  stretch?: boolean
  // 'grid2' (mobile, junto com stretch): as opções quebram em 2 colunas (2x2 com 4 opções).
  layout?: 'grid2'
  // Formulários: marcador de campo obrigatório (asterisco visual; o grupo ganha aria-required)
  // e erro inline (aria-invalid + aria-describedby + mensagem com role="alert").
  required?: boolean
  error?: string
  // Texto de ajuda de 1 linha logo abaixo do rótulo (ex.: "Sim para valores que se repetem…").
  hint?: string
}

// Controle segmentado acessível (role="radiogroup"): o rótulo do grupo fica SEMPRE visível
// (texto pequeno acima) e é o nome acessível do grupo. Opção selecionada = fundo translúcido
// + borda + texto em peso 600 (não depende só de contorno). Setas do teclado movem a seleção
// entre opções habilitadas E levam o foco junto (senão a 2ª seta partiria da opção antiga).
// Sem seleção, a 1ª opção habilitada é a que recebe o foco por Tab.
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  tone = 'green',
  stretch = false,
  layout,
  required = false,
  error,
  hint,
}: SegmentedControlProps<T>) {
  const labelId = useId()
  const errorId = useId()
  const hintId = useId()
  const groupRef = useRef<HTMLDivElement>(null)
  const enabled = options.filter((option) => !option.disabled)
  const hasSelection = enabled.some((option) => option.value === value)

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
    if (!forward && !backward) return
    event.preventDefault()
    const index = enabled.findIndex((option) => option.value === value)
    // Sem seleção: → vai pra primeira, ← vai pra última.
    const next =
      index < 0
        ? enabled[forward ? 0 : enabled.length - 1]
        : enabled[(index + (forward ? 1 : -1) + enabled.length) % enabled.length]
    if (!next) return
    onChange(next.value)
    // Depois do commit do React a opção nova é a selecionada (aria-checked) — leva o foco pra ela.
    window.requestAnimationFrame(() => {
      groupRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus()
    })
  }

  const rootClass = `segmented-control${tone === 'red' ? ' segmented-control--red' : ''}${stretch ? ' segmented-control--stretch' : ''}${layout === 'grid2' ? ' segmented-control--grid2' : ''}`

  return (
    <div className={rootClass}>
      <span id={labelId} className="segmented-control__label">
        {label}
        {required && (
          <span className="segmented-control__required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </span>
      {hint && (
        <span id={hintId} className="segmented-control__hint">
          {hint}
        </span>
      )}
      <div
        ref={groupRef}
        className="segmented-control__group"
        role="radiogroup"
        aria-labelledby={labelId}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
        }
      >
        {options.map((option) => {
          const selected = option.value === value
          const accentClass = option.accent
            ? ` segmented-control__option--accent-${option.accent}`
            : ''
          const iconClass = option.icon ? ` segmented-control__option--with-icon` : ''
          const focusable = selected || (!hasSelection && option === enabled[0])
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={option.disabled}
              title={option.title}
              aria-label={option.ariaLabel}
              tabIndex={focusable ? 0 : -1}
              className={`segmented-control__option${selected ? ' segmented-control__option--selected' : ''}${accentClass}${iconClass}`}
              onClick={() => onChange(option.value)}
              onKeyDown={handleKeyDown}
            >
              {option.icon && (
                <span className="segmented-control__icon" aria-hidden="true">
                  {option.icon}
                </span>
              )}
              {option.label}
            </button>
          )
        })}
      </div>
      {error && (
        <p id={errorId} className="segmented-control__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
