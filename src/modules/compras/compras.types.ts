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
  is_planned: boolean
  // Observação opcional (texto livre, até 500 caracteres). Sempre renderizar como texto.
  notes: string | null
  created_at: string
  category_name: string
  category_icon: string | null
  payment_status: PurchasePaymentStatus
  // true se QUALQUER parcela estiver numa fatura já paga — trava edição estrutural
  // (valor/parcelas/data/cartão) e bloqueia exclusão, tanto aqui quanto no backend.
  has_paid_installment: boolean
  // Meses ('YYYY-MM') das faturas onde existe parcela desta compra — uma compra parcelada tem
  // uma só purchase_date, mas parcelas em vários meses/anos.
  installment_months: string[]
}

// Retorno de POST /purchases (ver purchases.service.createPurchase no backend) — a compra
// "crua" da tabela, sem os campos de JOIN (category_name, payment_status,
// has_paid_installment) que só existem na listagem por cartão. Usado pelo formulário único
// de lançamento pra montar a mensagem de sucesso (fatura/mês da parcela 1).
export interface RawPurchase {
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
  is_planned: boolean
  notes: string | null
  created_at: string
}

export interface PurchaseInstallment {
  id: string
  purchase_id: string
  invoice_id: string
  installment_number: number
  amount_cents: number
}
