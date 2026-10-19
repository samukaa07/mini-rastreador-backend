import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownToLine, ArrowRight, Check, ChefHat, CircleAlert,
  Clock3, LogOut, MapPin, Package, Plus, RefreshCw, Search, ShoppingBag,
  Truck, Utensils, X
} from 'lucide-react'
import { autenticacaoApi, limparSessao, obterUsuarioSessao, obterToken, pedidosApi, salvarSessao } from './api'
import type { UsuarioSessao } from './api'
import type { Pedido, StatusPedido } from './types'

type AuthMode = 'login' | 'register'
type FilterStatus = 'TODOS' | StatusPedido

const statusLabels: Record<StatusPedido, string> = {
  RECEBIDO: 'Recebido',
  EM_PREPARO: 'Em preparo',
  SAIU_PARA_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}

const statusFlow: StatusPedido[] = ['RECEBIDO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE']

function formatarDinheiro(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function formatarDataHora(value: string): string {
  if (!value) return 'Data não informada'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short', timeStyle: 'short',
  }).format(date)
}

function proximoStatus(status: StatusPedido): StatusPedido | null {
  const index = statusFlow.indexOf(status)
  if (index < 0 || index >= statusFlow.length - 1) return null
  return statusFlow[index + 1]
}

function App() {
  const [user, setUser] = useState<UsuarioSessao | null>(() => obterUsuarioSessao())
  const [hasToken, setHasToken] = useState<boolean>(() => Boolean(obterToken()))
  const [orders, setOrders] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(false)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('TODOS')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const loadOrders = useCallback(async () => {
    if (!obterToken()) return
    setLoading(true)
    setPageError('')
    try {
      const result = await pedidosApi.listar()
      setOrders(result)
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Não foi possível carregar os pedidos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hasToken) void loadOrders()
  }, [hasToken, loadOrders])

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return orders.filter(order => {
      const matchesStatus = filter === 'TODOS' || order.status === filter
      const matchesSearch = !term
        || String(order.id).includes(term)
        || order.customerName.toLocaleLowerCase('pt-BR').includes(term)
        || order.deliveryAddress.toLocaleLowerCase('pt-BR').includes(term)
      return matchesStatus && matchesSearch
    })
  }, [orders, filter, search])

  const counts = useMemo(() => ({
    total: orders.length,
    active: orders.filter(order => ['RECEBIDO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA'].includes(order.status)).length,
    delivered: orders.filter(order => order.status === 'ENTREGUE').length,
    cancelled: orders.filter(order => order.status === 'CANCELADO').length,
  }), [orders])

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthBusy(true)
    setAuthError('')
    try {
      const response = authMode === 'register'
        ? await autenticacaoApi.cadastrar(authName.trim(), authEmail.trim(), authPassword)
        : await autenticacaoApi.entrar(authEmail.trim(), authPassword)
      salvarSessao(response)
      setUser({ userId: response.userId, name: response.name, email: response.email })
      setHasToken(true)
      setAuthPassword('')
      setNotice(authMode === 'register' ? 'Conta criada com sucesso!' : 'Login realizado com sucesso!')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível autenticar.')
    } finally {
      setAuthBusy(false)
    }
  }

  function logout() {
    limparSessao()
    setUser(null)
    setHasToken(false)
    setOrders([])
    setNotice('')
    setPageError('')
  }

  function resetOrderForm() {
    setCustomerName('')
    setDeliveryAddress('')
    setItemName('')
    setQuantity('1')
    setUnitPrice('')
  }

  async function handleCreateOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const price = Number(unitPrice.replace(',', '.'))
    const qty = Number(quantity)
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(qty) || qty < 1) {
      setPageError('Informe uma quantidade inteira positiva e um preço maior que zero.')
      return
    }
    setSavingOrder(true)
    setPageError('')
    try {
      await pedidosApi.criar({
        customerName: customerName.trim(),
        deliveryAddress: deliveryAddress.trim(),
        items: [{ name: itemName.trim(), quantity: qty, unitPrice: price }],
      })
      setShowCreate(false)
      resetOrderForm()
      setNotice('Pedido criado com sucesso!')
      await loadOrders()
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Não foi possível criar o pedido.')
    } finally {
      setSavingOrder(false)
    }
  }

  async function handleStatus(order: Pedido, status: StatusPedido) {
    setUpdatingId(order.id)
    setPageError('')
    try {
      await pedidosApi.atualizarStatus(order.id, status)
      setNotice(`Pedido #${order.id} atualizado para ${statusLabels[status].toLowerCase()}.`)
      await loadOrders()
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Não foi possível atualizar o status.')
    } finally {
      setUpdatingId(null)
    }
  }

  if (!hasToken) {
    return (
      <div className="auth-shell">
        <section className="auth-visual">
          <div className="brand brand-light"><span className="brand-icon"><Package size={22} /></span><span>Pedidos<span className="brand-accent">.Delivery</span></span></div>
          <div className="auth-hero">
            <span className="eyebrow light-eyebrow"><span className="live-dot" /> RASTREAMENTO SIMPLES</span>
            <h1>Seu pedido.<br />No caminho certo.</h1>
            <p>Organize pedidos, acompanhe cada etapa e tenha tudo sob controle em um só lugar.</p>
            <div className="delivery-illustration">
              <div className="illustration-glow" />
              <div className="route-line"><span /><span /><span /></div>
              <div className="illustration-package"><ShoppingBag size={42} strokeWidth={1.5} /></div>
              <div className="illustration-pin"><MapPin size={26} /></div>
              <div className="floating-chip"><Check size={15} /> Entrega acompanhada</div>
            </div>
          </div>
          <div className="auth-footnote">Mini Rastreador de Pedidos · Projeto demonstrativo</div>
        </section>
        <section className="auth-panel">
          <div className="auth-form-wrap">
            <div className="mobile-brand brand"><span className="brand-icon"><Package size={22} /></span><span>Pedidos<span className="brand-accent">.Delivery</span></span></div>
            <span className="eyebrow">BEM-VINDO</span>
            <h2>{authMode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}</h2>
            <p className="muted auth-subtitle">{authMode === 'login' ? 'Acesse seus pedidos e acompanhe as entregas.' : 'Cadastre-se para começar a organizar seus pedidos.'}</p>
            {authError && <div className="alert alert-error"><CircleAlert size={17} />{authError}</div>}
            <form className="form-stack" onSubmit={handleAuth}>
              {authMode === 'register' && (
                <label className="field">
                  <span>Nome completo</span>
                  <input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Como podemos te chamar?" required maxLength={100} autoComplete="name" />
                </label>
              )}
              <label className="field">
                <span>E-mail</span>
                <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="voce@exemplo.com" required maxLength={160} autoComplete="email" />
              </label>
              <label className="field">
                <span>Senha</span>
                <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder={authMode === 'register' ? 'Mínimo de 8 caracteres' : 'Digite sua senha'} required minLength={authMode === 'register' ? 8 : 1} maxLength={72} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} />
              </label>
              <button className="button button-primary button-full" type="submit" disabled={authBusy}>
                {authBusy ? 'Aguarde...' : authMode === 'login' ? 'Entrar' : 'Criar conta'}
                {!authBusy && <ArrowRight size={17} />}
              </button>
            </form>
            <div className="auth-switch">
              {authMode === 'login' ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
              <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('') }}>
                {authMode === 'login' ? 'Cadastre-se' : 'Fazer login'}
              </button>
            </div>
            <div className="secure-note"><span className="secure-dot" /> Acesso protegido por autenticação</div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-icon"><Package size={22} /></span><span>Pedidos<span className="brand-accent">.Delivery</span></span></div>
        <div className="workspace-label">ESPAÇO DE TRABALHO</div>
        <nav className="side-nav">
          <a className="nav-link active" href="#pedidos"><ShoppingBag size={18} /> Pedidos <span className="nav-count">{counts.total}</span></a>
          <a className="nav-link" href="#resumo"><Activity size={18} /> Visão geral</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><Truck size={20} /></div>
            <strong>Entrega sob controle</strong>
            <p>Acompanhe cada etapa do seu pedido.</p>
          </div>
          <div className="profile-row">
            <div className="avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
            <div className="profile-info"><strong>{user?.name || 'Usuário'}</strong><span>{user?.email || ''}</span></div>
            <button className="icon-button logout-button" title="Sair da conta" onClick={logout}><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-separator">/</span><strong>Pedidos</strong></div>
          <div className="topbar-right"><span className="api-indicator"><span /> API de pedidos</span><button className="button button-primary" onClick={() => { setShowCreate(true); setPageError('') }}><Plus size={17} /> Novo pedido</button></div>
        </header>

        <section className="page-heading" id="resumo">
          <div>
            <span className="eyebrow">PAINEL DE CONTROLE</span>
            <h1>Seus pedidos</h1>
            <p>Acompanhe os pedidos e veja o que está acontecendo em cada entrega.</p>
          </div>
          <button className="button button-secondary refresh-button" onClick={() => void loadOrders()} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} /> Atualizar</button>
        </section>

        {notice && <div className="alert alert-success"><Check size={17} /><span>{notice}</span><button className="alert-close" onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={16} /></button></div>}
        {pageError && <div className="alert alert-error"><CircleAlert size={17} /><span>{pageError}</span><button className="alert-close" onClick={() => setPageError('')} aria-label="Fechar erro"><X size={16} /></button></div>}

        <section className="stats-grid">
          <CartaoEstatistica icon={<Package size={19} />} label="Total de pedidos" value={counts.total} caption="Pedidos cadastrados" tone="purple" />
          <CartaoEstatistica icon={<Clock3 size={19} />} label="Em andamento" value={counts.active} caption="Precisam de acompanhamento" tone="orange" />
          <CartaoEstatistica icon={<Check size={19} />} label="Entregues" value={counts.delivered} caption="Finalizados com sucesso" tone="green" />
          <CartaoEstatistica icon={<ArrowDownToLine size={19} />} label="Cancelados" value={counts.cancelled} caption="Pedidos cancelados" tone="red" />
        </section>

        <section className="orders-panel" id="pedidos">
          <div className="panel-heading">
            <div><h2>Lista de pedidos</h2><p>Consulte detalhes e acompanhe o status atual.</p></div>
            <span className="results-count">{filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}</span>
          </div>
          <div className="toolbar">
            <label className="search-box"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente, endereço ou ID..." /></label>
            <label className="filter-select"><span>Status:</span><select value={filter} onChange={e => setFilter(e.target.value as FilterStatus)}>
              <option value="TODOS">Todos</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></label>
          </div>

          {loading && orders.length === 0 ? (
            <div className="loading-state"><span className="loader" /><p>Carregando pedidos...</p></div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Package size={29} /></div>
              <h3>{orders.length === 0 ? 'Nenhum pedido por aqui ainda' : 'Nenhum resultado encontrado'}</h3>
              <p>{orders.length === 0 ? 'Crie seu primeiro pedido para começar a acompanhar as entregas.' : 'Tente alterar a busca ou o filtro de status.'}</p>
              {orders.length === 0 && <button className="button button-primary" onClick={() => setShowCreate(true)}><Plus size={17} /> Criar primeiro pedido</button>}
            </div>
          ) : (
            <div className="orders-list">
              {filteredOrders.map(order => <CartaoPedido key={order.id} order={order} updating={updatingId === order.id} onStatus={status => void handleStatus(order, status)} />)}
            </div>
          )}
          <div className="panel-footer"><span>Exibindo {filteredOrders.length} de {orders.length} pedidos</span><span><span className="footer-dot" /> Dados atualizados ao recarregar</span></div>
        </section>
        <footer className="app-footer"><span>Pedidos.Delivery <span>·</span> Mini Rastreador de Pedidos</span><span>Projeto técnico demonstrativo</span></footer>
      </main>

      {showCreate && (
        <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowCreate(false) }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-title">
            <div className="modal-heading">
              <div className="modal-title-icon"><Utensils size={20} /></div>
              <div><h2 id="create-title">Criar novo pedido</h2><p>Preencha os dados para registrar a entrega.</p></div>
              <button className="icon-button modal-close" onClick={() => setShowCreate(false)} aria-label="Fechar"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateOrder} className="form-stack modal-form">
              <label className="field"><span>Nome do cliente</span><input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ex.: Maria Silva" required maxLength={120} /></label>
              <label className="field"><span>Endereço de entrega</span><input value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Rua, número, bairro e cidade" required maxLength={250} /></label>
              <div className="form-section-title"><ChefHat size={17} /> Item do pedido</div>
              <label className="field"><span>Nome do item</span><input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Ex.: Hambúrguer artesanal" required maxLength={120} /></label>
              <div className="field-row">
                <label className="field"><span>Quantidade</span><input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" step="1" required /></label>
                <label className="field"><span>Preço unitário (R$)</span><input type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} min="0.01" step="0.01" placeholder="0,00" required /></label>
              </div>
              {Number(unitPrice.replace(',', '.')) > 0 && Number(quantity) > 0 && <div className="order-total"><span>Total estimado</span><strong>{formatarDinheiro(Number(unitPrice.replace(',', '.')) * Number(quantity))}</strong></div>}
              <div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setShowCreate(false)}>Cancelar</button><button type="submit" className="button button-primary" disabled={savingOrder}>{savingOrder ? 'Salvando...' : <><Plus size={17} /> Criar pedido</>}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

