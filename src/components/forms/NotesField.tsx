import { useEffect, useId, useRef, useState } from 'react'
import { NOTES_MAX_LENGTH, countCodePoints, truncateToCodePoints } from '../../utils/notes'
import './NotesField.css'

interface NotesFieldProps {
  value: string
  onChange: (next: string) => void
  // Abre já expandido (ex.: editar/duplicar um registro que já tem observação).
  defaultOpen?: boolean
  error?: string
  // Prefixo dos ids (dois campos na mesma tela não colidem).
  id?: string
}

const MIN_ROWS = 3
const MAX_ROWS = 6

// Observação opcional (entrada, despesa e compra do cartão). Recolhida por padrão, como botão de
// texto; expandida vira um textarea de 3 linhas que cresce até ~6, com contador N/500 por pontos
// de código. O limite é aplicado aqui (digitar ou colar além dele corta e avisa) com o mesmo cálculo
// do backend. O front não sanitiza nada: trim e "vazio vira null" são do backend. O botão de
// recolher só fica ativo com o campo vazio (não some texto sem querer).
export function NotesField({ value, onChange, defaultOpen = false, error, id }: NotesFieldProps) {
  const reactId = useId()
  const base = id ?? `notes-${reactId.replace(/:/g, '')}`
  const [open, setOpen] = useState(defaultOpen)
  const [truncated, setTruncated] = useState(false)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const count = countCodePoints(value)

  // Cresce com o conteúdo, de 3 até 6 linhas (depois rola por dentro).
  useEffect(() => {
    const element = areaRef.current
    if (!element || !open) return
    element.style.height = 'auto'
    const style = window.getComputedStyle(element)
    const line = parseFloat(style.lineHeight) || 22
    const chrome = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + 2
    const max = line * MAX_ROWS + chrome
    element.style.height = `${Math.min(element.scrollHeight, max)}px`
    element.style.overflowY = element.scrollHeight > max ? 'auto' : 'hidden'
  }, [value, open])

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = event.target.value
    if (countCodePoints(next) > NOTES_MAX_LENGTH) {
      onChange(truncateToCodePoints(next))
      setTruncated(true)
    } else {
      onChange(next)
      setTruncated(false)
    }
  }

  function expand() {
    setOpen(true)
    // foco no campo assim que ele existe
    window.setTimeout(() => areaRef.current?.focus(), 0)
  }

  if (!open) {
    return (
      <div className="notes-field">
        <button
          type="button"
          className="notes-field__add"
          aria-expanded="false"
          aria-controls={`${base}-area`}
          onClick={expand}
        >
          ＋ Adicionar observação
        </button>
      </div>
    )
  }

  return (
    <div className="notes-field">
      <div className="notes-field__head">
        <label htmlFor={`${base}-area`} className="notes-field__label">
          Observação (opcional)
        </label>
        <button
          type="button"
          className="notes-field__collapse"
          aria-expanded="true"
          aria-controls={`${base}-area`}
          disabled={value !== ''}
          title={value !== '' ? 'Apague o texto para recolher' : undefined}
          onClick={() => setOpen(false)}
        >
          Recolher
        </button>
      </div>
      <textarea
        id={`${base}-area`}
        ref={areaRef}
        className="ui-input__field notes-field__area"
        rows={MIN_ROWS}
        value={value}
        onChange={handleChange}
        placeholder="Ex.: combinado com a Ana, pagar até dia 10"
        aria-invalid={!!error}
        aria-describedby={`${base}-count${truncated ? ` ${base}-warn` : ''}${error ? ` ${base}-error` : ''}`}
      />
      <div className="notes-field__foot">
        <span id={`${base}-count`} className="notes-field__count">
          {count}/{NOTES_MAX_LENGTH}
        </span>
        {truncated && (
          <span id={`${base}-warn`} className="notes-field__warn" role="status">
            Limite de {NOTES_MAX_LENGTH} caracteres: o texto foi cortado.
          </span>
        )}
      </div>
      {error && (
        <p id={`${base}-error`} className="ui-input__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
