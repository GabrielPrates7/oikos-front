// Recebe 'YYYY-MM-DD' cru (mesmo formato que o backend devolve, sem parser de timezone —
// ver custom type parser da OID 1082 no config/database.ts do oikos-back) e reformata via
// string, nunca via `new Date(...)`: evita o bug clássico de data mudar de dia por causa
// de fuso horário.
export function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return isoDate
  return `${day}/${month}/${year}`
}

export const MONTH_NAMES_PT = [
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

// Separa 'YYYY-MM' nos dois <select> (Mês/Ano) dos filtros de Entradas/Despesas — mantém o
// valor combinado como uma string só (o formato que a API já espera), só isso.
export function splitMonthString(month: string): { year: string; monthNum: string } {
  const [year, monthNum] = month.split('-')
  return { year: year ?? String(new Date().getFullYear()), monthNum: monthNum ?? '01' }
}

// Espelha oikos-back/src/utils/date-range.ts (monthRange) — usado no cliente pra filtrar
// entradas mescladas (pagamento/fatura em aberto) pelo mesmo mês em vista na lista, sem
// depender de uma ida ao servidor só pra saber os limites do mês.
export function monthRange(month: string): { monthStart: string; monthEnd: string } {
  const [yearStr, monthStr] = month.split('-')
  const year = Number(yearStr)
  const monthNum = Number(monthStr)
  const daysInMonth = new Date(year, monthNum, 0).getDate()
  return {
    monthStart: `${yearStr}-${monthStr}-01`,
    monthEnd: `${yearStr}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`,
  }
}

// Duplicar lançamento: sugere a mesma data no mês seguinte. Mês seguinte sem esse dia (ex:
// 31 de janeiro) cai pro último dia disponível — mesmo clamp usado no parcelamento de cartão.
export function nextMonthSameDay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate()
  const clampedDay = Math.min(day, daysInNextMonth)
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
}

const MONTH_ABBR_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

// Rótulo compacto ("Set/26") pro eixo X do gráfico de evolução mensal — com até 24
// pontos, o nome completo do mês ("Setembro 2026") não cabe sem sobrepor em mobile.
export function formatMonthShort(month: string): string {
  const [year, monthNum] = month.split('-')
  if (!year || !monthNum) return month
  const abbr = MONTH_ABBR_PT[Number(monthNum) - 1] ?? monthNum
  return `${abbr}/${year.slice(2)}`
}

// "Hoje" como YYYY-MM-DD no fuso America/Sao_Paulo. new Date().toISOString() daria a data em
// UTC, que na noite de Sao Paulo ja e "amanha". O locale en-CA formata como YYYY-MM-DD.
export function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

// Diferenca em dias de calendario entre duas datas YYYY-MM-DD (to - from). Usa Date.UTC com
// numeros ja separados, nunca new Date("YYYY-MM-DD") (que tambem parseia como UTC mas mistura
// com o fuso local ao ler de volta e erra em 1 dia). Puramente aritmetica de calendario.
export function daysBetween(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number)
  const [ty, tm, td] = toIso.split('-').map(Number)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000)
}

// "15 de setembro de 2026" — pro tooltip do prazo.
export function formatDateLong(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return `${day} de ${MONTH_NAMES_PT[month - 1].toLowerCase()} de ${year}`
}
