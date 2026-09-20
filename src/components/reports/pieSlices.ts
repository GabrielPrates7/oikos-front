import { rankAndGroup } from '../../modules/relatorios/visaoGeral.utils'
import type { RankedItem, RankedRow } from '../../modules/relatorios/visaoGeral.utils'

// Cinza neutro da fatia "Demais (N)" / "Fora do filtro (N)". NUNCA "Outros" (já existe
// categoria real com esse nome).
export const PIE_REST_COLOR = '#6b7a70'
export const PIE_MAX_SLICES = 7

// No máximo `maxSlices` fatias: as (maxSlices − 1) maiores + "Demais (N)". Soma em centavos
// inteiros; itens zerados saem.
export function buildPieSlices(items: RankedItem[], maxSlices = PIE_MAX_SLICES): RankedRow[] {
  return rankAndGroup(items, PIE_REST_COLOR, maxSlices, maxSlices - 1)
}