function CartaoEstatistica({ icon, label, value, caption, tone }: {
  icon: React.ReactNode
  label: string
  value: number
  caption: string
  tone: 'purple' | 'orange' | 'green' | 'red'
}) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-caption">{caption}</div></article>
}

function CartaoPedido({ order, updating, onStatus }: {
  order: Pedido
  updating: boolean
  onStatus: (status: StatusPedido) => void
}) {
  const next = proximoStatus(order.status)
  const canCancel = order.status === 'RECEBIDO' || order.status === 'EM_PREPARO'
  const total = typeof order.total === 'number' ? order.total : order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  return (
    <article className="order-card">
      <div className="order-card-top">
        <div className="order-id-wrap"><div className="order-icon"><ShoppingBag size={19} /></div><div><div className="order-number">Pedido #{order.id}</div><div className="order-date">{formatarDataHora(order.createdAt)}</div></div></div>
        <SeloStatus status={order.status} />
      </div>
      <div className="order-card-body">
        <div className="order-info-grid">
          <div className="order-info"><span className="info-label">CLIENTE</span><strong>{order.customerName}</strong></div>
          <div className="order-info address-info"><span className="info-label">ENDEREÇO DE ENTREGA</span><strong><MapPin size={14} /> {order.deliveryAddress}</strong></div>
          <div className="order-info"><span className="info-label">ITENS</span><strong>{order.items.map(item => `${item.quantity}× ${item.name}`).join(', ')}</strong></div>
          <div className="order-info"><span className="info-label">VALOR TOTAL</span><strong className="order-price">{formatarDinheiro(total)}</strong></div>
        </div>
        <div className="order-progress">
          {statusFlow.map((status, index) => {
            const currentIndex = statusFlow.indexOf(order.status)
            const completed = order.status !== 'CANCELADO' && currentIndex >= index
            return <div className={`progress-step ${completed ? 'completed' : ''} ${order.status === 'CANCELADO' ? 'cancelled-step' : ''}`} key={status}>
              <span className="progress-node">{completed ? <Check size={12} /> : index + 1}</span><span>{statusLabels[status]}</span>
            </div>
          })}
        </div>
      </div>
      <div className="order-card-footer">
        <span className="order-status-note">{order.status === 'CANCELADO' ? 'Este pedido foi cancelado.' : order.status === 'ENTREGUE' ? 'Pedido concluído com sucesso.' : 'Próxima etapa: ' + (next ? statusLabels[next] : 'aguardando')}</span>
        <div className="order-actions">
          {canCancel && <button className="button button-danger-ghost" onClick={() => onStatus('CANCELADO')} disabled={updating}><X size={14} /> Cancelar</button>}
          {next && <button className="button button-small-primary" onClick={() => onStatus(next)} disabled={updating}>{updating ? 'Atualizando...' : <>{next === 'ENTREGUE' ? <Check size={15} /> : <ArrowRight size={15} />}{statusLabels[next]}</>}</button>}
        </div>
      </div>
    </article>
  )
}

function SeloStatus({ status }: { status: StatusPedido }) {
  const icon = status === 'RECEBIDO' ? <Clock3 size={13} />
    : status === 'EM_PREPARO' ? <ChefHat size={13} />
    : status === 'SAIU_PARA_ENTREGA' ? <Truck size={13} />
    : status === 'ENTREGUE' ? <Check size={13} />
    : <X size={13} />
  return <span className={`status-badge status-${status.toLowerCase()}`}>{icon}{statusLabels[status]}</span>
}

export default App