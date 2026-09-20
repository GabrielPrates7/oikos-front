interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  color?: string
}

interface Point {
  x: number
  y: number
}

// Tangente de Hermite por ponto, com a correção de monotonicidade de Fritsch-Carlson —
// médias de inclinação são zeradas quando os vizinhos mudam de direção (pico/vale), e
// limitadas (o passo `s > 9`) quando ainda assim poderiam ultrapassar o segmento. É essa
// correção que faltava na versão anterior (Catmull-Rom puro): sem ela, a tangente num
// ponto podia apontar mais forte que os dois vizinhos permitem, e a curva ultrapassava a
// caixa [0, height] do SVG — o <svg> recorta (overflow padrão do navegador), então esse
// trecho que saía da caixa sumia, dando a impressão de uma linha partida em dois pedaços
// (bug real, confirmado simulando com os 4 valores reais da conta:
// [217198, 12000, 3000, 135835] — o control point da 1ª curva chegava a y=31.5, além dos
// 28px de altura da viewBox).
function computeTangents(points: Point[]): number[] {
  const n = points.length
  const slopes: number[] = []
  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x
    slopes.push(dx === 0 ? 0 : (points[i + 1].y - points[i].y) / dx)
  }

  const tangents = new Array<number>(n)
  tangents[0] = slopes[0]
  tangents[n - 1] = slopes[n - 2]
  for (let i = 1; i < n - 1; i++) {
    const isExtremum = slopes[i - 1] === 0 || slopes[i] === 0 || slopes[i - 1] > 0 !== slopes[i] > 0
    tangents[i] = isExtremum ? 0 : (slopes[i - 1] + slopes[i]) / 2
  }

  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0
      tangents[i + 1] = 0
      continue
    }
    const a = tangents[i] / slopes[i]
    const b = tangents[i + 1] / slopes[i]
    const magnitude = a * a + b * b
    if (magnitude > 9) {
      const scale = 3 / Math.sqrt(magnitude)
      tangents[i] = scale * a * slopes[i]
      tangents[i + 1] = scale * b * slopes[i]
    }
  }

  return tangents
}

// Spline cúbica monotônica (Hermite, mesmo princípio do curve="monotone" do Recharts) —
// suave passando por TODOS os pontos, sem o overshoot do Catmull-Rom puro. Pra 2 pontos
// só, uma curva não faz sentido (não há vizinho pra calcular tangente), cai numa reta
// comum.
function buildSmoothPath(points: Point[]): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`
  }

  const tangents = computeTangents(points)
  let path = `M ${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x
    const cp1x = points[i].x + dx / 3
    const cp1y = points[i].y + (tangents[i] * dx) / 3
    const cp2x = points[i + 1].x - dx / 3
    const cp2y = points[i + 1].y - (tangents[i + 1] * dx) / 3
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i + 1].x},${points[i + 1].y}`
  }
  return path
}

// Mini gráfico de linha sem eixos/grid/tooltip — não existia nenhum componente parecido no
// projeto (os outros gráficos de linha, tipo SpendingTrendsChart, sempre têm eixo e usam
// Recharts). SVG puro em vez de Recharts aqui: overhead de ResponsiveContainer/Cartesian
// não compensa pra um traço de poucos pixels sem interação.
export function Sparkline({ values, width = 80, height = 28, color = 'currentColor' }: SparklineProps) {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  // Range zero (todos os valores iguais) — desenha uma linha reta no meio em vez de dividir
  // por zero.
  const range = max - min || 1
  const stepX = width / (values.length - 1)

  const points: Point[] = values.map((value, index) => ({
    x: index * stepX,
    y: height - ((value - min) / range) * height,
  }))

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      // "none" (não "xMidYMid meet", o default) — deixa o CSS do card esticar o SVG pra
      // preencher a largura real do container (ver .entradas-total-card .sparkline),
      // que pode ser maior ou menor que este `width` lógico usado só pra calcular os
      // pontos da curva.
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      className="sparkline"
    >
      <path
        d={buildSmoothPath(points)}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
