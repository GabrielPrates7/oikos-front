import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import './Checkbox.css'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

// forwardRef + spread de ...rest, mesmo padrão de Input.tsx — compõe direto com
// react-hook-form: <Checkbox label="..." {...register('campo')} /> (register detecta
// type="checkbox" sozinho e manda um boolean, não string). Diferente de BooleanToggle
// (escolha forçada, sem valor pré-marcado de propósito): aqui o padrão É vir marcado —
// não é uma decisão que o usuário precisa tomar toda vez, só uma opção pra desmarcar.
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, id, name, ...rest },
  ref,
) {
  const inputId = id ?? name

  return (
    <label className="ui-checkbox" htmlFor={inputId}>
      <input type="checkbox" id={inputId} name={name} ref={ref} className="ui-checkbox__input" {...rest} />
      <span className="ui-checkbox__label">{label}</span>
    </label>
  )
})
