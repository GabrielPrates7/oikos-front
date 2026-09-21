import { Repeat } from 'lucide-react'
import './FixedBadge.css'

// Selo discreto "Fixa" (recorrente). Mesmo estilo neutro dos selos Essencial/Supérfluo.
export function FixedBadge() {
  return (
    <span className="fixed-badge">
      <Repeat size={12} aria-hidden="true" />
      Fixa
    </span>
  )
}
