import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  currentYearMonthSP,
  toMonthString,
  unionYears,
} from '../../components/reports/reportPeriod'
import { despesasService } from '../despesas/despesas.service'
import { entradasService } from '../entradas/entradas.service'
import { ReportsFilterContext } from './reportsFilterContextInstance'

// Vive no layout de /relatorios (RelatoriosPage): desmonta ao sair da área, então o estado
// (mês/ano) volta ao padrão na próxima entrada. Só memória — nada de URL.
export function ReportsFilterProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState(() => currentYearMonthSP())
  const [years, setYears] = useState<number[]>(() => unionYears([], currentYearMonthSP().year))

  // Se um dos dois endpoints falhar, usa o que houver + o ano atual.
  useEffect(() => {
    let active = true
    Promise.allSettled([entradasService.getYears(), despesasService.getYears()]).then((results) => {
      if (!active) return
      const sources = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      )
      setYears(unionYears(sources, currentYearMonthSP().year))
    })
    return () => {
      active = false
    }
  }, [])

  const setMonthYear = useCallback((next: { month: number; year: number }) => {
    setSelected({ month: next.month, year: next.year })
  }, [])
  const reset = useCallback(() => setSelected(currentYearMonthSP()), [])

  const value = useMemo(() => {
    const current = currentYearMonthSP()
    return {
      month: selected.month,
      year: selected.year,
      monthString: toMonthString(selected),
      setMonthYear,
      years,
      isCustom: selected.month !== current.month || selected.year !== current.year,
      reset,
    }
  }, [selected, years, setMonthYear, reset])

  return <ReportsFilterContext.Provider value={value}>{children}</ReportsFilterContext.Provider>
}
