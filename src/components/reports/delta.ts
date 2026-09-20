// Variação entre um valor base e um valor comparado, tudo em centavos inteiros. Utilitário
// puro: só apresentação/aritmética de exibição, nunca regra financeira. Nunca devolve
// Infinity nem NaN.

export type DeltaKind = 'novo' | 'zerou' | 'igual' | 'normal'

export interface Delta {
  // comparado − base, em centavos.
  diff: number
  // Percentual sobre |base| com 1 casa decimal. Só existe em kind 'normal'.
  pct: number | null
  kind: DeltaKind
}

function safe(value: number): number {
  return Number.isFinite(value) ? value : 0
}

// 'novo':   base 0 e comparado ≠ 0 (não há base pra dividir; normalmente comparado > 0);
// 'zerou':  comparado 0 e base > 0;
// 'igual':  ambos 0 ou diferença 0;
// 'normal': o resto — percentual = diff / |base| (|base| pra base negativa, ex.: Resultado).
export function computeDelta(baseCents: number, comparedCents: number): Delta {
  const base = safe(baseCents)
  const compared = safe(comparedCents)
  const diff = compared - base

  if (diff === 0) return { diff: 0, pct: null, kind: 'igual' }
  if (base === 0) return { diff, pct: null, kind: 'novo' }
  if (compared === 0 && base > 0) return { diff, pct: null, kind: 'zerou' }

  // `|| 0` normaliza -0 (ex.: -0,04% arredondado) pra 0.
  const pct = Math.round((diff / Math.abs(base)) * 1000) / 10 || 0
  return { diff, pct, kind: 'normal' }
}
