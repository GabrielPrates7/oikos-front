import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`ui-button ui-button--${variant}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading && <span className="ui-button__spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}
