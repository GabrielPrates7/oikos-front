import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import './PlanSheet.css'

interface PlanSheetProps {
  title: string
  onClose: () => void
  // Elemento que abriu o painel: recebe o foco de volta ao fechar.
  returnFocusRef?: RefObject<HTMLElement | null>
  // Rodapé fixo (botão de confirmação etc.).
  footer?: ReactNode
  children: ReactNode
}

// Painel modal do Plano em <dialog> NATIVO aberto com showModal(): o navegador deixa o resto da
// página inerte e mantém o Tab dentro do diálogo; Escape fecha (evento "close"). Gaveta à direita no
// desktop, folha inferior no mobile (< 768px). A rolagem do fundo é travada enquanto aberto. Clicar
// no fundo escurecido (fora do painel) fecha; ao fechar o foco volta ao elemento que abriu.
export function PlanSheet({ title, onClose, returnFocusRef, footer, children }: PlanSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  const returnRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    // quem abriu (na 1ª execução; o modo estrito repete o efeito e o foco já estaria dentro do painel)
    if (!returnRef.current) {
      returnRef.current = returnFocusRef?.current ?? (document.activeElement as HTMLElement | null)
    }
    const html = document.documentElement
    const previousOverflow = html.style.overflow
    html.style.overflow = 'hidden'
    // Um evento "close" pendente de um fechamento anterior (o modo estrito do React fecha e reabre) não
    // deve fechar o painel que já está aberto de novo.
    const handleClose = () => {
      if (!dialog.open) onCloseRef.current()
    }
    dialog.addEventListener('close', handleClose)
    if (!dialog.open) dialog.showModal()
    const returnEl = returnRef.current

    return () => {
      dialog.removeEventListener('close', handleClose)
      if (dialog.open) dialog.close()
      html.style.overflow = previousOverflow
      returnEl?.focus?.()
    }
  }, [returnFocusRef])

  return (
    <dialog
      ref={dialogRef}
      className="plan-sheet"
      aria-label={title}
      onKeyDown={(event) => {
        // Escape fecha (o navegador também o faz sozinho; aqui garantimos o mesmo resultado em qualquer ambiente)
        if (event.key === 'Escape') {
          event.preventDefault()
          onCloseRef.current()
        }
      }}
      onClick={(event) => {
        // clique no fundo (o próprio <dialog>, fora do painel) fecha
        if (event.target === event.currentTarget) onCloseRef.current()
      }}
    >
      <div className="plan-sheet__panel">
        <div className="plan-sheet__header">
          <h2 className="plan-sheet__title">{title}</h2>
          <button type="button" className="plan-sheet__close" onClick={() => onCloseRef.current()}>
            <X size={18} aria-hidden="true" />
            Fechar
          </button>
        </div>
        <div className="plan-sheet__body">{children}</div>
        {footer && <div className="plan-sheet__footer">{footer}</div>}
      </div>
    </dialog>
  )
}
