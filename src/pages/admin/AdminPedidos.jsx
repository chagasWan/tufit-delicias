import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ShoppingBag, Clock, CheckCircle, Package, Truck, XCircle, Eye, MessageCircle, RefreshCw, Calendar, Plus, Trash2, Search } from 'lucide-react'
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
          <p style={{ color: '#6b7280', fontSize: 14, margin: '2px 0' }}>
            {pedido.tipo_entrega === 'entrega' ? '🚗 Entrega' : '🏠 Retirada no local'}
          </p>

          {pedido.tipo_entrega === 'entrega' && pedido.endereco_entrega && (
            <p style={{ color: '#6b7280', fontSize: 14, margin: '2px 0' }}>📍 {pedido.endereco_entrega}</p>
          )}
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
          {pedido.taxa_entrega > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280', fontSize: 14 }}>Frete</span>
              <span style={{ color: '#6b7280', fontWeight: 600, fontSize: 14 }}>R$ {pedido.taxa_entrega?.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          {pedido.desconto > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#10b981', fontSize: 14 }}>Desconto</span>
              <span style={{ color: '#10b981', fontWeight: 600, fontSize: 14 }}>- R$ {pedido.desconto?.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0' }}>
            <span style={{ fontWeight: 700, color: '#2C2C2A' }}>Total</span>
            <span style={{ fontWeight: 800, color: '#D4537E', fontSize: 18 }}>R$ {pedido.total?.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {pedido.status === 'entregue' && pedido.clientes?.telefone && (
            <button
              onClick={() => {
                const link = window.location.origin + '/avaliacao/' + pedido.id
                const msg = encodeURIComponent(
                  'Olá ' + (pedido.clientes.nome || '') + '! 🍰\n\n' +
                  'Seu pedido da *Tufit Delícias* foi entregue! Esperamos que tenha amado. 💕\n\n' +
                  'Avalie seu pedido aqui:\n' + link
                )
                window.open('https://wa.me/55' + pedido.clientes.telefone + '?text=' + msg, '_blank')
              }}
              style={{ width: '100%', background: '#f0fdf4', color: '#15803d', padding: '10px 16px', borderRadius: 24, border: '1.5px solid #bbf7d0', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              ⭐ Enviar link de avaliação
            </button>
          )}
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


function ModalNovoPedido({ onFechar, onSalvar }) {
  const [etapa, setEtapa] = useState(1) // 1: cliente, 2: itens, 3: data/hora
  const [buscaCliente, setBuscaCliente] = useState('')
  const [clienteEncontrado, setClienteEncontrado] = useState(null)
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '' })
  const [modoNovoCliente, setModoNovoCliente] = useState(false)
  const [produtos, setProdutos] = useState([])
  const [itensPedido, setItensPedido] = useState([])
  const [dataRetirada, setDataRetirada] = useState('')
  const [horaRetirada, setHoraRetirada] = useState('')
  const [tipoEntrega, setTipoEntrega] = useState('retirada')
  const [enderecoEntrega, setEnderecoEntrega] = useState('')
  const [taxaEntrega, setTaxaEntrega] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [status, setStatus] = useState('confirmado')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    supabase.from('produtos').select('id, nome, preco').eq('ativo', true).order('nome').then(({ data }) => {
      setProdutos(data || [])
    })
  }, [])

  async function buscarCliente() {
    if (!buscaCliente.trim()) return
    const tel = buscaCliente.replace(/\D/g, '')
    const { data } = await supabase.from('clientes').select('*')
      .or(`nome.ilike.%${buscaCliente}%,telefone.ilike.%${tel}%`)
      .limit(1).single()
    if (data) { setClienteEncontrado(data); setModoNovoCliente(false) }
    else { toast.error('Cliente não encontrado. Cadastre um novo.'); setModoNovoCliente(true) }
  }

  function adicionarItem(produto) {
    setItensPedido(prev => {
      const existe = prev.find(i => i.produto_id === produto.id)
      if (existe) return prev.map(i => i.produto_id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i)
      return [...prev, { produto_id: produto.id, nome_produto: produto.nome, preco_unitario: produto.preco, quantidade: 1, observacao: '' }]
    })
  }

  function removerItem(produtoId) {
    setItensPedido(prev => prev.filter(i => i.produto_id !== produtoId))
  }

  function alterarQtd(produtoId, delta) {
    setItensPedido(prev => prev.map(i => {
      if (i.produto_id !== produtoId) return i
      const novaQtd = i.quantidade + delta
      return novaQtd <= 0 ? null : { ...i, quantidade: novaQtd }
    }).filter(Boolean))
  }

  const subtotal = itensPedido.reduce((acc, i) => acc + i.preco_unitario * i.quantidade, 0)
  const taxa = parseFloat(taxaEntrega) || 0
  const total = subtotal + taxa

  async function salvar() {
    if (!dataRetirada) return toast.error('Escolha a data')
    if (!horaRetirada) return toast.error('Escolha o horário')
    if (itensPedido.length === 0) return toast.error('Adicione pelo menos um item')
    const clienteNome = clienteEncontrado?.nome || novoCliente.nome
    const clienteTel = clienteEncontrado?.telefone || novoCliente.telefone.replace(/\D/g, '')
    if (!clienteNome.trim()) return toast.error('Informe o nome do cliente')

    setSalvando(true)
    try {
      // Criar ou usar cliente
      let clienteId = clienteEncontrado?.id
      if (!clienteId) {
        const { data: c, error: ec } = await supabase.from('clientes')
          .insert({ nome: clienteNome.trim(), telefone: clienteTel }).select().single()
        if (ec) throw ec
        clienteId = c.id
      }

      // Criar pedido
      const { data: pedido, error: ep } = await supabase.from('pedidos').insert({
        cliente_id: clienteId,
        data_retirada: dataRetirada,
        hora_retirada: horaRetirada,
        tipo_entrega: tipoEntrega,
        endereco_entrega: tipoEntrega === 'entrega' ? enderecoEntrega : null,
        taxa_entrega: taxa,
        subtotal,
        total,
        observacoes: observacoes.trim() || null,
        status,
        forma_pagamento: 'pix',
      }).select().single()
      if (ep) throw ep

      // Criar itens
      await supabase.from('pedido_itens').insert(
        itensPedido.map(i => ({
          pedido_id: pedido.id,
          produto_id: i.produto_id,
          nome_produto: i.nome_produto,
          preco_unitario: i.preco_unitario,
          quantidade: i.quantidade,
          subtotal: i.preco_unitario * i.quantidade,
          observacao: i.observacao || null,
        }))
      )

      toast.success('Pedido lançado com sucesso!')
      onSalvar()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar pedido')
    }
    setSalvando(false)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }
  const labelStyle = { fontSize: 13, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 5 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onFechar} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 20, maxWidth: 580, width: '100%', maxHeight: '92vh', overflowY: 'auto', fontFamily: 'Inter, sans-serif', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#2C2C2A' }}>Lançar pedido manual</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,2,3].map(e => (
              <div key={e} style={{ width: 28, height: 28, borderRadius: '50%', background: etapa >= e ? '#D4537E' : '#f3f4f6', color: etapa >= e ? '#fff' : '#9ca3af', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{e}</div>
            ))}
          </div>
        </div>

        <div style={{ padding: 28 }}>

          {/* Etapa 1: Cliente */}
          {etapa === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#2C2C2A' }}>1. Identificar o cliente</p>

              {!clienteEncontrado && !modoNovoCliente && (
                <div>
                  <label style={labelStyle}>Buscar por nome ou telefone</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input style={{ ...inputStyle, flex: 1 }} value={buscaCliente}
                      onChange={e => setBuscaCliente(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && buscarCliente()}
                      placeholder="Nome ou (62) 99999-9999" />
                    <button onClick={buscarCliente} style={{ background: '#D4537E', color: '#fff', border: 'none', borderRadius: 10, padding: '0 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      <Search size={14} /> Buscar
                    </button>
                  </div>
                  <button onClick={() => setModoNovoCliente(true)} style={{ marginTop: 10, background: 'none', border: 'none', color: '#D4537E', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    + Cadastrar novo cliente
                  </button>
                </div>
              )}

              {clienteEncontrado && (
                <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 14, border: '1.5px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: '#15803d' }}>✓ {clienteEncontrado.nome}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{clienteEncontrado.telefone}</p>
                  </div>
                  <button onClick={() => { setClienteEncontrado(null); setBuscaCliente('') }} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 18 }}>✕</button>
                </div>
              )}

              {modoNovoCliente && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Nome do cliente *</label>
                    <input style={inputStyle} value={novoCliente.nome} onChange={e => setNovoCliente(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
                  </div>
                  <div>
                    <label style={labelStyle}>Telefone / WhatsApp</label>
                    <input style={inputStyle} value={novoCliente.telefone} onChange={e => setNovoCliente(f => ({ ...f, telefone: e.target.value }))} placeholder="(62) 99999-9999" />
                  </div>
                  <button onClick={() => { setModoNovoCliente(false); setBuscaCliente('') }} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 13, textAlign: 'left' }}>
                    ← Buscar cliente existente
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={onFechar} style={{ flex: 1, background: 'transparent', color: '#6b7280', padding: '12px', borderRadius: 24, border: '1.5px solid #e5e7eb', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
                <button onClick={() => setEtapa(2)}
                  disabled={!clienteEncontrado && !novoCliente.nome.trim()}
                  style={{ flex: 2, background: (!clienteEncontrado && !novoCliente.nome.trim()) ? '#f9a8d4' : '#D4537E', color: '#fff', padding: '12px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {/* Etapa 2: Produtos */}
          {etapa === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#2C2C2A' }}>2. Adicionar produtos</p>

              {/* Lista de produtos */}
              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, border: '1px solid #f3f4f6', borderRadius: 12, padding: 10 }}>
                {produtos.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: itensPedido.find(i => i.produto_id === p.id) ? '#FBEAF0' : '#f9fafb' }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2A' }}>{p.nome}</span>
                      <span style={{ fontSize: 13, color: '#D4537E', marginLeft: 8, fontWeight: 600 }}>R$ {p.preco?.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button onClick={() => adicionarItem(p)} style={{ background: '#D4537E', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      + Add
                    </button>
                  </div>
                ))}
              </div>

              {/* Itens selecionados */}
              {itensPedido.length > 0 && (
                <div style={{ background: '#f9fafb', borderRadius: 12, padding: 12 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Itens do pedido:</p>
                  {itensPedido.map(item => (
                    <div key={item.produto_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 14, color: '#2C2C2A', flex: 1 }}>{item.nome_produto}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => alterarQtd(item.produto_id, -1)} style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#6b7280' }}>−</button>
                        <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantidade}</span>
                        <button onClick={() => alterarQtd(item.produto_id, 1)} style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#6b7280' }}>+</button>
                        <span style={{ fontSize: 13, color: '#D4537E', fontWeight: 600, minWidth: 60, textAlign: 'right' }}>R$ {(item.preco_unitario * item.quantidade).toFixed(2).replace('.', ',')}</span>
                        <button onClick={() => removerItem(item.produto_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, fontWeight: 700, color: '#2C2C2A' }}>
                    <span>Subtotal</span>
                    <span style={{ color: '#D4537E' }}>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEtapa(1)} style={{ flex: 1, background: 'transparent', color: '#6b7280', padding: '12px', borderRadius: 24, border: '1.5px solid #e5e7eb', cursor: 'pointer', fontWeight: 500 }}>← Voltar</button>
                <button onClick={() => setEtapa(3)} disabled={itensPedido.length === 0}
                  style={{ flex: 2, background: itensPedido.length === 0 ? '#f9a8d4' : '#D4537E', color: '#fff', padding: '12px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {/* Etapa 3: Data, hora e detalhes */}
          {etapa === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#2C2C2A' }}>3. Data, horário e detalhes</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Data *</label>
                  <input style={inputStyle} type="date" value={dataRetirada} onChange={e => setDataRetirada(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Horário *</label>
                  <input style={inputStyle} type="time" value={horaRetirada} onChange={e => setHoraRetirada(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Tipo de entrega</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{v:'retirada',l:'🏠 Retirada no local'},{v:'entrega',l:'🚗 Entrega em casa'}].map(op => (
                    <button key={op.v} onClick={() => setTipoEntrega(op.v)}
                      style={{ flex: 1, padding: '10px', borderRadius: 10, border: tipoEntrega === op.v ? '2px solid #D4537E' : '1.5px solid #e5e7eb', background: tipoEntrega === op.v ? '#FBEAF0' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: tipoEntrega === op.v ? 700 : 400, color: tipoEntrega === op.v ? '#D4537E' : '#6b7280' }}>
                      {op.l}
                    </button>
                  ))}
                </div>
              </div>

              {tipoEntrega === 'entrega' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Endereço de entrega</label>
                    <input style={inputStyle} value={enderecoEntrega} onChange={e => setEnderecoEntrega(e.target.value)} placeholder="Rua, número, bairro" />
                  </div>
                  <div>
                    <label style={labelStyle}>Taxa de entrega (R$)</label>
                    <input style={inputStyle} type="number" step="0.01" value={taxaEntrega} onChange={e => setTaxaEntrega(e.target.value)} placeholder="0,00" />
                  </div>
                </div>
              )}

              <div>
                <label style={labelStyle}>Status inicial</label>
                <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="novo">Novo</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="producao">Em produção</option>
                  <option value="pronto">Pronto</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Observações</label>
                <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Pedido especial, personalização..." />
              </div>

              {/* Resumo final */}
              <div style={{ background: '#FBEAF0', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Subtotal</span>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {taxa > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Frete</span>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>R$ {taxa.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f9a8d4', paddingTop: 8, marginTop: 4 }}>
                  <span style={{ fontWeight: 700, color: '#D4537E' }}>Total</span>
                  <span style={{ fontWeight: 800, color: '#D4537E', fontSize: 18 }}>R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEtapa(2)} style={{ flex: 1, background: 'transparent', color: '#6b7280', padding: '12px', borderRadius: 24, border: '1.5px solid #e5e7eb', cursor: 'pointer', fontWeight: 500 }}>← Voltar</button>
                <button onClick={salvar} disabled={salvando}
                  style={{ flex: 2, background: salvando ? '#f9a8d4' : '#D4537E', color: '#fff', padding: '12px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  {salvando ? 'Salvando...' : '✓ Lançar pedido'}
                </button>
              </div>
            </div>
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
  const [modalNovoPedido, setModalNovoPedido] = useState(false)

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

      // Quando marcar como entregue, oferecer envio do link de avaliação
      if (novoStatus === 'entregue') {
        const pedido = pedidos.find(p => p.id === pedidoId)
        if (pedido?.clientes?.telefone) {
          const link = window.location.origin + '/avaliacao/' + pedidoId
          const msg = encodeURIComponent(
            'Olá ' + (pedido.clientes.nome || '') + '! 🍰\n\n' +
            'Seu pedido da *Tufit Delícias* foi entregue! Esperamos que tenha amado tudo. 💕\n\n' +
            'Conta pra gente o que achou? Sua avaliação é muito importante para nós:\n' +
            link
          )
          setTimeout(() => {
            if (confirm('Deseja enviar o link de avaliação para o cliente via WhatsApp?')) {
              window.open('https://wa.me/55' + pedido.clientes.telefone + '?text=' + msg, '_blank')
            }
          }, 500)
        }
      }
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
      {modalNovoPedido && <ModalNovoPedido onFechar={() => setModalNovoPedido(false)} onSalvar={() => { setModalNovoPedido(false); buscarPedidos() }} />}
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
          onClick={() => setModalNovoPedido(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#D4537E', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          <Plus size={16} /> Lançar pedido
        </button>
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
