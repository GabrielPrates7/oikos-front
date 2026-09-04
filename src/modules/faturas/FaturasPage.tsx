import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FormError } from '../../components/feedback/FormError'
import { PageHeader } from '../../components/layout/PageHeader'
import { useNavRedirectError } from '../../hooks/useNavRedirectError'
import { ApiError } from '../../services/api'
import { cartoesService } from '../cartoes/cartoes.service'
import type { CreditCard } from '../cartoes/cartoes.types'
import { FaturasList } from './FaturasList'
import { faturasService } from './faturas.service'
import type { InvoiceListItem } from './faturas.types'
import './FaturasPage.css'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

export function FaturasPage() {
  const navError = useNavRedirectError()
  const [searchParams] = useSearchParams()
  // Filtro inicial vem do link "Ver faturas" do Detalhe do cartão (?cartao=ID) — só lido
  // na primeira montagem, depois o Select controla o filtro normalmente.
  const [selectedCardId, setSelectedCardId] = useState(() => searchParams.get('cartao') ?? '')
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await cartoesService.list('all')
        if (active) {
          setCards(result)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar os cartões.'))
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const result = await faturasService.list(selectedCardId || undefined)
        if (active) {
          setInvoices(result)
        }
      } catch (error) {
        if (active) {
          setLoadError(errorMessage(error, 'Não foi possível carregar as faturas.'))
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
  }, [selectedCardId])

  return (
    <div className="faturas-page">
      <PageHeader title="Faturas" />
      <FormError message={navError ?? loadError} />
      {!loading && (
        <FaturasList
          invoices={invoices}
          cards={cards}
          selectedCardId={selectedCardId}
          onCardFilterChange={setSelectedCardId}
        />
      )}
    </div>
  )
}
