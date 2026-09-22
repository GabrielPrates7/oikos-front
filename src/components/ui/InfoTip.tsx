import { HelpCircle } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './InfoTip.css'

interface InfoTipProps {
  // Nome acessível do botão "?" (ex.: "Por que difere do Lucro do Dashboard?").
  label: string
  children: ReactNode
}

const TIP_MAX_WIDTH = 320
const EDGE = 12

// "?" acessível com explicação curta: abre por hover, foco e clique/Enter/Espaço; fecha por Escape,
// por clique fora e ao perder o foco. O texto fica em um role="tooltip" ligado ao botão por
// aria-describedby. O painel vai por portal no <body> (position: fixed) para não ser cortado nem
// afetado por backdrop-filter dos cards de vidro, e é limitado à largura da tela (sem overflow).
export function InfoTip({ label, children }: InfoTipProps) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(
    null,
  )
  const buttonRef = useRef<HTMLButtonElement>(null)
  const tipId = useId()

  const visible = open || pinned

  useEffect(() => {
    if (!visible) return
    function place() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(TIP_MAX_WIDTH, window.innerWidth - EDGE * 2)
      const left = Math.min(
        Math.max(rect.left + rect.width / 2 - width / 2, EDGE),
        window.innerWidth - EDGE - width,
      )
      setPosition({ top: rect.bottom + 8, left, width })
    }
    place()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        setPinned(false)
      }
    }
    function onPointerDown(event: MouseEvent) {
      if (!buttonRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setPinned(false)
      }
    }
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [visible])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="info-tip"
        aria-label={label}
        aria-describedby={visible ? tipId : undefined}
        aria-expanded={visible}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false)
          setPinned(false)
        }}
        onClick={() => setPinned((current) => !current)}
      >
        <HelpCircle size={15} aria-hidden="true" />
      </button>
      {visible &&
        position &&
        createPortal(
          <div
            id={tipId}
            role="tooltip"
            className="info-tip__panel"
            style={{ top: position.top, left: position.left, width: position.width }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  )
}
