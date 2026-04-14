import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, MessageCircle, ShoppingBag, Search, ChevronDown, ChevronUp } from 'lucide-react'

export default function AdminClientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState(null)
  const [pedidosCliente, setPedidosCliente] = useState({})

  useEffect(() => { buscarClientes() }, [])

  async function buscarClientes() {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
    setClientes(data || [])
    setLoading(false)
  }

  async function buscarPedidosCliente(clienteId) {
    if (pedidosCliente[clienteId]) return
    const { data } = await supabase
      .from('pedidos')
      .select('id, total, status, data_retirada, created_at')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })
    setPedidosCliente(prev => ({ ...prev, [clienteId]: data || [] }))
  }

  function toggleExpandir(clienteId) {
    if (expandido === clienteId) {
      setExpandido(null)
    } else {
      setExpandido(clienteId)
      buscarPedidosCliente(clienteId)
    }
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone?.includes(busca)
  )

  const STATUS_COR = { novo: '#3b82f6', confirmado: '#8b5cf6', producao: '#f59e0b', pronto: '#10b981', entregue: '#6b7280', cancelado: '#ef4444' }
  const STATUS_LABEL = { novo: 'Novo', confirmado: 'Confirmado', producao: 'Produzindo', pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado' }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#2C2C2A', margin: 0 }}>Clientes</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: '4px 0 0' }}>{clientes.length} clientes cadastrados</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 26, fontWeight: 800, color: '#3b82f6', margin: '0 0 2px' }}>{clientes.length}</p>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Total de clientes</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 26, fontWeight: 800, color: '#10b981', margin: '0 0 2px' }}>
            {clientes.filter(c => {
              const d = new Date(c.created_at)
              const agora = new Date()
              return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear()
            }).length}
          </p>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Novos este mês</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 26, fontWeight: 800, color: '#D4537E', margin: '0 0 2px' }}>{clientes.length}</p>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Com WhatsApp</p>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ background: '#fff', borderRadius: 14, height: 64, border: '1px solid #f3f4f6' }} />)}
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <p>Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {clientesFiltrados.map(cliente => {
            const aberto = expandido === cliente.id
            const pedidos = pedidosCliente[cliente.id] || []
            const iniciais = cliente.nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

            return (
              <div key={cliente.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f3f4f6', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }} onClick={() => toggleExpandir(cliente.id)}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#D4537E', flexShrink: 0 }}>
                    {iniciais}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: '#2C2C2A', fontSize: 15, margin: '0 0 2px' }}>{cliente.nome}</p>
                    <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>{cliente.telefone}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                      Cliente desde {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <a
                      href={'https://wa.me/55' + cliente.telefone}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ width: 34, height: 34, borderRadius: '50%', background: '#dcfce7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', textDecoration: 'none' }}
                    >
                      <MessageCircle size={16} />
                    </a>
                    {aberto ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
                  </div>
                </div>

                {aberto && (
                  <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f3f4f6' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', margin: '14px 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShoppingBag size={14} />
                      Histórico de pedidos
                    </p>
                    {pedidos.length === 0 ? (
                      <p style={{ color: '#9ca3af', fontSize: 13 }}>Nenhum pedido encontrado</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {pedidos.map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f9fafb', borderRadius: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ background: STATUS_COR[p.status] + '20', color: STATUS_COR[p.status], fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>{STATUS_LABEL[p.status]}</span>
                              <span style={{ fontSize: 12, color: '#9ca3af' }}>#{p.id.slice(0,8).toUpperCase()}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                              <span style={{ fontSize: 13, color: '#D4537E', fontWeight: 600 }}>R$ {p.total?.toFixed(2).replace('.', ',')}</span>
                              <span style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(p.data_retirada + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px 0' }}>
                          <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Total gasto</span>
                          <span style={{ fontSize: 14, color: '#D4537E', fontWeight: 700 }}>
                            R$ {pedidos.filter(p => p.status !== 'cancelado').reduce((acc, p) => acc + (p.total || 0), 0).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
