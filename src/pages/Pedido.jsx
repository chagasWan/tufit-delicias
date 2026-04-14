import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ShoppingBag, Heart, ArrowLeft, Calendar, Clock, User, Phone, MessageCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const produtosMock = {
  '1': { id: '1', nome: 'Brigadeiro Fit', descricao: 'Brigadeiro cremoso sem açúcar refinado.', preco: 4.50, prazo_minimo_horas: 4, horarios_retirada: ['09:00','10:00','14:00','16:00','18:00'], ingredientes_destaque: ['Sem açúcar', 'Sem glúten'] },
  '2': { id: '2', nome: 'Cupcake Zero', descricao: 'Cupcake fofinho sem glúten e sem lactose.', preco: 8.00, prazo_minimo_horas: 8, horarios_retirada: ['09:00','10:00','14:00','16:00','18:00'], ingredientes_destaque: ['Sem glúten', 'Sem lactose'] },
  '3': { id: '3', nome: 'Bolo de Cenoura Fit', descricao: 'Bolo integral de cenoura com cobertura de chocolate.', preco: 45.00, prazo_minimo_horas: 24, horarios_retirada: ['09:00','14:00','16:00'], ingredientes_destaque: ['Integral', 'Sem lactose'] },
  '4': { id: '4', nome: 'Torta de Morango', descricao: 'Torta com base de aveia e morangos frescos.', preco: 65.00, prazo_minimo_horas: 48, horarios_retirada: ['09:00','14:00'], ingredientes_destaque: ['Sem açúcar', 'Sem glúten'] },
  '5': { id: '5', nome: 'Cookies de Aveia', descricao: 'Cookies crocantes de aveia. Pacote com 6 unidades.', preco: 18.00, prazo_minimo_horas: 4, horarios_retirada: ['09:00','10:00','14:00','16:00','18:00'], ingredientes_destaque: ['Integral', 'Sem lactose'] },
  '6': { id: '6', nome: 'Bolo Decorado Fit', descricao: 'Bolo personalizado para festas.', preco: 120.00, prazo_minimo_horas: 120, horarios_retirada: ['09:00','14:00'], ingredientes_destaque: ['Sem açúcar', 'Sem glúten', 'Personalizado'] },
}

function formatarPrazo(horas) {
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

function gerarDiasCalendario(dataMinima) {
  const dias = []
  const hoje = new Date()
  hoje.setHours(0,0,0,0)
  const min = new Date(dataMinima)
  min.setHours(0,0,0,0)

  for (let i = 0; i < 30; i++) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + i)
    dias.push({
      data: d,
      disponivel: d >= min,
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      diaSemana: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
    })
  }
  return dias
}

