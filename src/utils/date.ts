// Recebe 'YYYY-MM-DD' cru (mesmo formato que o backend devolve, sem parser de timezone —
// ver custom type parser da OID 1082 no config/database.ts do oikos-back) e reformata via
// string, nunca via `new Date(...)`: evita o bug clássico de data mudar de dia por causa
// de fuso horário.
export function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return isoDate
  return `${day}/${month}/${year}`
}
