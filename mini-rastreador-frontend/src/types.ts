// Mesmos valores do enum StatusPedido do back
export type StatusPedido =
  | 'RECEBIDO'
  | 'EM_PREPARO'
  | 'SAIU_PARA_ENTREGA'
  | 'ENTREGUE'
  | 'CANCELADO'

export interface ItemPedido {
  id?: number
  name: string
  quantity: number
  unitPrice: number
  subtotal?: number
}

export interface Pedido {
  id: number
  customerName: string
  deliveryAddress: string
  status: StatusPedido
  createdAt: string
  items: ItemPedido[]
  total: number
}

export interface RespostaAutenticacao {
  token: string
  userId: number
  name: string
  email: string
}

export interface ApiError {
  message?: string
  error?: string
  status?: number
}