import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCarrinho } from '../contexts/CarrinhoContext'
import { supabase } from '../lib/supabase'
import { Heart, ArrowLeft, Calendar, Clock, User, MessageCircle, CheckCircle, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'

function formatarPrazo(horas) {
  if (!horas) return ''
  if (horas < 24) return horas + 'h de antecedência'
  const dias = Math.floor(horas / 24)
  return dias + (dias === 1 ? ' dia' : ' dias') + ' de antecedência'
}

function calcularDataMinima(horas) {
  const agora = new Date()
  agora.setTime(agora.getTime() + horas * 60 * 60 * 1000)
  return agora
}

function formatarData(date) {
  return date.toISOString().split('T')[0]
}

function gerarDiasCalendario(dataMinima, horarios) {
  const dias = []
  const hoje = new Date()
  hoje.setHours(0,0,0,0)
  const min = new Date(dataMinima)

  for (let i = 0; i < 30; i++) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + i)

    let disponivel = false
    if (d > min) {
      disponivel = true
    } else if (formatarData(d) === formatarData(min)) {
      const horariosDisponiveis = horarios.filter(h => {
        const [hora, min2] = h.split(':').map(Number)
        const dataHora = new Date(d)
        dataHora.setHours(hora, min2, 0, 0)
        return dataHora > min
      })
      disponivel = horariosDisponiveis.length > 0
    }

    dias.push({
      data: d,
      disponivel,
      diaSemana: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
    })
  }
  return dias
}

function horariosDisponiveisDoDia(data, dataMinima, horarios) {
  return horarios.filter(h => {
    const [hora, min] = h.split(':').map(Number)
    const dataHora = new Date(data)
    dataHora.setHours(hora, min, 0, 0)
    return dataHora > dataMinima
  })
}

