import { MoreVertical } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { KeyboardEvent, ReactNode } from 'react'
import './DropdownMenu.css'

interface DropdownMenuProps {
  label: string
  // Conteúdo do botão que abre o menu — default é só o ícone "...", mas Contas/Cartões
  // usam isso pro botão "Movimentar" (ícone + texto).
  trigger?: ReactNode
  triggerClassName?: string
  align?: 'left' | 'right'
  // Painel "flutuante": renderizado em um portal no <body>, com position: fixed acima de qualquer card, e que
  // abre PARA CIMA quando não cabe abaixo do botão (descontando a barra inferior do mobile). Necessário
  // dentro de cartões com backdrop-filter, cujo contexto de empilhamento prende o z-index do menu e deixa o
  // card seguinte pintar por cima dele. Opt-in: as outras telas continuam com o painel absoluto de sempre.
  floating?: boolean
  children: (close: () => void) => ReactNode
}

// Primitivo compartilhado por ContasList, CartoesList e FaturasList — mesmo padrão de
// abrir/fechar e clicar fora fecha, usado nos três. Teclado é tratado explicitamente no
// onKeyDown (não confiado só no "ativar botão nativo com Enter/Espaço" do navegador),
// porque essa ativação padrão depende de uma ação de UA disparada por evento confiável e
// nem sempre se comporta de forma previsível vinda de automação/leitores de tela variados
// — melhor garantir o comportamento aqui do que depender disso.
export function DropdownMenu({
  label,
  trigger,
  triggerClassName,
  align = 'right',
  floating = false,
  children,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  // Posição do painel flutuante: abaixo do botão; acima quando não couber abaixo e houver mais espaço em
  // cima; sempre dentro da tela e acima da barra inferior (mobile). Recalcula quando o painel muda de
  // tamanho (ex.: pedido de confirmação), na rolagem e no redimensionamento.
  useLayoutEffect(() => {
    if (!open || !floating) return
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return

    function place() {
      if (!trigger || !panel) return
      const EDGE = 8
      const GAP = 6
      const anchor = trigger.getBoundingClientRect()
      const width = panel.offsetWidth
      const height = panel.offsetHeight
      const nav = document.querySelector('.bottom-nav')
      const navTop =
        nav && getComputedStyle(nav).display !== 'none' ? nav.getBoundingClientRect().top : Infinity
      const bottomLimit = Math.min(window.innerHeight, navTop) - EDGE
      const spaceBelow = bottomLimit - (anchor.bottom + GAP)
      const spaceAbove = anchor.top - GAP - EDGE
      const openUp = height > spaceBelow && spaceAbove > spaceBelow
      const top = openUp ? anchor.top - GAP - height : anchor.bottom + GAP
      const left = align === 'right' ? anchor.right - width : anchor.left
      panel.style.top = `${Math.min(Math.max(top, EDGE), Math.max(EDGE, bottomLimit - height))}px`
      panel.style.left = `${Math.min(Math.max(left, EDGE), Math.max(EDGE, window.innerWidth - EDGE - width))}px`
      panel.dataset.placement = openUp ? 'top' : 'bottom'
    }

    place()
    const observer = new ResizeObserver(place)
    observer.observe(panel)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, floating, align])

  // Ao abrir (mouse ou teclado), o foco entra no menu — sem isso setas/Escape não têm
  // onde agir, e quem usa teclado fica preso no botão que abriu.
  useEffect(() => {
    if (!open) return
    getMenuItems()[0]?.focus()
  }, [open])

  function getMenuItems(): HTMLElement[] {
    return Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
  }

  function closeAndRefocusTrigger() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
    }
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = getMenuItems()
    if (items.length === 0) return
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      items[(currentIndex + 1) % items.length]?.focus()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      items[(currentIndex - 1 + items.length) % items.length]?.focus()
    } else if (event.key === 'Enter' || event.key === ' ') {
      // Não confia só na ativação nativa de botão/link por Enter/Espaço (o mesmo motivo
      // do gatilho acima) — clica no item focado explicitamente. Bônus: Espaço em <a>
      // nativamente rola a página em vez de ativar o link; isso corrige esse caso também.
      event.preventDefault()
      items[currentIndex]?.click()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeAndRefocusTrigger()
    } else if (event.key === 'Tab') {
      // Deixa o Tab seguir seu destino normal (não prende o foco) — só garante que o
      // menu não fique aberto flutuando depois que o foco já saiu dele.
      setOpen(false)
    }
  }

  const panel = open ? (
    <div
      ref={panelRef}
      className={
        floating
          ? 'dropdown-menu__panel dropdown-menu__panel--floating'
          : `dropdown-menu__panel dropdown-menu__panel--${align}`
      }
      role="menu"
      onKeyDown={handlePanelKeyDown}
    >
      {children(closeAndRefocusTrigger)}
    </div>
  ) : null

  return (
    <div className="dropdown-menu" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className={triggerClassName ?? 'dropdown-menu__trigger'}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        {trigger ?? <MoreVertical size={16} aria-hidden="true" />}
      </button>
      {floating && panel ? createPortal(panel, document.body) : panel}
    </div>
  )
}
