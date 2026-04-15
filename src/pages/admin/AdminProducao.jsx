import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ChevronLeft, ChevronRight, Package, Clock, User, RefreshCw, X, TrendingUp, ShoppingBag } from 'lucide-react'

const STATUS = {
  novo:       { label: 'Novo',       cor: '#3b82f6', bg: '#eff6ff' },
  confirmado: { label: 'Confirmado', cor: '#8b5cf6', bg: '#f5f3ff' },
  producao:   { label: 'Produzindo', cor: '#f59e0b', bg: '#fffbeb' },
  pronto:     { label: 'Pronto',     cor: '#10b981', bg: '#ecfdf5' },
  entregue:   { label: 'Entregue',   cor: '#6b7280', bg: '#f9fafb' },
  cancelado:  { label: 'Cancelado',  cor: '#ef4444', bg: '#fef2f2' },
}

const STATUS_ATIVOS = ['novo', 'confirmado', 'producao', 'pronto']
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function formatarData(date) {
  return date.toISOString().split('T')[0]
}

function inicioDoMes(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function fimDoMes(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function celulasDoMes(date) {
  const inicio = inicioDoMes(date)
  const fim = fimDoMes(date)
  const celulas = []
  for (let i = 0; i < inicio.getDay(); i++) celulas.push(null)
  for (let d = 1; d <= fim.getDate(); d++) {
    celulas.push(new Date(date.getFullYear(), date.getMonth(), d))
  }
  while (celulas.length % 7 !== 0) celulas.push(null)
  return celulas
}

function nomeMes(date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default function AdminProducao() {
  const [mesBase, setMesBase] = useState(new Date())
  const [pedidos, setPedidos] = useState([])
  const [custosProdutos, setCustosProdutos] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [diaSelecionado, setDiaSelecionado] = useState(null)

  const dataInicio = formatarData(inicioDoMes(mesBase))
  const dataFim = formatarData(fimDoMes(mesBase))
  const celulas = celulasDoMes(mesBase)
  const hoje = formatarData(new Date())

  useEffect(() => {
    carregarDados()
  }, [dataInicio, dataFim])

  async function carregarDados() {
    setCarregando(true)
    const [{ data: pedidosData }, { data: produtosData }] = await Promise.all([
      supabase
        .from('pedidos')
        .select('id, status, data_retirada, hora_retirada, tipo_entrega, subtotal, total, observacoes, clientes ( nome, telefone ), pedido_itens ( quantidade, nome_produto, preco_unitario, subtotal, observacao )')
        .in('status', STATUS_ATIVOS)
        .gte('data_retirada', dataInicio)
        .lte('data_retirada', dataFim)
        .order('hora_retirada'),
      supabase.from('produtos').select('nome, preco_custo').not('preco_custo', 'is', null)
    ])
    setPedidos(pedidosData || [])
    const mapa = {}
    ;(produtosData || []).forEach(p => { mapa[p.nome] = p.preco_custo })
    setCustosProdutos(mapa)
    setCarregando(false)
  }

  function pedidosDoDia(data) {
    return pedidos.filter(p => p.data_retirada === data)
  }

  function resumoDia(data) {
    const itens = pedidosDoDia(data).flatMap(p => p.pedido_itens || [])
    const mapa = {}
    itens.forEach(item => {
      if (!mapa[item.nome_produto]) mapa[item.nome_produto] = { qtd: 0, custo: 0 }
      mapa[item.nome_produto].qtd += item.quantidade
      mapa[item.nome_produto].custo += (custosProdutos[item.nome_produto] || 0) * item.quantidade
    })
    return Object.entries(mapa).sort((a, b) => b[1].qtd - a[1].qtd)
  }

  function totalVendasDia(data) {
    return pedidosDoDia(data).reduce((acc, p) => acc + (p.total || 0), 0)
  }

  function totalCustoDia(data) {
    return resumoDia(data).reduce((acc, [, v]) => acc + v.custo, 0)
  }

  const pedidosDiaSel = diaSelecionado ? pedidosDoDia(diaSelecionado) : []
  const resumoDiaSel = diaSelecionado ? resumoDia(diaSelecionado) : []
  const totalVendasSel = diaSelecionado ? totalVendasDia(diaSelecionado) : 0
  const totalCustoSel = diaSelecionado ? totalCustoDia(diaSelecionado) : 0
  const lucroBrutoSel = totalVendasSel - totalCustoSel

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#2C2C2A' }}>Calendário de Produção</h1>
          <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 14 }}>Clique em um dia para ver os detalhes</p>
        </div>
        <button onClick={carregarDados} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FBEAF0', color: '#D4537E', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Calendário */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <button onClick={() => { const d = new Date(mesBase); d.setMonth(d.getMonth() - 1); setMesBase(d); setDiaSelecionado(null) }}
            style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6b7280' }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontWeight: 700, color: '#2C2C2A', fontSize: 16, textTransform: 'capitalize' }}>{nomeMes(mesBase)}</span>
          <button onClick={() => { const d = new Date(mesBase); d.setMonth(d.getMonth() + 1); setMesBase(d); setDiaSelecionado(null) }}
            style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6b7280' }}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
          {DIAS_SEMANA.map(d => (
            <div key={d} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: 0.5 }}>{d}</div>
          ))}
        </div>

        {carregando ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>Carregando...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {celulas.map((dia, i) => {
              if (!dia) return <div key={i} style={{ minHeight: 90, background: '#fafafa', borderRight: (i+1)%7!==0 ? '1px solid #f3f4f6':'none', borderBottom: '1px solid #f3f4f6' }} />
              const dataStr = formatarData(dia)
              const qPedidos = pedidosDoDia(dataStr).length
              const isHoje = dataStr === hoje
              const isSel = dataStr === diaSelecionado
              const vendas = totalVendasDia(dataStr)
              const custo = totalCustoDia(dataStr)
              return (
                <button key={i} onClick={() => setDiaSelecionado(isSel ? null : dataStr)} style={{
                  minHeight: 90, padding: '8px 10px', border: 'none',
                  borderRight: (i+1)%7!==0 ? '1px solid #f3f4f6':'none',
                  borderBottom: '1px solid #f3f4f6',
                  background: isSel ? '#FBEAF0' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4,
                  outline: isSel ? '2px solid #D4537E' : 'none', outlineOffset: -2,
                }}>
                  <span style={{ width:26, height:26, borderRadius:'50%', background: isHoje ? '#D4537E':'transparent', color: isHoje ? '#fff': isSel ? '#D4537E':'#2C2C2A', fontWeight: isHoje||isSel?700:500, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {dia.getDate()}
                  </span>
                  {qPedidos > 0 && <>
                    <span style={{ background:'#D4537E', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:20, alignSelf:'flex-start' }}>
                      {qPedidos} {qPedidos===1?'pedido':'pedidos'}
                    </span>
                    <span style={{ fontSize:11, color:'#10b981', fontWeight:600 }}>R$ {vendas.toFixed(2).replace('.',',')}</span>
                    {custo > 0 && <span style={{ fontSize:10, color:'#f59e0b', fontWeight:500 }}>custo ~R$ {custo.toFixed(2).replace('.',',')}</span>}
                  </>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Legenda */}
      <div style={{ display:'flex', gap:20, marginBottom:24, flexWrap:'wrap' }}>
        {[['#10b981','Verde = vendas do dia'],['#f59e0b','Amarelo = custo estimado'],['#D4537E','Rosa = pedidos']].map(([cor,label])=>(
          <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:cor }} />
            <span style={{ fontSize:12, color:'#6b7280' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Painel detalhe */}
      {diaSelecionado && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20 }}>

          {/* Pedidos do dia */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#2C2C2A', margin:0 }}>
                {new Date(diaSelecionado+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}
                <span style={{ background:'#FBEAF0', color:'#D4537E', fontSize:12, fontWeight:700, padding:'2px 10px', borderRadius:20, marginLeft:10 }}>
                  {pedidosDiaSel.length} {pedidosDiaSel.length===1?'pedido':'pedidos'}
                </span>
              </h2>
              <button onClick={()=>setDiaSelecionado(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af' }}><X size={18}/></button>
            </div>

            {pedidosDiaSel.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f3f4f6', padding:48, textAlign:'center', color:'#9ca3af' }}>
                <ShoppingBag size={36} style={{ margin:'0 auto 12px', display:'block', opacity:0.3 }}/>
                <p style={{ margin:0 }}>Nenhum pedido ativo neste dia</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {pedidosDiaSel.map(pedido => {
                  const s = STATUS[pedido.status] || STATUS.novo
                  const custoPedido = (pedido.pedido_itens||[]).reduce((acc,item)=>acc+(custosProdutos[item.nome_produto]||0)*item.quantidade,0)
                  return (
                    <div key={pedido.id} style={{ background:'#fff', borderRadius:16, border:'1px solid #f3f4f6', padding:20 }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:38, height:38, borderRadius:'50%', background:'#FBEAF0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <User size={18} color="#D4537E"/>
                          </div>
                          <div>
                            <p style={{ margin:0, fontWeight:700, color:'#2C2C2A', fontSize:15 }}>{pedido.clientes?.nome||'Cliente'}</p>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                              <Clock size={12} color="#9ca3af"/>
                              <span style={{ fontSize:12, color:'#6b7280' }}>{pedido.hora_retirada?.slice(0,5)} · {pedido.tipo_entrega==='entrega'?'🚗 Entrega':'🏠 Retirada'}</span>
                            </div>
                          </div>
                        </div>
                        <span style={{ background:s.bg, color:s.cor, fontSize:12, fontWeight:600, padding:'4px 12px', borderRadius:20, whiteSpace:'nowrap' }}>{s.label}</span>
                      </div>

                      <div style={{ background:'#f9fafb', borderRadius:10, padding:12, marginBottom:12 }}>
                        {(pedido.pedido_itens||[]).map((item,idx)=>{
                          const custoItem=(custosProdutos[item.nome_produto]||0)*item.quantidade
                          return (
                            <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:idx<pedido.pedido_itens.length-1?'1px solid #f3f4f6':'none' }}>
                              <div>
                                <span style={{ fontSize:14, color:'#2C2C2A', fontWeight:500 }}>{item.quantidade}× {item.nome_produto}</span>
                                {item.observacao && <p style={{ margin:'2px 0 0', fontSize:12, color:'#9ca3af' }}>obs: {item.observacao}</p>}
                                {custoItem>0 && <p style={{ margin:'2px 0 0', fontSize:11, color:'#f59e0b', fontWeight:500 }}>custo: R$ {custoItem.toFixed(2).replace('.',',')}</p>}
                              </div>
                              <span style={{ fontSize:13, color:'#6b7280', fontWeight:600 }}>R$ {item.subtotal.toFixed(2).replace('.',',')}</span>
                            </div>
                          )
                        })}
                      </div>

                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:12 }}>
                        {pedido.observacoes ? <span style={{ fontSize:12, color:'#9ca3af', fontStyle:'italic', flex:1 }}>"{pedido.observacoes}"</span> : <span/>}
                        <div style={{ textAlign:'right' }}>
                          <p style={{ margin:0, fontWeight:700, color:'#D4537E', fontSize:15 }}>R$ {pedido.total.toFixed(2).replace('.',',')}</p>
                          {custoPedido>0 && <p style={{ margin:'2px 0 0', fontSize:12, color:'#f59e0b' }}>custo ~R$ {custoPedido.toFixed(2).replace('.',',')}</p>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Painel direito */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Financeiro */}
            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f3f4f6', overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', gap:8 }}>
                <TrendingUp size={16} color="#D4537E"/>
                <span style={{ fontWeight:700, color:'#2C2C2A', fontSize:14 }}>Resumo financeiro</span>
              </div>
              <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:14, color:'#6b7280' }}>Total em vendas</span>
                  <span style={{ fontWeight:700, color:'#10b981', fontSize:15 }}>R$ {totalVendasSel.toFixed(2).replace('.',',')}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:14, color:'#6b7280' }}>Custo de produção</span>
                  <span style={{ fontWeight:700, color:'#f59e0b', fontSize:15 }}>{totalCustoSel>0?`R$ ${totalCustoSel.toFixed(2).replace('.',',')}` : '—'}</span>
                </div>
                <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:12, display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:14, fontWeight:700, color:'#2C2C2A' }}>Lucro bruto</span>
                  <span style={{ fontWeight:800, color:lucroBrutoSel>=0?'#10b981':'#ef4444', fontSize:16 }}>
                    {totalCustoSel>0?`R$ ${lucroBrutoSel.toFixed(2).replace('.',',')}` : '—'}
                  </span>
                </div>
                {totalCustoSel>0 && totalVendasSel>0 && (
                  <div style={{ background:'#f9fafb', borderRadius:10, padding:'10px 14px', textAlign:'center' }}>
                    <p style={{ margin:0, fontSize:12, color:'#6b7280' }}>Margem bruta</p>
                    <p style={{ margin:'4px 0 0', fontSize:20, fontWeight:800, color:'#D4537E' }}>
                      {((lucroBrutoSel/totalVendasSel)*100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* O que produzir */}
            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f3f4f6', overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', gap:8 }}>
                <Package size={16} color="#D4537E"/>
                <span style={{ fontWeight:700, color:'#2C2C2A', fontSize:14 }}>O que produzir</span>
              </div>
              {resumoDiaSel.length===0 ? (
                <div style={{ padding:24, textAlign:'center', color:'#d1d5db' }}>
                  <Package size={28} style={{ margin:'0 auto 8px', display:'block' }}/>
                  <p style={{ margin:0, fontSize:13 }}>Nenhum item</p>
                </div>
              ) : resumoDiaSel.map(([produto,{qtd,custo}],idx)=>(
                <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px', borderBottom:idx<resumoDiaSel.length-1?'1px solid #f9fafb':'none', background:idx%2===0?'#fff':'#fafafa' }}>
                  <div>
                    <p style={{ margin:0, fontSize:14, fontWeight:600, color:'#2C2C2A' }}>{produto}</p>
                    {custo>0 && <p style={{ margin:'2px 0 0', fontSize:11, color:'#f59e0b' }}>custo R$ {custo.toFixed(2).replace('.',',')}</p>}
                  </div>
                  <span style={{ background:'#FBEAF0', color:'#D4537E', fontSize:14, fontWeight:700, padding:'4px 14px', borderRadius:20 }}>{qtd}×</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
