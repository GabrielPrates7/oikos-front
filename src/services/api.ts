// Camada HTTP desacoplada de UI/roteamento: não importa React Router. Quem quiser reagir
// a uma sessão expirada (ex: navegar pra /login) registra um callback via setOnUnauthorized.
import { clearToken, getToken, setToken } from './tokenStore'

const BASE_URL = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type UnauthorizedHandler = () => void

let onUnauthorizedHandler: UnauthorizedHandler | null = null

export function setOnUnauthorized(handler: UnauthorizedHandler): void {
  onUnauthorizedHandler = handler
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json()
    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
      return data.error
    }
  } catch {
    // resposta sem corpo JSON (ex: 204, ou erro de rede/proxy) — cai no fallback abaixo.
  }
  return `Erro ${response.status}`
}

function buildHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers)
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return headers
}

function rawRequest(path: string, options: RequestInit): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options),
    credentials: 'include',
  })
}

/**
 * Chama POST /auth/refresh direto, sem passar pelo interceptor de 401 do apiFetch (evita
 * recursão). Retorna o novo accessToken em caso de sucesso, ou null se não houver sessão
 * válida — não dispara onUnauthorized, quem chama decide o que fazer com o resultado (ver
 * AuthContext: a checagem silenciosa no mount usa isso sem tratar "sem sessão" como erro).
 */
export async function refreshSession(): Promise<string | null> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // erro de rede (ex: backend fora do ar) conta como "sem sessão válida", não como
    // exceção não tratada — quem chama (AuthContext) não pode ficar preso em loading.
    return null
  }
  if (!response.ok) {
    return null
  }
  const data: unknown = await response.json()
  if (
    !data ||
    typeof data !== 'object' ||
    typeof (data as { accessToken?: unknown }).accessToken !== 'string'
  ) {
    return null
  }
  const accessToken = (data as { accessToken: string }).accessToken
  setToken(accessToken)
  return accessToken
}

interface ApiFetchOptions extends RequestInit {
  // 'json' (padrão) cobre todo o resto da API. 'blob' é só pra download de arquivo (ex.:
  // exportar dados em CSV) — mesmo fluxo de token/401/refresh, só muda o parse final.
  responseType?: 'json' | 'blob'
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  // Sem token não há sessão pra expirar — um 401 aqui é resposta normal de endpoint público
  // (ex: /auth/login com senha errada), não sinal de sessão inválida. Sem essa distinção, um
  // login com credenciais erradas disparava o mesmo fluxo de refresh+onUnauthorized de uma
  // sessão expirada, descartando a mensagem real da API (ex: "credenciais inválidas").
  const hadToken = Boolean(getToken())
  let response = await rawRequest(path, options)

  if (response.status === 401 && hadToken) {
    const refreshedToken = await refreshSession()
    if (refreshedToken) {
      response = await rawRequest(path, options)
    } else {
      clearToken()
      onUnauthorizedHandler?.()
      throw new ApiError(401, 'não autenticado')
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response))
  }

  if (options.responseType === 'blob') {
    return (await response.blob()) as T
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
