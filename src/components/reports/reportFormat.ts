// Formatação/agregação de EXIBIÇÃO para Relatórios. Nada de regra financeira: só somas,
// subtrações e percentuais sobre centavos inteiros que o backend já devolveu. Divisão por
// zero nunca produz Infinity nem NaN.

// Razão em % (número), 0 quando o denominador é 0.
export function ratioPercent(part: number, whole: number): number {
  if (!whole || whole <= 0) return 0
  return (part / whole) * 100
}

// "12,3%" com 1 casa decimal. Valor positivo que arredonda pra 0,0 mostra "<0,1%".
export function formatPercent1(part: number, whole: number): string {
  if (!whole || whole <= 0 || part <= 0) return '0,0%'
  const value = (part / whole) * 100
  if (value < 0.05) return '<0,1%'
  return `${value.toFixed(1).replace('.', ',')}%`
}

export function sumCents(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many
}
