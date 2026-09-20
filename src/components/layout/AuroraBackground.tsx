import { useEffect, useRef } from 'react'
import './AuroraBackground.css'

// Fundo "aurora" verde e preto — só na área Relatórios (montado por Shell.tsx quando a rota é
// /relatorios/*; ao sair, desmonta e nenhuma camada fica no DOM). Decorativo: aria-hidden,
// sem foco, sem texto. Animação 100% CSS (só transform); o único JS é pausar as manchas com a
// aba oculta (classe alternada num listener de visibilitychange, sem re-render).
export function AuroraBackground() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const sync = () => root.classList.toggle('aurora--paused', document.hidden)
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  return (
    <div ref={rootRef} className="aurora" aria-hidden="true">
      <div className="aurora__base" />
      <div className="aurora__blobs">
        <span className="aurora__blob aurora__blob--a" />
        <span className="aurora__blob aurora__blob--b" />
        <span className="aurora__blob aurora__blob--c" />
        <span className="aurora__blob aurora__blob--d" />
        <span className="aurora__glow aurora__glow--top" />
        <span className="aurora__glow aurora__glow--corner" />
      </div>
      <div className="aurora__fade" />
      <div className="aurora__vignette" />
      <div className="aurora__grain" />
    </div>
  )
}
