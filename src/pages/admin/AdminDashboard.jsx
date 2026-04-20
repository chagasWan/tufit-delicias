import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ShoppingBag, DollarSign, Users, TrendingUp, Package, AlertTriangle, ChevronRight, Calendar } from 'lucide-react'
import { Tooltip } from '../../components/Tooltip'

function MetricCard({ label, valor, sub, cor, icon: Icon, onClick, dica }) {
  return (
    <div
      onClick={onClick}
      style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #f3f4f6', cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{label}</p>
            {dica && <Tooltip texto={dica} />}
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: cor || '#2C2C2A', margin: '0 0 4px' }}>{valor}</p>
          {sub && <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{sub}</p>}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: cor ? cor + '18' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={cor || '#6b7280'} />
        </div>
      </div>
    </div>
  )
}

function BarChart({ dados, label, corBarra }) {
  if (!dados || dados.length === 0) return null
  const max = Math.max(...dados.map(d => d.valor), 1)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
        {dados.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>
              {d.valor > 0 ? (label === 'R$' ? 'R$' + d.valor.toFixed(0) : d.valor) : ''}
            </span>
            <div style={{ width: '100%', background: corBarra || '#D4537E', borderRadius: '4px 4px 0 0', height: Math.max((d.valor / max) * 90, d.valor > 0 ? 4 : 0), opacity: 0.85, transition: 'height 0.5s' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {dados.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d.rotulo}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')
  const [metricas, setMetricas] = useState({
    faturamento: 0, pedidos: 0, ticketMedio: 0, clientes: 0,
    pedidosNovos: 0, pedidosProduzindo: 0, pedidosProntos: 0,
  })
  const [graficoVendas, setGraficoVendas] = useState([])
  const [topProdutos, setTopProdutos] = useState([])
  const [pedidosRecentes, setPedidosRecentes] = useState([])
  const [alertasEstoque, setAlertasEstoque] = useState([])
  const [custoPeriodo, setCustoPeriodo] = useState(0)
  const [comparativoMes, setComparativoMes] = useState(null)

  useEffect(() => { buscarDados() }, [periodo])

  async function buscarDados() {
    setLoading(true)
    const hoje = new Date()
    let dataInicio

    if (periodo === 'semana') {
      dataInicio = new Date(hoje)
      dataInicio.setDate(hoje.getDate() - 7)
    } else if (periodo === 'mes') {
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    } else {
      dataInicio = new Date(hoje.getFullYear(), 0, 1)
    }

    const dataInicioStr = dataInicio.toISOString().split('T')[0]

    const [
      { data: pedidos },
      { data: clientes },
      { data: itensPedidos },
      { data: ingredientesEstoque },
      { data: pedidosRecentes },
    ] = await Promise.all([
      supabase.from('pedidos').select('id, total, status, created_at, data_retirada').gte('created_at', dataInicioStr).neq('status', 'cancelado'),
      supabase.from('clientes').select('id, created_at').gte('created_at', dataInicioStr),
      supabase.from('pedido_itens').select('nome_produto, quantidade, subtotal, pedido_id'),
      supabase.from('ingredientes').select('nome, estoque_atual, estoque_minimo').gt('estoque_minimo', 0),
      supabase.from('pedidos').select('id, total, status, created_at, clientes(nome)').order('created_at', { ascending: false }).limit(5),
    ])

    const pedidosAtivos = pedidos || []
    const faturamento = pedidosAtivos.reduce((acc, p) => acc + (p.total || 0), 0)
    const ticketMedio = pedidosAtivos.length > 0 ? faturamento / pedidosAtivos.length : 0

    const { count: totalClientes } = await supabase.from('clientes').select('id', { count: 'exact', head: true })
    const { count: pedidosNovos } = await supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('status', 'novo')
    const { count: pedidosProduzindo } = await supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('status', 'producao')
    const { count: pedidosProntos } = await supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('status', 'pronto')

    setMetricas({
      faturamento,
      pedidos: pedidosAtivos.length,
      ticketMedio,
      clientes: totalClientes || 0,
      pedidosNovos: pedidosNovos || 0,
      pedidosProduzindo: pedidosProduzindo || 0,
      pedidosProntos: pedidosProntos || 0,
    })

    const dias = periodo === 'semana' ? 7 : periodo === 'mes' ? 30 : 12
    const grafico = []

    if (periodo === 'ano') {
      for (let m = 0; m < 12; m++) {
        const mesInicio = new Date(hoje.getFullYear(), m, 1)
        const mesFim = new Date(hoje.getFullYear(), m + 1, 0)
        const pedidosMes = pedidosAtivos.filter(p => {
          const d = new Date(p.created_at)
          return d >= mesInicio && d <= mesFim
        })
        grafico.push({
          rotulo: mesInicio.toLocaleDateString('pt-BR', { month: 'short' }),
          valor: pedidosMes.reduce((acc, p) => acc + (p.total || 0), 0)
        })
      }
    } else {
      for (let i = dias - 1; i >= 0; i--) {
        const d = new Date(hoje)
        d.setDate(hoje.getDate() - i)
        const str = d.toISOString().split('T')[0]
        const pedidosDia = pedidosAtivos.filter(p => p.created_at?.startsWith(str))
        grafico.push({
          rotulo: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          valor: pedidosDia.reduce((acc, p) => acc + (p.total || 0), 0)
        })
      }
    }
    setGraficoVendas(grafico)

    const produtosMap = {}
    ;(itensPedidos || []).forEach(item => {
      if (!produtosMap[item.nome_produto]) {
        produtosMap[item.nome_produto] = { nome: item.nome_produto, quantidade: 0, faturamento: 0 }
      }
      produtosMap[item.nome_produto].quantidade += item.quantidade
      produtosMap[item.nome_produto].faturamento += item.subtotal || 0
    })
    const top = Object.values(produtosMap).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5)
    setTopProdutos(top)

    setPedidosRecentes(pedidosRecentes || [])
    setAlertasEstoque((ingredientesEstoque || []).filter(i => i.estoque_atual <= i.estoque_minimo))

    // Calcular custo de produção do período (soma dos preco_custo × quantidade)
    const pedidoIdsPeriodo = (pedidosAtivos || []).map(p => p.id)
    let custoProd = 0
    if (pedidoIdsPeriodo.length > 0) {
      const { data: itensComCusto } = await supabase
        .from('pedido_itens')
        .select('quantidade, produto_id, produtos(preco_custo)')
        .in('pedido_id', pedidoIdsPeriodo)
      ;(itensComCusto || []).forEach(item => {
        const custo = item.produtos?.preco_custo || 0
        custoProd += custo * item.quantidade
      })
    }
    setCustoPeriodo(custoProd)

    // Comparativo com mês anterior
    if (periodo === 'mes') {
      const mesAnteriorInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
      const mesAnteriorFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
      const { data: pedidosMesAnterior } = await supabase
        .from('pedidos')
        .select('total')
        .gte('created_at', mesAnteriorInicio.toISOString().split('T')[0])
        .lte('created_at', mesAnteriorFim.toISOString().split('T')[0])
        .neq('status', 'cancelado')
      const fatMesAnterior = (pedidosMesAnterior || []).reduce((acc, p) => acc + (p.total || 0), 0)
      setComparativoMes(fatMesAnterior)
    } else {
      setComparativoMes(null)
    }

    setLoading(false)
  }

  const lucroBruto = metricas.faturamento - custoPeriodo
  const margemBruta = metricas.faturamento > 0 ? (lucroBruto / metricas.faturamento * 100) : 0
  const variacaoMes = comparativoMes !== null && comparativoMes > 0
    ? ((metricas.faturamento - comparativoMes) / comparativoMes * 100)
    : null

  const STATUS_COR = { novo: '#3b82f6', confirmado: '#8b5cf6', producao: '#f59e0b', pronto: '#10b981', entregue: '#6b7280', cancelado: '#ef4444' }
  const STATUS_LABEL = { novo: 'Novo', confirmado: 'Confirmado', producao: 'Produzindo', pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado' }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#2C2C2A', margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: '4px 0 0' }}>Visão geral do negócio</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'semana', label: '7 dias' },
            { key: 'mes', label: 'Este mês' },
            { key: 'ano', label: 'Este ano' },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              style={{ padding: '8px 16px', borderRadius: 20, border: '1.5px solid', borderColor: periodo === p.key ? '#D4537E' : '#e5e7eb', background: periodo === p.key ? '#D4537E' : '#fff', color: periodo === p.key ? '#fff' : '#6b7280', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {alertasEstoque.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} color="#d97706" />
          <div>
            <p style={{ fontWeight: 600, color: '#92400e', fontSize: 14, margin: 0 }}>Estoque baixo: {alertasEstoque.map(i => i.nome).join(', ')}</p>
            <p style={{ color: '#78350f', fontSize: 12, margin: 0, cursor: 'pointer' }} onClick={() => navigate('/admin/receitas')}>Ver ingredientes →</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
        <MetricCard label="Faturamento" dica="Total recebido no período selecionado, excluindo pedidos cancelados. Quando no filtro Mês, mostra a variação em relação ao mês anterior." valor={'R$ ' + metricas.faturamento.toFixed(2).replace('.', ',')} sub={variacaoMes !== null ? (variacaoMes >= 0 ? '▲ ' : '▼ ') + Math.abs(variacaoMes).toFixed(1) + '% vs mês anterior' : 'Pedidos não cancelados'} cor="#D4537E" icon={DollarSign} />
        <MetricCard label="Pedidos" dica="Quantidade de pedidos não cancelados no período. Clique para ver a lista completa." valor={metricas.pedidos} sub="No período selecionado" cor="#8b5cf6" icon={ShoppingBag} onClick={() => navigate('/admin/pedidos')} />
        <MetricCard label="Ticket médio" dica="Valor médio de cada pedido no período. Quanto maior, melhor. Para aumentar, ofereça combos ou produtos complementares." valor={'R$ ' + metricas.ticketMedio.toFixed(2).replace('.', ',')} sub="Por pedido" cor="#10b981" icon={TrendingUp} />
        <MetricCard label="Total de clientes" dica="Total de clientes cadastrados no sistema, incluindo todos os períodos. Clique para ver a lista." valor={metricas.clientes} sub="Clientes cadastrados" cor="#3b82f6" icon={Users} onClick={() => navigate('/admin/clientes')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <MetricCard label="Custo de produção" dica="Soma do custo de cada produto vendido no período (ingredientes + embalagens + materiais). Só aparece quando os produtos têm custo cadastrado ou receita vinculada." valor={custoPeriodo > 0 ? 'R$ ' + custoPeriodo.toFixed(2).replace('.', ',') : '—'} sub="Baseado no custo dos produtos" cor="#f59e0b" icon={Package} />
        <MetricCard label="Lucro bruto" dica="Faturamento menos o custo de produção. Não inclui custos fixos como luz, gás, embalagens de transporte, etc. É o lucro antes de outros gastos." valor={custoPeriodo > 0 ? 'R$ ' + lucroBruto.toFixed(2).replace('.', ',') : '—'} sub="Faturamento - custo produção" cor={lucroBruto >= 0 ? '#10b981' : '#ef4444'} icon={TrendingUp} />
        <MetricCard label="Margem bruta" dica="Porcentagem do faturamento que sobra após pagar o custo de produção. Verde (≥40%) significa boa rentabilidade. Amarelo indica que os preços podem estar baixos em relação ao custo." valor={custoPeriodo > 0 ? margemBruta.toFixed(1) + '%' : '—'} sub={custoPeriodo > 0 ? (margemBruta >= 40 ? '✓ Boa margem' : '⚠ Margem baixa') : 'Cadastre custos nos produtos'} cor={margemBruta >= 40 ? '#10b981' : '#f59e0b'} icon={DollarSign} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Novos', valor: metricas.pedidosNovos, cor: '#3b82f6', bg: '#eff6ff' },
          { label: 'Produzindo', valor: metricas.pedidosProduzindo, cor: '#f59e0b', bg: '#fffbeb' },
          { label: 'Prontos para retirar', valor: metricas.pedidosProntos, cor: '#10b981', bg: '#ecfdf5' },
        ].map(item => (
          <div key={item.label} onClick={() => navigate('/admin/pedidos')} style={{ background: item.bg, borderRadius: 14, padding: '16px 20px', cursor: 'pointer', border: '1px solid ' + item.cor + '30' }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: item.cor, margin: '0 0 2px' }}>{item.valor}</p>
            <p style={{ fontSize: 13, color: item.cor, margin: 0, opacity: 0.8 }}>{item.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2C2C2A', margin: 0 }}>Vendas no período</h3>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>R$ por dia</span>
          </div>
          {loading ? (
            <div style={{ height: 140, background: '#f9fafb', borderRadius: 10 }} />
          ) : graficoVendas.every(d => d.valor === 0) ? (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
              Nenhuma venda no período
            </div>
          ) : (
            <BarChart dados={graficoVendas} label="R$" corBarra="#D4537E" />
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f3f4f6' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2C2C2A', margin: '0 0 16px' }}>Mais vendidos</h3>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} style={{ height: 36, background: '#f9fafb', borderRadius: 8 }} />)}
            </div>
          ) : topProdutos.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Nenhum produto vendido ainda</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topProdutos.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#D4537E', flexShrink: 0 }}>{i+1}</span>
                    <span style={{ fontSize: 13, color: '#2C2C2A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</span>
                  </div>
                  <span style={{ fontSize: 13, color: '#D4537E', fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{p.quantidade}x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2C2C2A', margin: 0 }}>Pedidos recentes</h3>
          <button onClick={() => navigate('/admin/pedidos')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D4537E', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            Ver todos <ChevronRight size={16} />
          </button>
        </div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 48, background: '#f9fafb', borderRadius: 10 }} />)}
          </div>
        ) : pedidosRecentes.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Nenhum pedido ainda</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pedidosRecentes.map(p => (
              <div key={p.id} onClick={() => navigate('/admin/pedidos')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f9fafb', borderRadius: 10, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 600, color: '#2C2C2A', fontSize: 14 }}>{p.clientes?.nome || 'Cliente'}</span>
                  <span style={{ background: STATUS_COR[p.status] + '20', color: STATUS_COR[p.status], fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>{STATUS_LABEL[p.status]}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ color: '#D4537E', fontWeight: 700, fontSize: 14 }}>R$ {p.total?.toFixed(2).replace('.', ',')}</span>
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
