import { Tag } from 'lucide-react'
import './EssentialBadge.css'

interface EssentialBadgeProps {
  isEssential: boolean
}

export function EssentialBadge({ isEssential }: EssentialBadgeProps) {
  return (
    <span className="essential-badge">
      <Tag size={12} aria-hidden="true" />
      {isEssential ? 'Essencial' : 'Supérfluo'}
    </span>
  )
}
