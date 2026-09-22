import { useId } from 'react'
import type { ReactNode } from 'react'
import './Switch.css'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  // Rótulo visível (também é o nome acessível do interruptor).
  children: ReactNode
  disabled?: boolean
}

// Interruptor liga/desliga acessível (role="switch"): Espaço/Enter alternam; o estado não depende só
// da cor (posição do botão + aria-checked).
export function Switch({ checked, onChange, children, disabled }: SwitchProps) {
  const labelId = useId()
  return (
    <div className="ui-switch">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        className={`ui-switch__track${checked ? ' ui-switch__track--on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="ui-switch__rail" aria-hidden="true">
          <span className="ui-switch__thumb" />
        </span>
      </button>
      <span id={labelId} className="ui-switch__label">
        {children}
      </span>
    </div>
  )
}
