// Access token em memória (variável de módulo), nunca em localStorage/sessionStorage —
// evita exposição do token a um ataque de XSS que consiga ler o storage do navegador.
// Ele se perde no reload por design; a sessão volta via POST /auth/refresh (cookie httpOnly).
let accessToken: string | null = null

export function getToken(): string | null {
  return accessToken
}

export function setToken(token: string | null): void {
  accessToken = token
}

export function clearToken(): void {
  accessToken = null
}
