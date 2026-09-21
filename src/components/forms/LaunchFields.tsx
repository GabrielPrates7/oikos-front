import { Minus, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { getBankColor } from '../../utils/bankColors'
import { todayInSaoPaulo, yesterdayInSaoPaulo } from '../../utils/period'
import { Checkbox } from '../ui/Checkbox'
import './LaunchFields.css'

// Seção do formulário: título pequeno + conteúdo (normalmente uma grade de 2 colunas que vira 1
// no mobile).
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="launch-section" aria-label={title}>
      <h2 className="launch-section__title">{title}</h2>
      <div className="launch-section__grid">{children}</div>
    </section>
  )
}

// Rótulo + controle + erro inline (aria-invalid/aria-describedby ficam no controle, que recebe o
// \`errorId\` daqui). Pra controles que não são <input> nativo (Combobox, por exemplo).
export function Field({
  id,
  label,
  required,
  error,
  className,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`ui-input${className ? ` ${className}` : ''}`}>
      <label htmlFor={id} className="ui-input__label">
        {label}
        {required && (
          <span className="launch-required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="ui-input__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Campo de data com atalhos "Hoje" e "Ontem" (fuso America/Sao_Paulo) que preenchem o campo.
export function DateField({
  id,
  label,
  register,
  value,
  onPick,
  error,
  chips = true,
  requiredMark,
}: {
  id: string
  label: string
  register: UseFormRegisterReturn
  // Valor atual do campo (pra marcar o atalho ativo).
  value: string | undefined
  onPick: (isoDate: string) => void
  error?: string
  chips?: boolean
  requiredMark?: boolean
}) {
  const today = todayInSaoPaulo()
  const yesterday = yesterdayInSaoPaulo()
  return (
    <div className="ui-input launch-date">
      <label htmlFor={id} className="ui-input__label">
        {label}
        {requiredMark && (
          <span className="ui-input__required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <input
        id={id}
        type="date"
        className="ui-input__field"
        aria-required={requiredMark || undefined}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...register}
      />
      {chips && (
        <div className="launch-date__chips" role="group" aria-label={`Atalhos de data: ${label}`}>
          {(
            [
              ['Hoje', today],
              ['Ontem', yesterday],
            ] as const
          ).map(([text, iso]) => (
            <button
              key={text}
              type="button"
              className="launch-chip"
              aria-pressed={value === iso}
              onClick={() => onPick(iso)}
            >
              {text}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="ui-input__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Conteúdo que aparece/some com transição curta de opacidade e altura (sem animação com
// prefers-reduced-motion). Fechado, fica no DOM mas \`inert\` (fora do foco e da leitura), então o
// valor do campo dentro continua no formulário.
export function Reveal({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={`launch-reveal${open ? ' launch-reveal--open' : ''}`} inert={!open}>
      <div className="launch-reveal__inner">{children}</div>
    </div>
  )
}

// Parcelas: campo numérico com botões − e +. Mínimo 1 (a mesma validação de sempre, zod
// installmentsCount.min(1)); sem máximo, porque a validação atual não tem.
export function InstallmentsStepper({
  id,
  label,
  register,
  value,
  onChange,
  error,
  requiredMark,
}: {
  id: string
  label: string
  register: UseFormRegisterReturn
  requiredMark?: boolean
  value: number | undefined
  onChange: (next: number) => void
  error?: string
}) {
  const current = typeof value === 'number' && Number.isFinite(value) ? value : 1
  return (
    <div className="ui-input launch-stepper">
      <label htmlFor={id} className="ui-input__label">
        {label}
        {requiredMark && (
          <span className="ui-input__required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <div className="launch-stepper__row">
        <button
          type="button"
          className="launch-stepper__button"
          aria-label="Diminuir parcelas"
          disabled={current <= 1}
          onClick={() => onChange(Math.max(1, current - 1))}
        >
          <Minus size={18} aria-hidden="true" />
        </button>
        <input
          id={id}
          type="number"
          min={1}
          inputMode="numeric"
          className="ui-input__field launch-stepper__input"
          aria-required={requiredMark || undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...register}
        />
        <button
          type="button"
          className="launch-stepper__button"
          aria-label="Aumentar parcelas"
          onClick={() => onChange(current + 1)}
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="ui-input__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// "Contar no total geral e nos gráficos": linha compacta (checkbox + texto de ajuda de 1 linha) e,
// desmarcada, um chip visível "Não conta no total". Marcada por padrão (definido no formulário).
export function CountInTotalsRow({
  register,
  checked,
}: {
  register: UseFormRegisterReturn
  checked: boolean
}) {
  return (
    <div className="launch-count">
      <Checkbox
        label="Contar no total geral e nos gráficos"
        aria-describedby="countInTotals-help"
        {...register}
      />
      <p id="countInTotals-help" className="launch-count__help">
        Desmarque para não somar este lançamento nos totais e gráficos.
      </p>
      {!checked && <span className="launch-chip launch-chip--static">Não conta no total</span>}
    </div>
  )
}

// Cartão miniatura na cor do banco (mesmo getBankColor dos cartões), pro Combobox de Cartão.
export function CardSwatch({ name }: { name: string }) {
  const { base, muted } = getBankColor(name)
  return (
    <span className="launch-card-option">
      <span
        className="launch-card-swatch"
        aria-hidden="true"
        style={{ background: `linear-gradient(135deg, ${base}, ${muted})` }}
      />
      {name}
    </span>
  )
}