function formatarTelefone(valor) {
  const nums = valor.replace(/\D/g, '')
  if (nums.length <= 10) return nums.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  return nums.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

export default function Checkout() {
  const navigate = useNavigate()
  const { itens, totalValor, prazoMaximo, limparCarrinho } = useCarrinho()
  const [totalFinal, setTotalFinal] = useState(0)
  const [etapa, setEtapa] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false)
  const [numeroPedido, setNumeroPedido] = useState('')
  const [dataSelecionada, setDataSelecionada] = useState(null)
  const [horarioSelecionado, setHorarioSelecionado] = useState('')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [offsetDias, setOffsetDias] = useState(0)
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([])

  const whatsapp = '5562999049716'
  const dataMinima = calcularDataMinima(prazoMaximo || 4)

  const horariosUnificados = (() => {
    if (itens.length === 0) return ['09:00','10:00','14:00','16:00','18:00']
    const produtoComMenorHorarios = itens.reduce((acc, item) => {
      const h = item.produto.horarios_retirada
      if (!h || h.length === 0) return acc
      if (!acc) return item.produto
      return h.length < (acc.horarios_retirada?.length || 999) ? item.produto : acc
    }, null)
    const horariosProdutos = itens
      .filter(i => i.produto.horarios_retirada?.length > 0)
      .map(i => i.produto.horarios_retirada)
    if (horariosProdutos.length === 0) return ['09:00','10:00','14:00','16:00','18:00']
    const intersecao = horariosProdutos.reduce((acc, h) => acc.filter(x => h.includes(x)))
    return intersecao.length > 0 ? intersecao.sort() : horariosProdutos[0].sort()
  })()

  const diasCalendario = gerarDiasCalendario(dataMinima, horariosUnificados)
  const diasVisiveis = diasCalendario.slice(offsetDias, offsetDias + 7)

  useEffect(() => {
    if (dataSelecionada) {
      const disponiveis = horariosDisponiveisDoDia(dataSelecionada, dataMinima, horariosUnificados)
      setHorariosDisponiveis(disponiveis)
      if (!disponiveis.includes(horarioSelecionado)) setHorarioSelecionado('')
    }
  }, [dataSelecionada])

  if (itens.length === 0 && !pedidoConfirmado) {
    return (
      <div style={{ minHeight: '100vh', background: '#FDF8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
          <h2 style={{ color: '#2C2C2A', marginBottom: 8 }}>Carrinho vazio</h2>
          <p style={{ color: '#9ca3af', marginBottom: 24 }}>Adicione produtos antes de finalizar o pedido</p>
          <button onClick={() => navigate('/cardapio')} style={{ background: '#D4537E', color: '#fff', padding: '14px 32px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Ver cardápio
          </button>
        </div>
      </div>
    )
  }

  async function confirmarPedido() {
    if (!nome.trim()) return toast.error('Digite seu nome')
    if (!telefone.replace(/\D/g,'') || telefone.replace(/\D/g,'').length < 10) return toast.error('Digite um telefone válido')
    if (!dataSelecionada) return toast.error('Escolha a data de retirada')
    if (!horarioSelecionado) return toast.error('Escolha o horário de retirada')

    setEnviando(true)
    try {
      let clienteId = null
      const { data: clienteExistente } = await supabase
        .from('clientes').select('id').eq('telefone', telefone.replace(/\D/g,'')).single()

      if (clienteExistente) {
        clienteId = clienteExistente.id
      } else {
        const { data: novoCliente } = await supabase
          .from('clientes').insert({ nome: nome.trim(), telefone: telefone.replace(/\D/g,'') }).select().single()
        clienteId = novoCliente?.id
      }

      const { data: pedido } = await supabase.from('pedidos').insert({
        cliente_id: clienteId,
        data_retirada: formatarData(dataSelecionada),
        hora_retirada: horarioSelecionado,
        subtotal: totalValor,
        total: totalValor,
        observacoes: observacoes.trim() || null,
        status: 'novo',
      }).select().single()

      if (pedido) {
        const isUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        await supabase.from('pedido_itens').insert(
          itens.map(item => ({
            pedido_id: pedido.id,
            produto_id: isUUID(item.produto.id) ? item.produto.id : null,
            nome_produto: item.produto.nome,
            preco_unitario: item.produto.preco,
            quantidade: item.quantidade,
            subtotal: item.produto.preco * item.quantidade,
          }))
        )

        const listaItens = itens.map(i => `• ${i.produto.nome} x${i.quantidade} — R$ ${(i.produto.preco * i.quantidade).toFixed(2).replace('.', ',')}`).join('\n')
        const dataFormatada = dataSelecionada.toLocaleDateString('pt-BR')
        const msgWhats = encodeURIComponent(
          `🍰 *Novo pedido - Tufit Delícias*\n\n` +
          `*Cliente:* ${nome}\n` +
          `*WhatsApp:* ${telefone}\n\n` +
          `*Itens do pedido:*\n${listaItens}\n\n` +
          `*Total:* R$ ${totalValor.toFixed(2).replace('.', ',')}\n` +
          `*Retirada:* ${dataFormatada} às ${horarioSelecionado}\n` +
          (observacoes ? `*Obs:* ${observacoes}\n` : '') +
          `\n_Pedido #${pedido.id.slice(0,8).toUpperCase()}_`
        )

        setTotalFinal(totalValor)
        setNumeroPedido(pedido.id.slice(0,8).toUpperCase())
        limparCarrinho()
        setPedidoConfirmado(true)
        setTimeout(() => {
          window.open('https://wa.me/' + whatsapp + '?text=' + msgWhats, '_blank')
        }, 800)
      }
    } catch (err) {
      toast.error('Erro ao enviar pedido. Tente novamente.')
      console.error(err)
    }
    setEnviando(false)
  }

  if (pedidoConfirmado) {
    return (
      <div style={{ minHeight: '100vh', background: '#FDF8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: 48, maxWidth: 480, width: '100%', textAlign: 'center', border: '1px solid #fce7f3', boxShadow: '0 8px 32px rgba(212,83,126,0.1)' }}>
          <div style={{ width: 80, height: 80, background: '#FBEAF0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={40} color="#D4537E" />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#2C2C2A', marginBottom: 8 }}>Pedido recebido!</h2>
          <p style={{ color: '#9ca3af', marginBottom: 8 }}>Pedido #{numeroPedido}</p>
          <p style={{ color: '#6b7280', lineHeight: 1.7, marginBottom: 24 }}>
            Seu pedido foi registrado! O WhatsApp da Tufit foi aberto para confirmar os detalhes.
          </p>
          <div style={{ background: '#FBEAF0', borderRadius: 16, padding: 20, marginBottom: 24, textAlign: 'left' }}>
            <p style={{ fontSize: 14, color: '#993556', fontWeight: 600, margin: '0 0 10px' }}>Resumo</p>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0' }}>Retirada: {dataSelecionada?.toLocaleDateString('pt-BR')} às {horarioSelecionado}</p>
            <p style={{ fontSize: 16, color: '#D4537E', fontWeight: 700, margin: '8px 0 0' }}>Total: R$ {totalFinal.toFixed(2).replace('.', ',')}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
            <a href={'https://wa.me/' + whatsapp} target="_blank" rel="noreferrer"
              style={{ background: '#D4537E', color: '#fff', padding: '14px 24px', borderRadius: 24, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <MessageCircle size={18} />
              Abrir WhatsApp
            </a>
            <button onClick={() => navigate('/cardapio')}
              style={{ background: 'transparent', color: '#D4537E', padding: '14px 24px', borderRadius: 24, fontWeight: 600, border: '2px solid #D4537E', cursor: 'pointer' }}>
              Ver mais produtos
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDF8F0', fontFamily: 'Inter, sans-serif' }}>
      <nav style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #fce7f3' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate('/cardapio')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
              <ArrowLeft size={18} />
              Cardápio
            </button>
            <div style={{ width: 1, height: 20, background: '#fce7f3' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, background: '#D4537E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={14} color="#fff" fill="#fff" />
              </div>
              <span style={{ fontWeight: 700, color: '#993556', fontSize: 16 }}>Tufit Delícias</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,2,3].map(e => (
              <div key={e} style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: etapa >= e ? '#D4537E' : '#fce7f3', color: etapa >= e ? '#fff' : '#D4537E', fontSize: 12, fontWeight: 700 }}>
                {e}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, border: '1px solid #fce7f3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <ShoppingBag size={16} color="#D4537E" />
            <span style={{ fontWeight: 600, color: '#2C2C2A', fontSize: 15 }}>Seu pedido ({itens.length} {itens.length === 1 ? 'item' : 'itens'})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {itens.map(item => (
              <div key={item.produto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #fce7f3' }}>
                <span style={{ color: '#2C2C2A', fontSize: 14 }}>{item.produto.nome} <span style={{ color: '#9ca3af' }}>x{item.quantidade}</span></span>
                <span style={{ color: '#D4537E', fontWeight: 600, fontSize: 14 }}>R$ {(item.produto.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
              <span style={{ fontWeight: 700, color: '#2C2C2A' }}>Total</span>
              <span style={{ fontWeight: 800, color: '#D4537E', fontSize: 18 }}>R$ {totalValor.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
          {prazoMaximo > 0 && (
            <div style={{ marginTop: 12, background: '#FBEAF0', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#993556' }}>
              Prazo mínimo: <strong>{formatarPrazo(prazoMaximo)}</strong>
            </div>
          )}
        </div>

        {etapa === 1 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #fce7f3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Calendar size={20} color="#D4537E" />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2C2C2A', margin: 0 }}>Quando quer retirar?</h3>
            </div>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
              Primeira data disponível: <strong style={{ color: '#D4537E' }}>{dataMinima.toLocaleDateString('pt-BR')}</strong>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <button
                onClick={() => setOffsetDias(o => Math.max(0, o - 7))}
                disabled={offsetDias === 0}
                style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #fce7f3', background: offsetDias === 0 ? '#f9fafb' : '#fff', cursor: offsetDias === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4537E' }}
              >
                <ChevronLeft size={16} />
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, flex: 1 }}>
                {diasVisiveis.map((dia, i) => (
                  <button
                    key={i}
                    disabled={!dia.disponivel}
                    onClick={() => { if (dia.disponivel) { setDataSelecionada(dia.data); setHorarioSelecionado('') } }}
                    style={{
                      padding: '10px 4px',
                      borderRadius: 12,
                      border: '1.5px solid',
                      borderColor: dataSelecionada && formatarData(dataSelecionada) === formatarData(dia.data) ? '#D4537E' : dia.disponivel ? '#fce7f3' : '#f3f4f6',
                      background: dataSelecionada && formatarData(dataSelecionada) === formatarData(dia.data) ? '#D4537E' : dia.disponivel ? '#fff' : '#f9fafb',
                      color: dataSelecionada && formatarData(dataSelecionada) === formatarData(dia.data) ? '#fff' : dia.disponivel ? '#2C2C2A' : '#d1d5db',
                      cursor: dia.disponivel ? 'pointer' : 'not-allowed',
                      textAlign: 'center',
                      fontSize: 11,
                    }}
                  >
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{dia.diaSemana}</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{dia.data.getDate()}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setOffsetDias(o => Math.min(23, o + 7))}
                disabled={offsetDias >= 23}
                style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #fce7f3', background: offsetDias >= 23 ? '#f9fafb' : '#fff', cursor: offsetDias >= 23 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4537E' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {dataSelecionada && (
              <div>
                <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color="#D4537E" />
                  Horários disponíveis para {dataSelecionada.toLocaleDateString('pt-BR')}:
                </p>
                {horariosDisponiveis.length === 0 ? (
                  <div style={{ background: '#fef2f2', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#ef4444' }}>
                    Nenhum horário disponível neste dia. Escolha outra data.
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {horariosDisponiveis.map(h => (
                      <button
                        key={h}
                        onClick={() => setHorarioSelecionado(h)}
                        style={{ padding: '10px 20px', borderRadius: 24, border: '1.5px solid', borderColor: horarioSelecionado === h ? '#D4537E' : '#fce7f3', background: horarioSelecionado === h ? '#D4537E' : '#fff', color: horarioSelecionado === h ? '#fff' : '#6b7280', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                if (!dataSelecionada) return toast.error('Escolha uma data')
                if (!horarioSelecionado) return toast.error('Escolha um horário')
                setEtapa(2)
              }}
              style={{ marginTop: 28, width: '100%', background: '#D4537E', color: '#fff', padding: '16px', borderRadius: 24, fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer' }}
            >
              Continuar →
            </button>
          </div>
        )}

        {etapa === 2 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #fce7f3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <User size={20} color="#D4537E" />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2C2C2A', margin: 0 }}>Seus dados</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 6 }}>Nome completo *</label>
                <input type="text" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #fce7f3', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 6 }}>WhatsApp *</label>
                <input type="tel" placeholder="(62) 99999-9999" value={telefone} onChange={e => setTelefone(formatarTelefone(e.target.value))} maxLength={15}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #fce7f3', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 6 }}>Observações (opcional)</label>
                <textarea placeholder="Alguma preferência especial, alergia ou pedido personalizado?" value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #fce7f3', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => setEtapa(1)} style={{ flex: 1, background: 'transparent', color: '#D4537E', padding: '16px', borderRadius: 24, fontWeight: 600, fontSize: 15, border: '2px solid #D4537E', cursor: 'pointer' }}>← Voltar</button>
              <button
                onClick={() => {
                  if (!nome.trim()) return toast.error('Digite seu nome')
                  if (telefone.replace(/\D/g,'').length < 10) return toast.error('Digite um telefone válido')
                  setEtapa(3)
                }}
                style={{ flex: 2, background: '#D4537E', color: '#fff', padding: '16px', borderRadius: 24, fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer' }}
              >
                Revisar pedido →
              </button>
            </div>
          </div>
        )}

        {etapa === 3 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #fce7f3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <ShoppingBag size={20} color="#D4537E" />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2C2C2A', margin: 0 }}>Confirmar pedido</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Retirada', valor: dataSelecionada?.toLocaleDateString('pt-BR') + ' às ' + horarioSelecionado },
                { label: 'Nome', valor: nome },
                { label: 'WhatsApp', valor: telefone },
                observacoes ? { label: 'Observações', valor: observacoes } : null,
              ].filter(Boolean).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #fce7f3' }}>
                  <span style={{ color: '#9ca3af', fontSize: 14 }}>{item.label}</span>
                  <span style={{ color: '#2C2C2A', fontSize: 14, fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{item.valor}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0' }}>
                <span style={{ color: '#2C2C2A', fontWeight: 700, fontSize: 16 }}>Total</span>
                <span style={{ color: '#D4537E', fontWeight: 800, fontSize: 22 }}>R$ {totalValor.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
            <div style={{ background: '#FBEAF0', borderRadius: 12, padding: 14, margin: '20px 0', fontSize: 13, color: '#993556' }}>
              Após confirmar, o WhatsApp será aberto automaticamente para finalizar com a Tufit.
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setEtapa(2)} style={{ flex: 1, background: 'transparent', color: '#D4537E', padding: '16px', borderRadius: 24, fontWeight: 600, fontSize: 15, border: '2px solid #D4537E', cursor: 'pointer' }}>← Voltar</button>
              <button
                onClick={confirmarPedido}
                disabled={enviando}
                style={{ flex: 2, background: enviando ? '#f9a8d4' : '#D4537E', color: '#fff', padding: '16px', borderRadius: 24, fontWeight: 700, fontSize: 15, border: 'none', cursor: enviando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <MessageCircle size={18} />
                {enviando ? 'Enviando...' : 'Confirmar e abrir WhatsApp'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
