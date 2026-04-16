import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCarrinho } from '../contexts/CarrinhoContext'
import { supabase } from '../lib/supabase'
import { Heart, ArrowLeft, Calendar, Clock, User, MessageCircle, CheckCircle, ChevronLeft, ChevronRight, ShoppingBag, MapPin, Navigation } from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'
import toast from 'react-hot-toast'

const TUFIT_LAT = -16.671841955882282
const TUFIT_LNG = -49.241256992830735
const PRECO_POR_KM = 2.00
const FATOR_CORRECAO = 1.3
const DISTANCIA_MAXIMA_KM = 20
const DISTANCIA_MINIMA_GRATIS_KM = 2

const FERIADOS_NACIONAIS = [
  '01-01', '04-21', '05-01', '09-07', '10-12',
  '11-02', '11-15', '11-20', '12-25',
]

function ehFeriado(date) {
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return FERIADOS_NACIONAIS.includes(mes + '-' + dia)
}

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

function distanciaEmKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function gerarDiasCalendario(dataMinima, horarios, diasFuncionamento) {
  const dias = []
  const hoje = new Date()
  hoje.setHours(0,0,0,0)

  for (let i = 0; i < 30; i++) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + i)
    const diaSemana = d.getDay()
    const diaPermitido = diasFuncionamento.includes(diaSemana)
    const feriado = ehFeriado(d)

    let disponivel = false
    if (diaPermitido && !feriado) {
      if (d > dataMinima) {
        disponivel = true
      } else if (formatarData(d) === formatarData(dataMinima)) {
        const horariosDisponiveis = horarios.filter(h => {
          const [hora, min] = h.split(':').map(Number)
          const dataHora = new Date(d)
          dataHora.setHours(hora, min, 0, 0)
          return dataHora > dataMinima
        })
        disponivel = horariosDisponiveis.length > 0
      }
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
  const isMobile = useIsMobile()
  const { itens, totalValor, prazoMaximo, limparCarrinho } = useCarrinho()
  const [totalFinal, setTotalFinal] = useState(0)
  const [etapa, setEtapa] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false)
  const [numeroPedido, setNumeroPedido] = useState('')
  const [diasFuncionamento, setDiasFuncionamento] = useState([1,2,3,4,5,6])

  const [tipoEntrega, setTipoEntrega] = useState('retirada')
  const [enderecoEntrega, setEnderecoEntrega] = useState('')
  const [buscandoFrete, setBuscandoFrete] = useState(false)
  const [freteInfo, setFreteInfo] = useState(null)
  const [erroFrete, setErroFrete] = useState('')

  const [dataSelecionada, setDataSelecionada] = useState(null)
  const [horarioSelecionado, setHorarioSelecionado] = useState('')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('pix')
  const [cupomCodigo, setCupomCodigo] = useState('')
  const [cupomAplicado, setCupomAplicado] = useState(null)
  const [cupomErro, setCupomErro] = useState('')
  const [validandoCupom, setValidandoCupom] = useState(false)
  const [offsetDias, setOffsetDias] = useState(0)
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([])

  const whatsapp = '5562999049716'
  const dataMinima = calcularDataMinima(prazoMaximo || 4)

  useEffect(() => {
    supabase.from('configuracoes').select('valor').eq('chave', 'dias_funcionamento').single().then(({ data }) => {
      if (data?.valor) {
        setDiasFuncionamento(data.valor.split(',').map(Number))
      }
    })
  }, [])

  const horariosUnificados = (() => {
    if (itens.length === 0) return ['09:00','10:00','14:00','16:00','18:00']
    // Usa horarios_entrega para entrega, horarios_retirada para retirada
    const campo = tipoEntrega === 'entrega' ? 'horarios_entrega' : 'horarios_retirada'
    const fallbackCampo = tipoEntrega === 'entrega' ? 'horarios_retirada' : 'horarios_entrega'
    const defaultEntrega = ['12:00', '18:00', '19:00']
    const defaultRetirada = ['09:00','10:00','14:00','16:00','18:00']
    const defaultHorarios = tipoEntrega === 'entrega' ? defaultEntrega : defaultRetirada

    const horariosProdutos = itens
      .filter(i => (i.produto[campo]?.length > 0) || (i.produto[fallbackCampo]?.length > 0))
      .map(i => i.produto[campo]?.length > 0 ? i.produto[campo] : i.produto[fallbackCampo])
    if (horariosProdutos.length === 0) return defaultHorarios
    const intersecao = horariosProdutos.reduce((acc, h) => acc.filter(x => h.includes(x)))
    return intersecao.length > 0 ? intersecao.sort() : horariosProdutos[0].sort()
  })()

  const diasCalendario = gerarDiasCalendario(dataMinima, horariosUnificados, diasFuncionamento)
  const diasVisiveis = diasCalendario.slice(offsetDias, offsetDias + 7)

  const taxaEntrega = freteInfo?.taxa || 0
  const desconto = cupomAplicado
    ? cupomAplicado.tipo === 'percentual'
      ? Math.round((totalValor * cupomAplicado.valor / 100) * 100) / 100
      : Math.min(cupomAplicado.valor, totalValor)
    : 0
  const totalComFrete = totalValor + taxaEntrega - desconto

  useEffect(() => {
    if (dataSelecionada) {
      const disponiveis = horariosDisponiveisDoDia(dataSelecionada, dataMinima, horariosUnificados)
      setHorariosDisponiveis(disponiveis)
      if (!disponiveis.includes(horarioSelecionado)) setHorarioSelecionado('')
    }
  }, [dataSelecionada])

  async function calcularFrete() {
    if (!enderecoEntrega.trim()) return toast.error('Digite o endereço de entrega')
    setBuscandoFrete(true)
    setErroFrete('')
    setFreteInfo(null)

    try {
      const query = encodeURIComponent(enderecoEntrega + ', Goiânia, Goiás, Brasil')
      const resp = await fetch('https://nominatim.openstreetmap.org/search?q=' + query + '&format=json&limit=1', {
        headers: { 'Accept-Language': 'pt-BR' }
      })
      const data = await resp.json()

      if (!data || data.length === 0) {
        setErroFrete('Endereço não encontrado. Tente ser mais específico (ex: Rua X, número, bairro).')
        setBuscandoFrete(false)
        return
      }

      const { lat, lon, display_name } = data[0]
      const distLinha = distanciaEmKm(TUFIT_LAT, TUFIT_LNG, parseFloat(lat), parseFloat(lon))
      const distEstimada = distLinha * FATOR_CORRECAO

      if (distEstimada > DISTANCIA_MAXIMA_KM) {
        setErroFrete('Endereço fora da área de entrega. Máximo ' + DISTANCIA_MAXIMA_KM + 'km (estimativa: ' + distEstimada.toFixed(1) + 'km).')
        setBuscandoFrete(false)
        return
      }

      const taxa = distEstimada <= DISTANCIA_MINIMA_GRATIS_KM ? 0 : distEstimada * PRECO_POR_KM
      setFreteInfo({
        taxa: Math.round(taxa * 100) / 100,
        distancia: Math.round(distEstimada * 10) / 10,
        gratis: distEstimada <= DISTANCIA_MINIMA_GRATIS_KM,
        enderecoConfirmado: display_name,
      })
    } catch {
      setErroFrete('Erro ao buscar endereço. Verifique sua conexão e tente novamente.')
    }
    setBuscandoFrete(false)
  }

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
    if (!dataSelecionada) return toast.error('Escolha a data')
    if (!horarioSelecionado) return toast.error('Escolha o horário')
    if (tipoEntrega === 'entrega' && !freteInfo) return toast.error('Calcule o frete antes de confirmar')

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
        tipo_entrega: tipoEntrega,
        endereco_entrega: tipoEntrega === 'entrega' ? enderecoEntrega : null,
        taxa_entrega: taxaEntrega,
        subtotal: totalValor,
        desconto: desconto,
        cupom_codigo: cupomAplicado?.codigo || null,
        total: totalComFrete,
        observacoes: observacoes.trim() || null,
        forma_pagamento: formaPagamento,
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

        const listaItens = itens.map(i => '• ' + i.produto.nome + ' x' + i.quantidade + ' — R$ ' + (i.produto.preco * i.quantidade).toFixed(2).replace('.', ',')).join('\n')
        const dataFormatada = dataSelecionada.toLocaleDateString('pt-BR')
        const infoEntrega = tipoEntrega === 'entrega'
          ? '*Entrega:* ' + enderecoEntrega + '\n*Frete:* R$ ' + taxaEntrega.toFixed(2).replace('.', ',') + ' (~' + freteInfo?.distancia + 'km)\n'
          : '*Retirada no local*\n'

        const msgWhats = encodeURIComponent(
          '🍰 *Novo pedido - Tufit Delícias*\n\n' +
          '*Cliente:* ' + nome + '\n*WhatsApp:* ' + telefone + '\n\n' +
          '*Itens:*\n' + listaItens + '\n\n' +
          '*Subtotal:* R$ ' + totalValor.toFixed(2).replace('.', ',') + '\n' +
          (desconto > 0 ? '*Desconto:* - R$ ' + desconto.toFixed(2).replace('.', ',') + ' (' + cupomAplicado?.codigo + ')\n' : '') +
          infoEntrega +
          '*Total:* R$ ' + totalComFrete.toFixed(2).replace('.', ',') + '\n' +
          '*Data:* ' + dataFormatada + ' às ' + horarioSelecionado + '\n' +
          (observacoes ? '*Obs:* ' + observacoes + '\n' : '') +
          '\n_Pedido #' + pedido.id.slice(0,8).toUpperCase() + '_'
        )

        setTotalFinal(totalComFrete)
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
            <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0' }}>
              {tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada'}: {dataSelecionada?.toLocaleDateString('pt-BR')} às {horarioSelecionado}
            </p>
            {tipoEntrega === 'entrega' && (
              <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0' }}>Frete: R$ {taxaEntrega.toFixed(2).replace('.', ',')}</p>
            )}
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

  async function validarCupom() {
    if (!cupomCodigo.trim()) return
    setValidandoCupom(true)
    setCupomErro('')
    const { data, error } = await supabase
      .from('cupons')
      .select('*')
      .eq('codigo', cupomCodigo.trim().toUpperCase())
      .eq('ativo', true)
      .single()

    if (error || !data) {
      setCupomErro('Cupom inválido ou não encontrado')
      setCupomAplicado(null)
    } else if (data.valido_ate && new Date(data.valido_ate) < new Date()) {
      setCupomErro('Este cupom está expirado')
      setCupomAplicado(null)
    } else if (data.uso_maximo && data.uso_atual >= data.uso_maximo) {
      setCupomErro('Este cupom atingiu o limite de uso')
      setCupomAplicado(null)
    } else {
      setCupomAplicado(data)
      setCupomErro('')
      toast.success('Cupom aplicado!')
    }
    setValidandoCupom(false)
  }

  function removerCupom() {
    setCupomAplicado(null)
    setCupomCodigo('')
    setCupomErro('')
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
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: tipoEntrega === 'entrega' && freteInfo ? '1px solid #fce7f3' : 'none' }}>
              <span style={{ fontWeight: 600, color: '#2C2C2A' }}>Subtotal</span>
              <span style={{ fontWeight: 700, color: '#2C2C2A' }}>R$ {totalValor.toFixed(2).replace('.', ',')}</span>
            </div>
            {tipoEntrega === 'entrega' && freteInfo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: '#6b7280', fontSize: 14 }}>Frete (~{freteInfo.distancia}km)</span>
                <span style={{ color: freteInfo.gratis ? '#15803d' : '#6b7280', fontWeight: 600, fontSize: 14 }}>{freteInfo.gratis ? 'Grátis 🎉' : '+ R$ ' + freteInfo.taxa.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            {desconto > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: '#10b981', fontSize: 14 }}>Desconto ({cupomAplicado?.codigo})</span>
                <span style={{ color: '#10b981', fontWeight: 600, fontSize: 14 }}>- R$ {desconto.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1.5px solid #fce7f3' }}>
              <span style={{ fontWeight: 700, color: '#2C2C2A', fontSize: 16 }}>Total</span>
              <span style={{ fontWeight: 800, color: '#D4537E', fontSize: 20 }}>R$ {totalComFrete.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
          {prazoMaximo > 0 && (
            <div style={{ marginTop: 12, background: '#FBEAF0', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#993556' }}>
              Prazo mínimo: <strong>{formatarPrazo(prazoMaximo)}</strong>
            </div>
          )}
        </div>

        {etapa === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #fce7f3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Navigation size={20} color="#D4537E" />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2C2C2A', margin: 0 }}>Como deseja receber?</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <button
                  onClick={() => { setTipoEntrega('retirada'); setFreteInfo(null); setErroFrete(''); setHorarioSelecionado('') }}
                  style={{ padding: '16px', borderRadius: 14, border: '2px solid', borderColor: tipoEntrega === 'retirada' ? '#D4537E' : '#e5e7eb', background: tipoEntrega === 'retirada' ? '#FBEAF0' : '#fff', cursor: 'pointer', textAlign: 'center' }}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🏪</div>
                  <p style={{ fontWeight: 700, color: tipoEntrega === 'retirada' ? '#D4537E' : '#2C2C2A', margin: '0 0 2px', fontSize: 15 }}>Retirar no local</p>
                  <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>Grátis</p>
                </button>
                <button
                  onClick={() => { setTipoEntrega('entrega'); setHorarioSelecionado('') }}
                  style={{ padding: '16px', borderRadius: 14, border: '2px solid', borderColor: tipoEntrega === 'entrega' ? '#D4537E' : '#e5e7eb', background: tipoEntrega === 'entrega' ? '#FBEAF0' : '#fff', cursor: 'pointer', textAlign: 'center' }}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🚗</div>
                  <p style={{ fontWeight: 700, color: tipoEntrega === 'entrega' ? '#D4537E' : '#2C2C2A', margin: '0 0 2px', fontSize: 15 }}>Receber em casa</p>
                  <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>Grátis até 2km · R$ 2,00/km</p>
                </button>
              </div>

              {tipoEntrega === 'retirada' && (
                <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <MapPin size={16} color="#D4537E" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontWeight: 600, color: '#2C2C2A', fontSize: 14, margin: '0 0 2px' }}>Endereço de retirada</p>
                    <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>Rua 227-A, 257 - Setor Leste Universitário, Goiânia - GO</p>
                  </div>
                </div>
              )}

              {tipoEntrega === 'entrega' && (
                <div>
                  <label style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 8 }}>
                    Endereço de entrega
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Rua, número, bairro — Goiânia"
                      value={enderecoEntrega}
                      onChange={e => { setEnderecoEntrega(e.target.value); setFreteInfo(null); setErroFrete('') }}
                      onKeyDown={e => e.key === 'Enter' && calcularFrete()}
                      style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1.5px solid #fce7f3', fontSize: 14, outline: 'none' }}
                    />
                    <button
                      onClick={calcularFrete}
                      disabled={buscandoFrete}
                      style={{ padding: '12px 20px', background: '#D4537E', color: '#fff', borderRadius: 12, border: 'none', cursor: buscandoFrete ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', opacity: buscandoFrete ? 0.7 : 1 }}
                    >
                      {buscandoFrete ? 'Buscando...' : 'Calcular'}
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '6px 0 0' }}>Área de entrega: Goiânia e região (até 20km)</p>

                  {erroFrete && (
                    <div style={{ background: '#fef2f2', borderRadius: 10, padding: '10px 14px', marginTop: 12, fontSize: 13, color: '#ef4444' }}>
                      {erroFrete}
                    </div>
                  )}

                  {freteInfo && (
                    <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '14px 16px', marginTop: 12, border: '1px solid #bbf7d0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontWeight: 600, color: '#15803d', fontSize: 14, margin: '0 0 2px' }}>{freteInfo.gratis ? 'Frete grátis! 🎉' : 'Frete calculado'}</p>
                          <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>Distância estimada: {freteInfo.distancia}km{freteInfo.gratis ? ' (até 2km é grátis)' : ''}</p>
                        </div>
                        <p style={{ fontWeight: 800, color: '#15803d', fontSize: 20, margin: 0 }}>{freteInfo.gratis ? 'Grátis' : 'R$ ' + freteInfo.taxa.toFixed(2).replace('.', ',')}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #fce7f3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Calendar size={20} color="#D4537E" />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2C2C2A', margin: 0 }}>
                  {tipoEntrega === 'entrega' ? 'Quando quer receber?' : 'Quando quer retirar?'}
                </h3>
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
                        padding: '10px 4px', borderRadius: 12, border: '1.5px solid',
                        borderColor: dataSelecionada && formatarData(dataSelecionada) === formatarData(dia.data) ? '#D4537E' : dia.disponivel ? '#fce7f3' : '#f3f4f6',
                        background: dataSelecionada && formatarData(dataSelecionada) === formatarData(dia.data) ? '#D4537E' : dia.disponivel ? '#fff' : '#f9fafb',
                        color: dataSelecionada && formatarData(dataSelecionada) === formatarData(dia.data) ? '#fff' : dia.disponivel ? '#2C2C2A' : '#d1d5db',
                        cursor: dia.disponivel ? 'pointer' : 'not-allowed', textAlign: 'center', fontSize: 11,
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
                        <button key={h} onClick={() => setHorarioSelecionado(h)}
                          style={{ padding: '10px 20px', borderRadius: 24, border: '1.5px solid', borderColor: horarioSelecionado === h ? '#D4537E' : '#fce7f3', background: horarioSelecionado === h ? '#D4537E' : '#fff', color: horarioSelecionado === h ? '#fff' : '#6b7280', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                          {h}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (tipoEntrega === 'entrega' && !freteInfo) return toast.error('Calcule o frete antes de continuar')
                if (!dataSelecionada) return toast.error('Escolha uma data')
                if (!horarioSelecionado) return toast.error('Escolha um horário')
                setEtapa(2)
              }}
              style={{ width: '100%', background: '#D4537E', color: '#fff', padding: '16px', borderRadius: 24, fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer' }}
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
              {/* Campo cupom */}
              <div>
                <label style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 6 }}>Cupom de desconto (opcional)</label>
                {cupomAplicado ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '12px 16px' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#15803d', fontSize: 14 }}>✓ {cupomAplicado.codigo}</span>
                      <span style={{ color: '#15803d', fontSize: 13, marginLeft: 8 }}>
                        {cupomAplicado.tipo === 'percentual' ? `${cupomAplicado.valor}% de desconto` : `R$ ${cupomAplicado.valor.toFixed(2).replace('.', ',')} de desconto`}
                      </span>
                    </div>
                    <button onClick={removerCupom} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18 }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Digite o código"
                      value={cupomCodigo}
                      onChange={e => { setCupomCodigo(e.target.value.toUpperCase()); setCupomErro('') }}
                      onKeyDown={e => e.key === 'Enter' && validarCupom()}
                      style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: cupomErro ? '1.5px solid #ef4444' : '1.5px solid #fce7f3', fontSize: 14, outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase' }}
                    />
                    <button onClick={validarCupom} disabled={validandoCupom || !cupomCodigo.trim()}
                      style={{ padding: '12px 18px', background: '#D4537E', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', opacity: !cupomCodigo.trim() ? 0.5 : 1 }}>
                      {validandoCupom ? '...' : 'Aplicar'}
                    </button>
                  </div>
                )}
                {cupomErro && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{cupomErro}</p>}
              </div>
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
                { label: tipoEntrega === 'entrega' ? 'Entrega' : 'Retirada', valor: dataSelecionada?.toLocaleDateString('pt-BR') + ' às ' + horarioSelecionado },
                tipoEntrega === 'entrega' ? { label: 'Endereço', valor: enderecoEntrega } : null,
                tipoEntrega === 'entrega' ? { label: 'Frete', valor: 'R$ ' + taxaEntrega.toFixed(2).replace('.', ',') + ' (~' + freteInfo?.distancia + 'km)' } : null,
                { label: 'Nome', valor: nome },
                { label: 'WhatsApp', valor: telefone },
                observacoes ? { label: 'Observações', valor: observacoes } : null,
              ].filter(Boolean).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #fce7f3' }}>
                  <span style={{ color: '#9ca3af', fontSize: 14, flexShrink: 0 }}>{item.label}</span>
                  <span style={{ color: '#2C2C2A', fontSize: 14, fontWeight: 500, textAlign: 'right', maxWidth: '65%' }}>{item.valor}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0' }}>
                <span style={{ color: '#2C2C2A', fontWeight: 700, fontSize: 16 }}>Total</span>
                <span style={{ color: '#D4537E', fontWeight: 800, fontSize: 22 }}>R$ {totalComFrete.toFixed(2).replace('.', ',')}</span>
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
