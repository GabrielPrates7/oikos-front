import { ChevronDown, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './Combobox.css'

export interface ComboboxOption {
  value: string
  // Texto: usado na busca e como nome acessível.
  label: string
  // Opcional: o que é DESENHADO no gatilho e na lista no lugar do texto (ex.: CategoryBadge). A
  // busca continua usando `label`.
  node?: ReactNode
}

interface ComboboxProps {
  id: string
  value: string
  onChange: (value: string) => void
  // Já deve incluir a opção "vazia" (ex: {value:'', label:'Todas'}) quando fizer sentido —
  // o componente não assume isso sozinho, pra funcionar também em campos obrigatórios.
  options: ComboboxOption[]
  placeholder?: string
  // 'field': aparência de campo de formulário (altura de toque de 44px, 16px de fonte). Sem isso,
  // o visual é o de sempre (filtros das listas).
  variant?: 'field'
  // Formulários: campo inválido/obrigatório e a mensagem de erro que o descreve.
  invalid?: boolean
  required?: boolean
  describedBy?: string
}

interface PanelPosition {
  top: number
  left: number
  width: number
}

// Combobox pesquisável — usado em Conta/Categoria (Entradas e Despesas), listas que podem
// crescer o bastante pra um <select> nativo virar uma rolagem longa sem filtro nenhum.
export function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder = 'Selecione',
  variant,
  invalid,
  required,
  describedBy,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Bug real encontrado: o painel de opções vivia dentro da árvore DOM da barra de filtros,
  // como sibling ANTERIOR de .entradas-list__table-wrap (o painel de vidro fosco da
  // tabela, com backdrop-filter). z-index só resolve empate DENTRO do mesmo stacking
  // context — um z-index alto aqui não bastava porque o table-wrap (mais tarde no DOM,
  // sem z-index próprio) ainda pintava por cima do stacking context inteiro da barra de
  // filtros, vazando a transparência da tabela por trás do menu aberto. Portal pra
  // document.body tira o painel de QUALQUER stacking context de ancestral — a forma
  // robusta de resolver isso, não só empilhar z-index mais alto (que não teria resolvido,
  // já tínhamos z-index:20 antes e o bug persistia).
  function updatePanelPosition() {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPanelPosition({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 200) })
  }

  useEffect(() => {
    if (!open) return
    updatePanelPosition()

    // Portado pro body: clique dentro do painel não é mais "dentro" de containerRef (são
    // duas subárvores DOM diferentes agora) — sem checar panelRef também, qualquer clique
    // numa opção fecharia o menu antes de registrar a seleção.
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (!containerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false)
        setQuery('')
      }
    }

    // Reposiciona se a página rolar ou a janela mudar de tamanho com o menu aberto —
    // position:fixed não acompanha o gatilho sozinho (ele saiu da árvore, mas a posição é
    // calculada uma vez só na abertura).
    function handleReposition() {
      updatePanelPosition()
    }

    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('scroll', handleReposition, true)
    window.addEventListener('resize', handleReposition)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('scroll', handleReposition, true)
      window.removeEventListener('resize', handleReposition)
    }
  }, [open])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  const selected = options.find((option) => option.value === value)
  const normalizedQuery = query.trim().toLowerCase()
  // A opção vazia ("Todas") fica sempre visível, mesmo filtrando — perder o jeito de
  // limpar o campo enquanto digita seria pior que o <select> nativo que ela substitui.
  const filtered = normalizedQuery
    ? options.filter(
        (option) => option.value === '' || option.label.toLowerCase().includes(normalizedQuery),
      )
    : options

  function handleSelect(optionValue: string) {
    onChange(optionValue)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className={`ui-combobox${variant === 'field' ? ' ui-combobox--field' : ''}`} ref={containerRef}>
      <button
        type="button"
        id={id}
        className="ui-combobox__trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        aria-describedby={describedBy}
      >
        <span className="ui-combobox__trigger-label">
          {selected ? (selected.node ?? selected.label) : placeholder}
        </span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open &&
        panelPosition &&
        createPortal(
          <div
            className="ui-combobox__panel"
            ref={panelRef}
            style={{
              position: 'fixed',
              top: panelPosition.top,
              left: panelPosition.left,
              width: panelPosition.width,
            }}
          >
            <div className="ui-combobox__search">
              <Search size={13} aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar..."
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setOpen(false)
                    setQuery('')
                  }
                }}
              />
            </div>
            <ul className="ui-combobox__options" role="listbox">
              {filtered.length === 0 ? (
                <li className="ui-combobox__empty">Nenhum resultado</li>
              ) : (
                filtered.map((option) => (
                  <li key={option.value || '__empty__'}>
                    <button
                      type="button"
                      className={`ui-combobox__option ${option.value === value ? 'ui-combobox__option--active' : ''}`}
                      role="option"
                      aria-selected={option.value === value}
                      onClick={() => handleSelect(option.value)}
                    >
                      {option.node ?? option.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  )
}
