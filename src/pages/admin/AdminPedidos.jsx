import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ShoppingBag, Clock, CheckCircle, Package, Truck, XCircle, Eye, MessageCircle, RefreshCw, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS = {
  novo:       { label: 'Novo',        cor: '#3b82f6', bg: '#eff6ff', icon: ShoppingBag },
  confirmado: { label: 'Confirmado',  cor: '#8b5cf6', bg: '#f5f3ff', icon: CheckCircle },
  producao:   { label: 'Produzindo',  cor: '#f59e0b', bg: '#fffbeb', icon: Package },
  pronto:     { label: 'Pronto',      cor: '#10b981', bg: '#ecfdf5', icon: CheckCircle },
  entregue:   { label: 'Entregue',    cor: '#6b7280', bg: '#f9fafb', icon: Truck },
  cancelado:  { label: 'Cancelado',   cor: '#ef4444', bg: '#fef2f2', icon: XCircle },
}

const PROXIMOS_STATUS = {
  novo:       'confirmado',
  confirmado: 'producao',
  producao:   'pronto',
  pronto:     'entregue',
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.novo
  return (
    <span style={{ background: s.bg, color: s.cor, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function ModalPedido({ pedido, onFechar, onAtualizarStatus }) {
  const [itens, setItens] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.from('pedido_itens').select('*').eq('pedido_id', pedido.id).then(({ data }) => {
      setItens(data || [])
      setCarregando(false)
    })
  }, [pedido.id])

  const proximo = PROXIMOS_STATUS[pedido.status]
  const proximoLabel = proximo ? STATUS[proximo]?.label : null

  function abrirWhatsApp() {
    if (!pedido.clientes?.telefone) return toast.error('Telefone não encontrado')
    const tel = pedido.clientes.telefone
    const data = new Date(pedido.data_retirada + 'T12:00:00').toLocaleDateString('pt-BR')
    const msg = encodeURIComponent(
      `Olá ${pedido.clientes.nome}! 🍰\n\nSeu pedido da Tufit Delícias está *${STATUS[pedido.status]?.label}*!\n\nRetirada: ${data} às ${pedido.hora_retirada}\n\nQualquer dúvida, estamos aqui! 💕`
    )
    window.open('https://wa.me/55' + tel + '?text=' + msg, '_blank')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onFechar} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: 32, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2C2C2A', margin: '0 0 4px' }}>Pedido #{pedido.id.slice(0,8).toUpperCase()}</h2>
            <StatusBadge status={pedido.status} />
          </div>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20, padding: 4 }}>✕</button>
        </div>

        <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <p style={{ fontWeight: 600, color: '#2C2C2A', margin: '0 0 6px' }}>{pedido.clientes?.nome || '—'}</p>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '2px 0' }}>📱 {pedido.clientes?.telefone || '—'}</p>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '2px 0' }}>
            📅 {new Date(pedido.data_retirada + 'T12:00:00').toLocaleDateString('pt-BR')} às {pedido.hora_retirada}
          </p>
          {pedido.observacoes && <p style={{ color: '#6b7280', fontSize: 14, margin: '8px 0 0', fontStyle: 'italic' }}>💬 {pedido.observacoes}</p>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 600, color: '#2C2C2A', fontSize: 14, marginBottom: 10 }}>Itens do pedido</p>
          {carregando ? (
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Carregando...</p>
          ) : itens.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#2C2C2A', fontSize: 14 }}>{item.nome_produto} <span style={{ color: '#9ca3af' }}>x{item.quantidade}</span></span>
              <span style={{ color: '#D4537E', fontWeight: 600, fontSize: 14 }}>R$ {item.subtotal?.toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0' }}>
            <span style={{ fontWeight: 700, color: '#2C2C2A' }}>Total</span>
            <span style={{ fontWeight: 800, color: '#D4537E', fontSize: 18 }}>R$ {pedido.total?.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {proximo && (
            <button
              onClick={() => { onAtualizarStatus(pedido.id, proximo); onFechar() }}
              style={{ flex: 2, background: '#D4537E', color: '#fff', padding: '12px 16px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              Marcar como {proximoLabel} →
            </button>
          )}
          <button
            onClick={abrirWhatsApp}
            style={{ flex: 1, background: '#25D366', color: '#fff', padding: '12px 16px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <MessageCircle size={16} />
            WhatsApp
          </button>
          {pedido.status !== 'cancelado' && pedido.status !== 'entregue' && (
            <button
              onClick={() => { onAtualizarStatus(pedido.id, 'cancelado'); onFechar() }}
              style={{ background: '#fef2f2', color: '#ef4444', padding: '12px 16px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null)
  const [atualizando, setAtualizando] = useState(false)

  useEffect(() => {
    buscarPedidos()

    const canal = supabase.channel('pedidos-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        buscarPedidos()
      })
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [])

  async function buscarPedidos() {
    const { data } = await supabase
      .from('pedidos')
      .select('*, clientes(nome, telefone)')
      .order('created_at', { ascending: false })
    setPedidos(data || [])
    setLoading(false)
  }

  async function atualizarStatus(pedidoId, novoStatus) {
    setAtualizando(true)
    const { error } = await supabase.from('pedidos').update({ status: novoStatus }).eq('id', pedidoId)
    if (error) {
      toast.error('Erro ao atualizar status')
    } else {
      toast.success('Status atualizado!')
      buscarPedidos()
    }
    setAtualizando(false)
  }

  const pedidosFiltrados = filtroStatus === 'todos'
    ? pedidos
    : pedidos.filter(p => p.status === filtroStatus)

  const contadores = Object.keys(STATUS).reduce((acc, s) => {
    acc[s] = pedidos.filter(p => p.status === s).length
    return acc
  }, {})

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {pedidoSelecionado && (
        <ModalPedido
          pedido={pedidoSelecionado}
          onFechar={() => setPedidoSelecionado(null)}
          onAtualizarStatus={atualizarStatus}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#2C2C2A', margin: 0 }}>Pedidos</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: '4px 0 0' }}>{pedidos.length} pedidos no total</p>
        </div>
        <button
          onClick={buscarPedidos}
          disabled={atualizando}
          style={{ background: '#FBEAF0', color: '#D4537E', padding: '10px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, fontSize: 14 }}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { key: 'novo', label: 'Novos', cor: '#3b82f6' },
          { key: 'producao', label: 'Produzindo', cor: '#f59e0b' },
          { key: 'pronto', label: 'Prontos', cor: '#10b981' },
        ].map(item => (
          <div
            key={item.key}
            onClick={() => setFiltroStatus(item.key)}
            style={{ background: '#fff', border: filtroStatus === item.key ? '2px solid ' + item.cor : '1px solid #f3f4f6', borderRadius: 16, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <p style={{ fontSize: 28, fontWeight: 800, color: item.cor, margin: '0 0 4px' }}>{contadores[item.key] || 0}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{item.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFiltroStatus('todos')}
          style={{ padding: '8px 16px', borderRadius: 20, border: '1.5px solid', borderColor: filtroStatus === 'todos' ? '#D4537E' : '#e5e7eb', background: filtroStatus === 'todos' ? '#D4537E' : '#fff', color: filtroStatus === 'todos' ? '#fff' : '#6b7280', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          Todos ({pedidos.length})
        </button>
        {Object.entries(STATUS).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setFiltroStatus(key)}
            style={{ padding: '8px 16px', borderRadius: 20, border: '1.5px solid', borderColor: filtroStatus === key ? val.cor : '#e5e7eb', background: filtroStatus === key ? val.bg : '#fff', color: filtroStatus === key ? val.cor : '#6b7280', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            {val.label} {contadores[key] > 0 ? '(' + contadores[key] + ')' : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 20, height: 72, border: '1px solid #f3f4f6' }} />
          ))}
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ fontSize: 16 }}>Nenhum pedido {filtroStatus !== 'todos' ? STATUS[filtroStatus]?.label?.toLowerCase() : ''}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pedidosFiltrados.map(pedido => {
            const proximo = PROXIMOS_STATUS[pedido.status]
            const dataRetirada = new Date(pedido.data_retirada + 'T12:00:00').toLocaleDateString('pt-BR')
            return (
              <div
                key={pedido.id}
                style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 16, transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#2C2C2A', fontSize: 15 }}>{pedido.clientes?.nome || 'Cliente'}</span>
                    <StatusBadge status={pedido.status} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} />
                      {dataRetirada} às {pedido.hora_retirada}
                    </span>
                    <span style={{ fontSize: 13, color: '#D4537E', fontWeight: 600 }}>
                      R$ {pedido.total?.toFixed(2).replace('.', ',')}
                    </span>
                    <span style={{ fontSize: 12, color: '#d1d5db' }}>#{pedido.id.slice(0,8).toUpperCase()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {proximo && (
                    <button
                      onClick={() => atualizarStatus(pedido.id, proximo)}
                      style={{ background: '#FBEAF0', color: '#D4537E', padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                    >
                      → {STATUS[proximo]?.label}
                    </button>
                  )}
                  <button
                    onClick={() => setPedidoSelecionado(pedido)}
                    style={{ background: '#f9fafb', color: '#6b7280', padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Eye size={14} />
                    Ver
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
