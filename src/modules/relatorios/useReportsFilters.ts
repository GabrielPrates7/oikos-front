import { useContext } from 'react'
import { ReportsFilterContext } from './reportsFilterContextInstance'

export function useReportsFilters() {
  const value = useContext(ReportsFilterContext)
  if (!value) {
    throw new Error('useReportsFilters deve ser usado dentro de ReportsFilterProvider')
  }
  return value
}
