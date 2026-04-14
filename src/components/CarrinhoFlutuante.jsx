import { useNavigate } from 'react-router-dom'
import { useCarrinho } from '../contexts/CarrinhoContext'
import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react'

export default function CarrinhoFlutuante() {
  const { itens, aberto, setAberto, totalItens, totalValor, prazoMaximo, alterarQuantidade, removerItem, limparCarrinho } = useCarrinho()
  const navigate = useNavigate()

  function formatarPrazo(horas) {
    if (!horas) return ''
    if (horas < 24) return horas + 'h de antecedência'
    const dias = Math.floor(horas / 24)
    return dias + (dias === 1 ? ' dia' : ' dias') + ' de antecedência'
  }

  return (
    <>
      {totalItens > 0 && (
        <button
          onClick={() => setAberto(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 100,
            background: '#D4537E',
            color: '#fff',
            border: 'none',
            borderRadius: 32,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(212,83,126,0.4)',
            fontFamily: 'Inter, sans-serif',
            fontSize: 15,
            fontWeight: 600,
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ position: 'relative' }}>
            <ShoppingBag size={22} />
            <div style={{
              position: 'absolute',
              top: -8,
              right: -8,
              background: '#fff',
              color: '#D4537E',
              borderRadius: '50%',
              width: 18,
              height: 18,
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {totalItens}
            </div>
          </div>
          <span>Ver carrinho · R$ {totalValor.toFixed(2).replace('.', ',')}</span>
        </button>
      )}

      {aberto && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setAberto(false) }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setAberto(false)} />

          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 420,
            height: '100%',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
            fontFamily: 'Inter, sans-serif',
            zIndex: 201,
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShoppingBag size={20} color="#D4537E" />
                <span style={{ fontWeight: 700, fontSize: 18, color: '#2C2C2A' }}>Meu carrinho</span>
                <span style={{ background: '#FBEAF0', color: '#D4537E', fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>{totalItens} {totalItens === 1 ? 'item' : 'itens'}</span>
              </div>
              <button onClick={() => setAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {itens.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                  <p style={{ fontSize: 15 }}>Seu carrinho está vazio</p>
                  <button
                    onClick={() => setAberto(false)}
                    style={{ marginTop: 16, background: '#D4537E', color: '#fff', padding: '10px 24px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Ver cardápio
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {itens.map(item => (
                    <div key={item.produto.id} style={{ background: '#FDF8F0', borderRadius: 16, padding: 16, border: '1px solid #fce7f3' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 56, height: 56, background: '#FBEAF0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                          {item.produto.foto_url
                            ? <img src={item.produto.foto_url} alt={item.produto.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                            : '🍰'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, color: '#2C2C2A', fontSize: 14, margin: '0 0 2px' }}>{item.produto.nome}</p>
                          <p style={{ color: '#D4537E', fontWeight: 700, fontSize: 15, margin: '0 0 8px' }}>
                            R$ {(item.produto.preco * item.quantidade).toFixed(2).replace('.', ',')}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button
                                onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
                                style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #fce7f3', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4537E' }}
                              >
                                <Minus size={12} />
                              </button>
                              <span style={{ fontWeight: 700, fontSize: 14, minWidth: 20, textAlign: 'center' }}>{item.quantidade}</span>
                              <button
                                onClick={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
                                style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#D4537E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <button
                              onClick={() => removerItem(item.produto.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: 4 }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {itens.length > 0 && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid #fce7f3' }}>
                {prazoMaximo > 0 && (
                  <div style={{ background: '#FBEAF0', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#993556' }}>
                    ⏱ Prazo mínimo do pedido: <strong>{formatarPrazo(prazoMaximo)}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ color: '#6b7280', fontSize: 15 }}>Total</span>
                  <span style={{ color: '#D4537E', fontWeight: 800, fontSize: 22 }}>R$ {totalValor.toFixed(2).replace('.', ',')}</span>
                </div>

                <button
                  onClick={() => { setAberto(false); navigate('/checkout') }}
                  style={{ width: '100%', background: '#D4537E', color: '#fff', padding: '16px', borderRadius: 24, fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', marginBottom: 10 }}
                >
                  Finalizar pedido →
                </button>
                <button
                  onClick={() => { limparCarrinho(); setAberto(false) }}
                  style={{ width: '100%', background: 'transparent', color: '#9ca3af', padding: '10px', borderRadius: 24, fontWeight: 500, fontSize: 14, border: 'none', cursor: 'pointer' }}
                >
                  Limpar carrinho
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
