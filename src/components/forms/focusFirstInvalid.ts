import type { RefObject } from 'react'

// Depois de um envio inválido, leva o foco ao PRIMEIRO campo inválido na ordem da tela. Campos
// nativos (Input/Select/CurrencyInput) e o Combobox marcam aria-invalid no próprio controle; o
// SegmentedControl marca no radiogroup (o foco vai pro rádio que recebe Tab). Espera 50 ms pra os
// erros já estarem renderizados (setTimeout, não requestAnimationFrame: o rAF é pausado em aba oculta).
export function focusFirstInvalid(formRef: RefObject<HTMLFormElement | null>): void {
  window.setTimeout(() => {
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    if (!invalid) return
    const target =
      invalid.getAttribute('role') === 'radiogroup'
        ? (invalid.querySelector<HTMLElement>('[tabindex="0"]') ?? invalid)
        : invalid
    target.focus()
    target.scrollIntoView({ block: 'center', behavior: 'auto' })
  }, 50)
}
