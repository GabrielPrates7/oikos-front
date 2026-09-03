const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function centsToBRL(cents: number): string {
  const safeValue = Number.isFinite(cents) ? cents : 0
  return brlFormatter.format(safeValue / 100)
}

/**
 * Estilo "campo mascarado" de app bancário: os dígitos digitados formam o valor em
 * centavos diretamente (ex: digitar "1234" vira R$ 12,34), sinal de "-" na entrada crua
 * marca negativo. Aceita qualquer entrada (vazia, só vírgula, lixo) sem nunca retornar NaN.
 *
 * O "-" é procurado em QUALQUER posição da string, não só no início: como o campo exibe
 * o valor já formatado (ex: "R$ 0,00"), digitar "-" no meio/fim do texto existente (o
 * caminho comum num input controlado, já que o cursor não reseta pro início sozinho)
 * ainda precisa marcar negativo. Em texto formatado de moeda BRL, "-" só aparece mesmo
 * como sinal (ex: "-R$ 50,00"), então checar a presença dele em qualquer lugar é seguro.
 */
export function parseBRLToCents(input: string): number {
  if (!input) {
    return 0
  }
  const isNegative = input.includes('-')
  const digitsOnly = input.replace(/\D/g, '')
  if (!digitsOnly) {
    return 0
  }
  const value = parseInt(digitsOnly, 10)
  if (Number.isNaN(value)) {
    return 0
  }
  return isNegative ? -value : value
}
