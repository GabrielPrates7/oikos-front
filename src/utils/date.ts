// Recebe 'YYYY-MM-DD' cru (mesmo formato que o backend devolve, sem parser de timezone —
// ver custom type parser da OID 1082 no config/database.ts do oikos-back) e reformata via
// string, nunca via `new Date(...)`: evita o bug clássico de data mudar de dia por causa
// de fuso horário.
export function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return isoDate
  return `${day}/${month}/${year}`
}

const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

// reference_month vem como 'YYYY-MM-01' (sempre dia 1) — formata pra "Setembro/2026".
export function formatReferenceMonth(isoDate: string): string {
  const [year, month] = isoDate.split('-')
  if (!year || !month) return isoDate
  const monthName = MONTH_NAMES_PT[Number(month) - 1] ?? month
  return `${monthName}/${year}`
}

// Dashboard usa 'YYYY-MM' (sem dia) — formata pra "Setembro 2026" (sem barra, diferente
// de formatReferenceMonth que é usado em Faturas).
export function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split('-')
  if (!year || !monthNum) return month
  const monthName = MONTH_NAMES_PT[Number(monthNum) - 1] ?? monthNum
  return `${monthName} ${year}`
}

// Aritmética de mês em cima da string 'YYYY-MM' via Date.UTC — UTC evita que o cálculo
// dependa do fuso horário do navegador (não estamos lidando com uma data real, só com
// um par ano/mês).
export function shiftMonth(month: string, delta: number): string {
  const [year, monthNum] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthNum - 1 + delta, 1))
  const newYear = date.getUTCFullYear()
  const newMonth = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${newYear}-${newMonth}`
}

export function currentMonthString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}
