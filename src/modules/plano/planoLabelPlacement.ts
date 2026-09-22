// Posição do rótulo "Menor saldo" no gráfico de fluxo de caixa: SÓ apresentação (geometria em pixels).
// Escolhe, entre posições candidatas em volta do ponto, a primeira que cabe dentro da área do gráfico e não
// cruza nenhuma linha (saldo planejado/realizado em degraus, zero, "Hoje") nem o rótulo "Hoje".

export interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

// Segmento alinhado aos eixos (horizontal ou vertical).
export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface LabelPlacement {
  anchor: 'start' | 'middle' | 'end'
  // x do texto conforme a âncora e y da linha de base
  x: number
  y: number
  box: Box
}

// Degraus (stepAfter): cada ponto mantém o valor até o x do próximo ponto e depois salta na vertical.
export function stepSegments(points: { x: number; y: number }[]): Segment[] {
  const segments: Segment[] = []
  for (let index = 0; index < points.length - 1; index++) {
    const a = points[index]
    const b = points[index + 1]
    segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: a.y })
    if (b.y !== a.y) segments.push({ x1: b.x, y1: a.y, x2: b.x, y2: b.y })
  }
  return segments
}

const PAD = 1.5

function hitsSegment(box: Box, s: Segment): boolean {
  const left = box.left - PAD
  const right = box.right + PAD
  const top = box.top - PAD
  const bottom = box.bottom + PAD
  const sx1 = Math.min(s.x1, s.x2)
  const sx2 = Math.max(s.x1, s.x2)
  const sy1 = Math.min(s.y1, s.y2)
  const sy2 = Math.max(s.y1, s.y2)
  return sx1 < right && sx2 > left && sy1 < bottom && sy2 > top
}

function overlaps(a: Box, b: Box): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

function inside(box: Box, plot: Box): boolean {
  return (
    box.left >= plot.left + 2 &&
    box.right <= plot.right - 2 &&
    box.top >= plot.top + 2 &&
    box.bottom <= plot.bottom - 2
  )
}

// Passo da varredura horizontal (px) e alcance máximo (a partir do centro, pra cada lado).
const SHIFT_STEP = 6

// Posição do rótulo "Menor saldo": duas linhas candidatas (abaixo do ponto, depois acima), e em cada
// uma uma varredura horizontal a partir do centro (mais perto primeiro, alternando esquerda/direita) —
// não só as 8 posições fixas de antes, que colidiam sempre que a linha subia ou descia logo ao lado do
// ponto (a região livre podia estar a poucos passos dali, fora do raio que as 8 posições cobriam).
// "Abaixo" vem primeiro (preferência de sempre; some perto do eixo X e cai para "acima"). Sem posição
// livre em nenhuma linha (gráfico muito cheio), cai para a menos colidida encontrada na varredura.
export function placeMinLabel(args: {
  dot: { x: number; y: number }
  radius: number
  size: { w: number; h: number }
  plot: Box
  segments: Segment[]
  blocked: Box[]
}): LabelPlacement {
  const { dot, radius, size, plot, segments, blocked } = args
  const gap = radius + 4
  const { w, h } = size
  const minLeft = plot.left + 2
  const maxLeft = plot.right - 2 - w

  const build = (left: number, top: number): LabelPlacement => {
    const clamped = Math.min(Math.max(left, minLeft), maxLeft)
    const box: Box = { left: clamped, top, right: clamped + w, bottom: top + h }
    return { anchor: 'start', x: box.left, y: box.top + h - 3, box }
  }
  const score = (placement: LabelPlacement): number => {
    const crossings =
      segments.filter((segment) => hitsSegment(placement.box, segment)).length +
      blocked.filter((box) => overlaps(placement.box, box)).length
    return crossings * 10 + (inside(placement.box, plot) ? 0 : 100)
  }

  let best: LabelPlacement | null = null
  let bestScore = Infinity
  const center = dot.x - w / 2
  const maxShift = Math.max(plot.right - plot.left, w)
  for (const top of [dot.y + gap, dot.y - gap - h]) {
    for (let shift = 0; shift <= maxShift; shift += SHIFT_STEP) {
      const offsets = shift === 0 ? [0] : [-shift, shift]
      for (const offset of offsets) {
        const placement = build(center + offset, top)
        const placementScore = score(placement)
        if (placementScore === 0) return placement
        if (placementScore < bestScore) {
          best = placement
          bestScore = placementScore
        }
      }
    }
  }
  return best ?? build(center, dot.y + gap)
}

export interface BarLabelInput {
  // centro horizontal, largura estimada do texto e linha de base ideal (colada na barra)
  cx: number
  width: number
  y: number
  negative: boolean
}

// Posição vertical dos rótulos de valor das barras (todas as barras do gráfico juntas). Cada rótulo começa
// colado na sua barra; se encostaria em outro já colocado (mesmo lado do zero, sobreposição horizontal e
// vertical), o que está mais longe do zero se afasta ainda mais, só o necessário. Ordem: os mais próximos do
// zero primeiro; empate pela ordem de entrada (esquerda para a direita).
export function layoutBarLabels(labels: BarLabelInput[], lineHeight = 15): number[] {
  const out = labels.map((label) => label.y)
  for (const negative of [false, true]) {
    const order = labels
      .map((label, index) => ({ label, index }))
      .filter((entry) => entry.label.negative === negative)
      .sort(
        (a, b) => (negative ? a.label.y - b.label.y : b.label.y - a.label.y) || a.index - b.index,
      )
    const placed: number[] = []
    for (const { label, index } of order) {
      let settled = false
      for (let pass = 0; pass < placed.length + 1 && !settled; pass++) {
        settled = true
        for (const other of placed) {
          const near =
            Math.abs(labels[other].cx - label.cx) < (labels[other].width + label.width) / 2 - 1
          if (near && Math.abs(out[index] - out[other]) < lineHeight) {
            out[index] = negative ? out[other] + lineHeight : out[other] - lineHeight
            settled = false
          }
        }
      }
      placed.push(index)
    }
  }
  return out
}
