// Escala dos gráficos do Plano: SÓ apresentação (ticks redondos e formato compacto). Nenhum número
// financeiro é calculado aqui; os valores vêm prontos do summary.

// Passo "redondo" (1, 2 ou 5 x 10^n) que cabe em `rough`.
export function niceStep(rough: number): number {
  if (!Number.isFinite(rough) || rough <= 0) return 1
  const exponent = Math.floor(Math.log10(rough))
  const base = 10 ** exponent
  const fraction = rough / base
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return nice * base
}

// Ticks do eixo Y (em centavos) com passos 1-2-5, sempre incluindo o zero quando ele está no
// intervalo. `count` é o número aproximado de divisões desejado.
export function niceTicks(
  min: number,
  max: number,
  count = 5,
): { ticks: number[]; domain: [number, number] } {
  const low = Math.min(min, 0)
  const high = Math.max(max, 0)
  if (low === high) return { ticks: [0, 100], domain: [0, 100] }
  // passos em REAIS (centavos / 100) para o passo cair em valores redondos de reais
  const stepReais = niceStep((high - low) / 100 / Math.max(1, count))
  const step = Math.max(1, Math.round(stepReais * 100))
  let first = Math.floor(low / step) * step
  // com valores negativos, sobra ao menos 60% de um passo abaixo do menor valor: o rótulo do menor saldo
  // (abaixo do ponto) e o rótulo de barra negativa não encostam no eixo X
  if (low < 0 && low - first < step * 0.6) first -= step
  const last = Math.ceil(high / step) * step
  const ticks: number[] = []
  for (let tick = first; tick <= last + step / 2; tick += step) ticks.push(tick)
  return { ticks, domain: [first, last] }
}

const compactFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

// "R$ 8,5 mil" / "−R$ 1,2 mil": rótulo curto de eixo e de barra (o valor exato fica no tooltip e na
// tabela acessível).
export function compactBRL(cents: number): string {
  return compactFormatter.format(cents / 100)
}
