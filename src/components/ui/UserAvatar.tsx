import './UserAvatar.css'

interface UserAvatarProps {
  name: string
}

// Círculo colorido com a inicial do nome — mesmo estilo visual do avatar da marca na Sidebar
// (cor de destaque, letra em negrito), mas um componente próprio: aquele é a marca "Oikos" e
// nunca deve mudar; este mostra a inicial de QUEM está logado, só na aba Perfil.
export function UserAvatar({ name }: UserAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <span className="user-avatar" aria-hidden="true">
      {initial}
    </span>
  )
}
