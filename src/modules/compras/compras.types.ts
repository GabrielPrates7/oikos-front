export type PurchasePaymentStatus = 'paid' | 'pending'

// Nível de compra só — sem parcelas/faturas, que têm seu próprio módulo (Faturas, fase
// futura). Vem com categoria já resolvida (nome/ícone) via JOIN no backend. payment_status:
// 'paid' só quando todas as parcelas já estão em fatura paga.
export interface Purchase {
  id: string
  user_id: string
  credit_card_id: string
  category_id: string
  description: string
  total_amount_cents: number
  installments_count: number
  purchase_date: string
  is_essential: boolean
  is_fixed: boolean
  created_at: string
  category_name: string
  category_icon: string | null
  payment_status: PurchasePaymentStatus
}
