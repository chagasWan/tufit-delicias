import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Heart, Star } from 'lucide-react'

export default function Avaliacao() {
  const { pedidoId } = useParams()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [nota, setNota] = useState(0)
  const [notaHover, setNotaHover] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    async function buscar() {
      // Verificar se já foi avaliado
      const { data: avExistente } = await supabase
        .from('avaliacoes')
        .select('id')
        .eq('pedido_id', pedidoId)
        .single()

      if (avExistente) {
        setEnviado(true)
        setCarregando(false)
        return
      }

      const { data, error } = await supabase
        .from('pedidos')
        .select('id, status, clientes(nome), pedido_itens(nome_produto, quantidade)')
        .eq('id', pedidoId)
        .single()

      if (error || !data) {
        setErro('Pedido não encontrado.')
      } else if (data.status !== 'entregue') {
        setErro('Este link só fica disponível após a entrega do pedido.')
      } else {
        setPedido(data)
      }
      setCarregando(false)
    }
    buscar()
  }, [pedidoId])

  async function enviarAvaliacao() {
    if (nota === 0) return
    setEnviando(true)

    const { error } = await supabase.from('avaliacoes').insert({
      pedido_id: pedidoId,
      cliente_id: pedido.clientes?.id || null,
      nota,
      comentario: comentario.trim() || null,
      publicar: true,
      nome: pedido.clientes?.nome || 'Cliente',
    })

    if (error) {
      alert('Erro ao enviar avaliação. Tente novamente.')
    } else {
      setEnviado(true)
    }
    setEnviando(false)
  }

  if (carregando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDF8F0', fontFamily: 'Inter, sans-serif' }}>
      <p style={{ color: '#9ca3af' }}>Carregando...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FDF8F0', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        <div style={{ width: 36, height: 36, background: '#D4537E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Heart size={18} color="#fff" fill="#fff" />
        </div>
        <span style={{ fontWeight: 700, color: '#993556', fontSize: 20 }}>Tufit Delícias</span>
      </div>

      <div style={{ background: '#fff', borderRadius: 24, padding: 36, maxWidth: 480, width: '100%', boxShadow: '0 8px 32px rgba(212,83,126,0.1)', border: '1px solid #fce7f3' }}>

        {/* Erro */}
        {erro && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2C2C2A', marginBottom: 8 }}>Link indisponível</h2>
            <p style={{ color: '#6b7280', lineHeight: 1.6 }}>{erro}</p>
            <button onClick={() => navigate('/')} style={{ marginTop: 24, background: '#D4537E', color: '#fff', padding: '12px 28px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 15 }}>
              Ir para o site
            </button>
          </div>
        )}

        {/* Já avaliado */}
        {!erro && enviado && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#2C2C2A', marginBottom: 8 }}>Obrigada pela avaliação!</h2>
            <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
              Sua opinião é muito importante para a Tufit Delícias continuar melhorando. 💕
            </p>
            <button onClick={() => navigate('/')} style={{ background: '#D4537E', color: '#fff', padding: '12px 28px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 15 }}>
              Ver cardápio
            </button>
          </div>
        )}

        {/* Formulário */}
        {!erro && !enviado && pedido && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#2C2C2A', margin: '0 0 8px' }}>
                Como foi sua experiência?
              </h2>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                Olá, {pedido.clientes?.nome?.split(' ')[0]}! Conte como foi seu pedido 🍰
              </p>
            </div>

            {/* Itens do pedido */}
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}>
              {(pedido.pedido_itens || []).map((item, i) => (
                <p key={i} style={{ margin: '3px 0', fontSize: 14, color: '#6b7280' }}>
                  {item.quantidade}× {item.nome_produto}
                </p>
              ))}
            </div>

            {/* Estrelas */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#2C2C2A', marginBottom: 12, textAlign: 'center' }}>
                Sua nota *
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onClick={() => setNota(s)}
                    onMouseEnter={() => setNotaHover(s)}
                    onMouseLeave={() => setNotaHover(0)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, transition: 'transform 0.1s', transform: (notaHover || nota) >= s ? 'scale(1.2)' : 'scale(1)' }}
                  >
                    <Star
                      size={40}
                      color="#facc15"
                      fill={(notaHover || nota) >= s ? '#facc15' : 'transparent'}
                    />
                  </button>
                ))}
              </div>
              {nota > 0 && (
                <p style={{ textAlign: 'center', fontSize: 14, color: '#D4537E', fontWeight: 600, marginTop: 8 }}>
                  {['', 'Ruim 😞', 'Regular 😐', 'Bom 🙂', 'Muito bom 😊', 'Excelente 🤩'][nota]}
                </p>
              )}
            </div>

            {/* Comentário */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#2C2C2A', display: 'block', marginBottom: 8 }}>
                Deixe um comentário (opcional)
              </label>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                rows={4}
                placeholder="Conte o que achou dos produtos, da entrega, do atendimento..."
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #fce7f3', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}
              />
            </div>

            <button
              onClick={enviarAvaliacao}
              disabled={nota === 0 || enviando}
              style={{ width: '100%', background: nota === 0 ? '#f9a8d4' : '#D4537E', color: '#fff', padding: '16px', borderRadius: 24, border: 'none', cursor: nota === 0 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 16, transition: 'background 0.2s' }}
            >
              {enviando ? 'Enviando...' : 'Enviar avaliação 💕'}
            </button>

            {nota === 0 && (
              <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 8 }}>Selecione uma nota para enviar</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
