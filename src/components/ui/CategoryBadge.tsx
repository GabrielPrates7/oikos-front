import './CategoryBadge.css'

interface CategoryBadgeProps {
  name: string
  icon: string | null
  color: string
}

// Pílula com fundo tintado na cor da categoria — mesmo princípio de cor por categoria já
// usado em CategoryBarChart/SpendingTrendsChart (assignCategoryColors em chartColors.ts).
// `color` vem de fora (não chama assignCategoryColors aqui dentro): a atribuição precisa
// ser feita em LOTE com a lista completa de categorias do lugar que renderiza — foi
// exatamente chamar por item isolado, em vez de em lote, que causou a colisão de cor
// corrigida em SpendingTrendsChart.
export function CategoryBadge({ name, icon, color }: CategoryBadgeProps) {
  return (
    <span
      className="category-badge"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
      }}
    >
      <span aria-hidden="true">{icon ?? '📁'}</span>
      {name}
    </span>
  )
}
