import type { RespostaAutenticacao, Pedido, StatusPedido } from './types'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')
const TOKEN_KEY = 'pedidos_delivery_token'
const USER_KEY = 'pedidos_delivery_user'

// Dados do usuário guardados no navegador depois do login
export interface UsuarioSessao {
  userId: number
  name: string
  email: string
}

export function obterToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function obterUsuarioSessao(): UsuarioSessao | null {
  const value = localStorage.getItem(USER_KEY)
  if (!value) return null
  try {
    return JSON.parse(value) as UsuarioSessao
  } catch {
    return null
  }
}

export function salvarSessao(response: RespostaAutenticacao): void {
  localStorage.setItem(TOKEN_KEY, response.token)
  localStorage.setItem(USER_KEY, JSON.stringify({
    userId: response.userId,
    name: response.name,
    email: response.email,
  }))
}

export function limparSessao(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// Função base de todas as chamadas: já coloca o token no header e trata os erros da API
async function request<T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (authenticated) {
    const token = obterToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!response.ok) {
    let message = `Erro ${response.status}`
    try {
      const body = await response.json() as { message?: string; error?: string }
      message = body.message || body.error || message
    } catch {
      // Mantém a mensagem HTTP quando a resposta não for JSON.
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(`${message}. Confira seu login e tente novamente.`)
    }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

// Cadastro e login não mandam token (o último parâmetro, false)
export const autenticacaoApi = {
  cadastrar: (name: string, email: string, password: string) =>
    request<RespostaAutenticacao>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }, false),
  entrar: (email: string, password: string) =>
    request<RespostaAutenticacao>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false),
}

// Chamadas dos pedidos (precisam do usuário logado)
export const pedidosApi = {
  listar: () => request<Pedido[]>('/api/orders'),
  criar: (payload: {
    customerName: string
    deliveryAddress: string
    items: { name: string; quantity: number; unitPrice: number }[]
  }) => request<Pedido>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  atualizarStatus: (id: number, status: StatusPedido) =>
    request<Pedido>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
}