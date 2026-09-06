import { useEffect, useState } from 'react'
import { MonthlyEvolutionChart } from '../../components/charts/MonthlyEvolutionChart'
import { FormError } from '../../components/feedback/FormError'
import { Select } from '../../components/ui/Select'
import { ApiError } from '../../services/api'
import { relatoriosService } from './relatorios.service'
import type { MonthlyEvolutionItem } from './relatorios.types'
import './EvolucaoMensalTab.css'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

const PERIOD_OPTIONS = [
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
  { value: '24', label: '24 meses' },
]

export function EvolucaoMensalTab() {
  const [monthsBack, setMonthsBack] = useState(6)
  const [months, setMonths] = useState<MonthlyEvolutionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const result = await relatoriosService.getMonthlyEvolution(monthsBack)
        if (active) {
          setMonths(result.months)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar a evolução mensal.'))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [monthsBack])

  return (
    <div className="evolucao-mensal-tab">
      <div className="evolucao-mensal-tab__controls">
        <Select
          label="Período"
          options={PERIOD_OPTIONS}
          value={String(monthsBack)}
          onChange={(event) => setMonthsBack(Number(event.target.value))}
        />
      </div>
      <FormError message={loadError} />
      {!loading && <MonthlyEvolutionChart data={months} />}
    </div>
  )
}
