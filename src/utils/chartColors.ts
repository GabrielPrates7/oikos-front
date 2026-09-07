// Hex fixos espelhando tokens.css — recharts precisa de cor resolvida pros props de
// fill/stroke/tick, não aceita de forma confiável uma CSS custom property em todas as
// versões/navegadores. Usado pelos gráficos de Dashboard e Relatórios.
export const CHART_COLOR_ACCENT = '#4f8f63'
export const CHART_COLOR_INCOME = '#6baf82'
export const CHART_COLOR_EXPENSE = '#b2543a'
export const CHART_COLOR_WARNING = '#d9a441'
export const CHART_COLOR_TEXT_MUTED = '#9ca79e'
export const CHART_COLOR_TEXT_PRIMARY = '#edeae2'
export const CHART_COLOR_BG_ELEVATED = '#1e2620'
export const CHART_COLOR_BG_SURFACE = '#161d18'

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const value = parseInt(clean, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

// N variações de opacidade da mesma cor base — mesma convenção de "mais escura/opaca =
// maior valor" já usada em CategoryBarChart, só que via rgba() em vez de fillOpacity
// (Pie/Cell do recharts precisa de uma cor sólida por fatia, não de uma prop separada).
export function shadesOf(hex: string, count: number): string[] {
  const [r, g, b] = hexToRgb(hex)
  return Array.from({ length: Math.max(1, count) }, (_, index) => {
    const opacity = Math.max(0.35, 1 - index * 0.15)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  })
}
