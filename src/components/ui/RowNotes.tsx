import { StickyNote } from 'lucide-react'
import './RowNotes.css'

// Botão de ícone que mostra/esconde a observação de uma linha (entrada, despesa ou compra).
// aria-controls aponta pro painel (que fica no DOM, só com [hidden] quando recolhido, então o id
// sempre existe). Enter e Espaço funcionam por ser um <button> nativo.
export function NotesToggle({
  panelId,
  open,
  onToggle,
}: {
  panelId: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className={`notes-toggle${open ? ' notes-toggle--open' : ''}`}
      aria-label="Ver observação"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={onToggle}
    >
      <StickyNote size={16} aria-hidden="true" />
    </button>
  )
}

// Texto da observação. SEMPRE como texto (o React escapa): nada de dangerouslySetInnerHTML.
// white-space: pre-wrap preserva as quebras de linha digitadas; nada é cortado.
export function NotesText({ notes }: { notes: string }) {
  return <p className="notes-text">{notes}</p>
}