export default function Pedido() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [produto, setProduto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [etapa, setEtapa] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false)
  const [numeroPedido, setNumeroPedido] = useState('')

  const [quantidade, setQuantidade] = useState(1)
  const [dataSelecionada, setDataSelecionada] = useState(null)
  const [horarioSelecionado, setHorarioSelecionado] = useState('')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [offsetDias, setOffsetDias] = useState(0)

  const whatsapp = '5562999049716'

  useEffect(() => {
    async function buscarProduto() {
      const { data } = await supabase.from('produtos').select('*').eq('id', id).single()
      if (data) {
        setProduto(data)
      } else {
        setProduto(produtosMock[id] || produtosMock['1'])
      }
      setLoading(false)
    }
    buscarProduto()
  }, [id])

  const horarios = produto?.horarios_retirada || ['09:00','10:00','14:00','16:00','18:00']
  const dataMinima = produto ? calcularDataMinima(produto.prazo_minimo_horas || 4) : new Date()
  const diasCalendario = produto ? gerarDiasCalendario(dataMinima) : []
  const diasVisiveis = diasCalendario.slice(offsetDias, offsetDias + 7)
  const total = produto ? produto.preco * quantidade : 0

  function formatarTelefone(valor) {
    const nums = valor.replace(/\D/g, '')
    if (nums.length <= 10) return nums.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    return nums.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
  }

  async function confirmarPedido() {
    if (!nome.trim()) return toast.error('Digite seu nome')
    if (!telefone.trim() || telefone.replace(/\D/g,'').length < 10) return toast.error('Digite um telefone válido')
    if (!dataSelecionada) return toast.error('Escolha a data de retirada')
    if (!horarioSelecionado) return toast.error('Escolha o horário de retirada')

    setEnviando(true)

    try {
      let clienteId = null
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .eq('telefone', telefone.replace(/\D/g,''))
        .single()

      if (clienteExistente) {
        clienteId = clienteExistente.id
      } else {
        const { data: novoCliente } = await supabase
          .from('clientes')
          .insert({ nome: nome.trim(), telefone: telefone.replace(/\D/g,'') })
          .select()
          .single()
        clienteId = novoCliente?.id
      }

      const subtotal = total
      const { data: pedido } = await supabase
        .from('pedidos')
        .insert({
          cliente_id: clienteId,
          data_retirada: formatarData(dataSelecionada),
          hora_retirada: horarioSelecionado,
          subtotal,
          total: subtotal,
          observacoes: observacoes.trim() || null,
          status: 'novo',
        })
        .select()
        .single()

      if (pedido) {
        await supabase.from('pedido_itens').insert({
          pedido_id: pedido.id,
          produto_id: produto.id,
          nome_produto: produto.nome,
          preco_unitario: produto.preco,
          quantidade,
          subtotal: total,
        })

        const dataFormatada = dataSelecionada.toLocaleDateString('pt-BR')
        const msgWhats = encodeURIComponent(
          `🍰 *Novo pedido - Tufit Delícias*\n\n` +
          `*Cliente:* ${nome}\n` +
          `*Telefone:* ${telefone}\n` +
          `*Produto:* ${produto.nome}\n` +
          `*Quantidade:* ${quantidade}\n` +
          `*Total:* R$ ${total.toFixed(2).replace('.', ',')}\n` +
          `*Retirada:* ${dataFormatada} às ${horarioSelecionado}\n` +
          (observacoes ? `*Obs:* ${observacoes}\n` : '') +
          `\n_Pedido #${pedido.id.slice(0,8)}_`
        )

        setNumeroPedido(pedido.id.slice(0,8).toUpperCase())
        setPedidoConfirmado(true)

        setTimeout(() => {
          window.open('https://wa.me/' + whatsapp + '?text=' + msgWhats, '_blank')
        }, 1000)
      }
    } catch (err) {
      toast.error('Erro ao enviar pedido. Tente novamente.')
    }

    setEnviando(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDF8F0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍰</div>
          <p style={{ color: '#9ca3af' }}>Carregando...</p>
        </div>
      </div>
    )
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
            Seu pedido foi registrado com sucesso! O WhatsApp da Tufit já foi aberto para confirmar os detalhes.
          </p>
          <div style={{ background: '#FBEAF0', borderRadius: 16, padding: 20, marginBottom: 24, textAlign: 'left' }}>
            <p style={{ fontSize: 14, color: '#993556', fontWeight: 600, margin: '0 0 8px' }}>Resumo do pedido</p>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0' }}><strong>{produto.nome}</strong> x{quantidade}</p>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0' }}>Retirada: {dataSelecionada?.toLocaleDateString('pt-BR')} às {horarioSelecionado}</p>
            <p style={{ fontSize: 16, color: '#D4537E', fontWeight: 700, margin: '8px 0 0' }}>Total: R$ {total.toFixed(2).replace('.', ',')}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
            <a
              href={'https://wa.me/' + whatsapp}
              target="_blank"
              rel="noreferrer"
              style={{ background: '#D4537E', color: '#fff', padding: '14px 24px', borderRadius: 24, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <MessageCircle size={18} />
              Abrir WhatsApp
            </a>
            <button
              onClick={() => navigate('/cardapio')}
              style={{ background: 'transparent', color: '#D4537E', padding: '14px 24px', borderRadius: 24, fontWeight: 600, border: '2px solid #D4537E', cursor: 'pointer' }}
            >
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
            {[1, 2, 3].map(e => (
              <div key={e} style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: etapa >= e ? '#D4537E' : '#fce7f3', color: etapa >= e ? '#fff' : '#D4537E', fontSize: 12, fontWeight: 700 }}>
                {e}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ background: '#fff', borderRadius: 20, padding: 24, marginBottom: 24, border: '1px solid #fce7f3', display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 80, height: 80, background: '#FBEAF0', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, flexShrink: 0 }}>
            {produto.foto_url ? <img src={produto.foto_url} alt={produto.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} /> : '🍰'}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2C2C2A', margin: '0 0 4px' }}>{produto.nome}</h2>
            <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 8px' }}>{produto.descricao}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: '#D4537E', fontWeight: 800, fontSize: 20 }}>R$ {produto.preco?.toFixed(2).replace('.', ',')}</span>
              <span style={{ background: '#FBEAF0', color: '#993556', fontSize: 11, padding: '3px 10px', borderRadius: 20 }}>⏱ {formatarPrazo(produto.prazo_minimo_horas || 4)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <button onClick={() => setQuantidade(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #fce7f3', background: '#fff', cursor: 'pointer', fontSize: 18, color: '#D4537E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <span style={{ fontWeight: 700, fontSize: 20, minWidth: 24, textAlign: 'center' }}>{quantidade}</span>
            <button onClick={() => setQuantidade(q => q + 1)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#D4537E', cursor: 'pointer', fontSize: 18, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
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
                    onClick={() => dia.disponivel && setDataSelecionada(dia.data)}
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
                  Escolha o horário de retirada:
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {horarios.map(h => (
                    <button
                      key={h}
                      onClick={() => setHorarioSelecionado(h)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 24,
                        border: '1.5px solid',
                        borderColor: horarioSelecionado === h ? '#D4537E' : '#fce7f3',
                        background: horarioSelecionado === h ? '#D4537E' : '#fff',
                        color: horarioSelecionado === h ? '#fff' : '#6b7280',
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {h}
                    </button>
                  ))}
                </div>
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
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #fce7f3', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 6 }}>WhatsApp *</label>
                <input
                  type="tel"
                  placeholder="(62) 99999-9999"
                  value={telefone}
                  onChange={e => setTelefone(formatarTelefone(e.target.value))}
                  maxLength={15}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #fce7f3', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 6 }}>Observações (opcional)</label>
                <textarea
                  placeholder="Alguma preferência especial, alergia ou pedido personalizado?"
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #fce7f3', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setEtapa(1)}
                style={{ flex: 1, background: 'transparent', color: '#D4537E', padding: '16px', borderRadius: 24, fontWeight: 600, fontSize: 15, border: '2px solid #D4537E', cursor: 'pointer' }}
              >
                ← Voltar
              </button>
              <button
                onClick={() => {
                  if (!nome.trim()) return toast.error('Digite seu nome')
                  if (!telefone.trim() || telefone.replace(/\D/g,'').length < 10) return toast.error('Digite um telefone válido')
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Produto', valor: produto.nome },
                { label: 'Quantidade', valor: quantidade + 'x' },
                { label: 'Retirada', valor: dataSelecionada?.toLocaleDateString('pt-BR') + ' às ' + horarioSelecionado },
                { label: 'Nome', valor: nome },
                { label: 'WhatsApp', valor: telefone },
                observacoes && { label: 'Observações', valor: observacoes },
              ].filter(Boolean).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #fce7f3' }}>
                  <span style={{ color: '#9ca3af', fontSize: 14 }}>{item.label}</span>
                  <span style={{ color: '#2C2C2A', fontSize: 14, fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{item.valor}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0' }}>
                <span style={{ color: '#2C2C2A', fontWeight: 700, fontSize: 16 }}>Total</span>
                <span style={{ color: '#D4537E', fontWeight: 800, fontSize: 22 }}>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <div style={{ background: '#FBEAF0', borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 13, color: '#993556' }}>
              💬 Após confirmar, o WhatsApp será aberto automaticamente para finalizar o pedido com a Tufit.
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setEtapa(2)}
                style={{ flex: 1, background: 'transparent', color: '#D4537E', padding: '16px', borderRadius: 24, fontWeight: 600, fontSize: 15, border: '2px solid #D4537E', cursor: 'pointer' }}
              >
                ← Voltar
              </button>
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
