// Requisição cancelada (AbortController) não é erro de verdade: quem chama só descarta.
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
