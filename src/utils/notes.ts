// Limite da observação: 500 CARACTERES contados por pontos de código (Array.from), o mesmo cálculo do
// backend (notesSchema) e do char_length do Postgres. Um emoji conta 1 (em UTF-16 seria 2), então o
// "maxLength" nativo do textarea (que conta unidades UTF-16) NÃO serve: o corte é feito aqui.
export const NOTES_MAX_LENGTH = 500

export function countCodePoints(text: string): number {
  return Array.from(text).length
}

// Corta o texto nos primeiros `max` pontos de código (nunca no meio de um par substituto).
export function truncateToCodePoints(text: string, max: number = NOTES_MAX_LENGTH): string {
  const points = Array.from(text)
  return points.length <= max ? text : points.slice(0, max).join('')
}
