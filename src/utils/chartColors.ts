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

// Fallback SÓ pra categorias sem cor fixa (custom, criadas pelo usuário) — nenhuma destas
// 6 repete uma cor já usada pelos overrides abaixo. Isso importa: numa primeira versão
// deste arquivo o fallback reaproveitava cores dos overrides (accent, expense, warning,
// magenta), e com as 8 categorias fixas todas presentes ao mesmo tempo, sobrava só 1 cor
// livre nesse fallback pra todas as categorias custom — a maioria colidia (2 categorias
// custom já bastava pra repetir cor), porque o loop de "avançar pra próxima livre" tem um
// número máximo de tentativas e esgotava antes de achar uma vaga. Com um conjunto PRÓPRIO
// de cores, o fallback nunca compete por vaga com os overrides.
export const CATEGORY_PALETTE = [
  '#5b8fd6', // azul (mesmo tom de --color-accent-info)
  '#e0796b', // coral
  '#6fae8f', // verde-mar
  '#a78bfa', // lavanda
  '#f2b880', // pêssego
  '#7c9c4c', // oliva
]

// As 8 categorias da imagem de referência ganham cor FIXA (batendo com a imagem), não
// hash — hash por nome sozinho não evita colisão entre DUAS categorias do mesmo conjunto
// renderizado (ficou provado: "Dízimo" e "Corte de Cabelo" caíram no mesmo índice e saíram
// com o mesmo RGB). Categorias novas que o usuário criar depois caem no CATEGORY_PALETTE
// acima (fallback, nunca nestas cores), com verificação de colisão contra tudo que já foi
// atribuído no mesmo render.
const CATEGORY_COLOR_OVERRIDES: Record<string, string> = {
  Empréstimo: '#2dd4bf',
  Faculdade: CHART_COLOR_ACCENT,
  Dízimo: CHART_COLOR_EXPENSE,
  Outros: '#8a8f89',
  Academia: CHART_COLOR_WARNING,
  Contas: '#4a4f4c', // cinza escuro/quase preto
  'Corte de Cabelo': '#c2578a',
  Lazer: '#8257e5', // roxo (mesmo tom do Nubank em bankColors.ts)
}

// Hash determinístico (mesmo nome -> mesmo índice de partida sempre) — só o PONTO DE
// PARTIDA da busca por uma cor livre abaixo, não a cor final (isso é o que corrige a
// colisão: hash sozinho, sem checar contra o que já foi usado, pode mandar duas
// categorias diferentes pro mesmo índice).
function hashToIndex(input: string, length: number): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(hash, 31) + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % length
}

// Atribui uma cor por categoria pro conjunto INTEIRO sendo renderizado junto (não uma
// função pura por item isolado) — é o que permite detectar e resolver colisão: uma
// categoria sem cor fixa que hashear pra uma cor já usada (por um override ou por outra
// categoria hasheada antes dela) avança pra próxima cor livre da paleta, em vez de
// simplesmente repetir a cor de outra categoria do mesmo gráfico.
export function assignCategoryColors(categoryNames: string[]): Map<string, string> {
  const assigned = new Map<string, string>()
  const usedColors = new Set<string>()

  // 1ª passada: nomes com cor fixa sempre ganham essa cor exata (mesmo que colida entre
  // si — não deveria, as 8 cores acima são todas distintas — mas nunca é deslocada pra
  // "resolver" colisão, já que o objetivo dela é bater com um valor específico da imagem).
  for (const name of categoryNames) {
    const fixed = CATEGORY_COLOR_OVERRIDES[name]
    if (fixed) {
      assigned.set(name, fixed)
      usedColors.add(fixed)
    }
  }

  // 2ª passada: categorias sem cor fixa (custom do usuário) — hash como ponto de partida,
  // avança pra próxima cor da paleta ainda não usada NESTE render se houver colisão.
  for (const name of categoryNames) {
    if (assigned.has(name)) continue
    const paletteLength = CATEGORY_PALETTE.length
    let index = hashToIndex(name, paletteLength)
    let attempts = 0
    while (usedColors.has(CATEGORY_PALETTE[index]) && attempts < paletteLength) {
      index = (index + 1) % paletteLength
      attempts++
    }
    const color = CATEGORY_PALETTE[index]
    assigned.set(name, color)
    usedColors.add(color)
  }

  return assigned
}

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
