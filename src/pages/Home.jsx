import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ShoppingBag, Star, Leaf, Heart, ChevronDown, MessageCircle } from 'lucide-react'

function ProdutoCard({ produto, onPedir }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #fce7f3' }}>
      <div style={{ height: 200, background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {produto.foto_url ? (
          <img src={produto.foto_url} alt={produto.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 64 }}>🍰</span>
        )}
        {produto.destaque && (
          <div style={{ position: 'absolute', top: 12, left: 12, background: '#D4537E', color: '#fff', fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500 }}>
            Destaque
          </div>
        )}
      </div>
      <div style={{ padding: 20 }}>
        <h3 style={{ fontWeight: 700, color: '#2C2C2A', fontSize: 18, marginBottom: 4 }}>{produto.nome}</h3>
        {produto.descricao && (
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>{produto.descricao}</p>
        )}
        {produto.ingredientes_destaque?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {produto.ingredientes_destaque.map(tag => (
              <span key={tag} style={{ background: '#FBEAF0', color: '#993556', fontSize: 12, padding: '3px 10px', borderRadius: 20 }}>{tag}</span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ color: '#D4537E', fontWeight: 700, fontSize: 20 }}>
            R$ {produto.preco?.toFixed(2).replace('.', ',')}
          </span>
          <button
            onClick={onPedir}
            style={{ background: '#D4537E', color: '#fff', padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ShoppingBag size={14} />
            Pedir
          </button>
        </div>
      </div>
    </div>
  )
}

const depoimentosFallback = [
  { nome: 'Ana Lima', texto: 'Melhor brigadeiro fit que já comi! Não acredito que não tem açúcar.', nota: 5 },
  { nome: 'Carlos M.', texto: 'Pedi para o aniversário da minha filha. Todo mundo amou!', nota: 5 },
  { nome: 'Patrícia S.', texto: 'Finalmente um docinho que posso comer sem culpa. Vício garantido!', nota: 5 },
]

const iconeInstagram = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)

export default function Home() {
  const [produtos, setProdutos] = useState([])
  const [avaliacoes, setAvaliacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const whatsapp = '5562999049716'
  const instagram = 'https://instagram.com/tufitdelicias'

  useEffect(() => {
    async function buscarDados() {
      const [{ data: prods }, { data: avs }] = await Promise.all([
        supabase.from('produtos').select('*').eq('destaque', true).eq('ativo', true).limit(6),
        supabase.from('avaliacoes').select('*').eq('publicar', true).limit(6)
      ])
      setProdutos(prods || [])
      setAvaliacoes(avs || [])
      setLoading(false)
    }
    buscarDados()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#FDF8F0', fontFamily: 'Inter, sans-serif' }}>

      <nav style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #fce7f3' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, background: '#D4537E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={16} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontWeight: 700, color: '#993556', fontSize: 18 }}>Tufit Delícias</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#cardapio" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>Cardápio</a>
            <a href="#sobre" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>Sobre</a>
            <a href="#avaliacoes" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>Avaliações</a>
          </div>
          <button
            onClick={() => navigate('/cardapio')}
            style={{ background: '#D4537E', color: '#fff', padding: '10px 20px', borderRadius: 24, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ShoppingBag size={16} />
            Fazer pedido
          </button>
        </div>
      </nav>

      <section style={{ background: 'linear-gradient(135deg, #FBEAF0 0%, #FDF8F0 50%, #FFF5E6 100%)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FBEAF0', color: '#993556', padding: '8px 16px', borderRadius: 24, fontSize: 14, fontWeight: 500, marginBottom: 24 }}>
              <Leaf size={14} />
              Sem açúcar · Sem glúten · Sem lactose
            </div>
            <h1 style={{ fontSize: 52, fontWeight: 800, color: '#2C2C2A', lineHeight: 1.15, marginBottom: 16 }}>
              Doces sem culpa,{' '}
              <span style={{ color: '#D4537E' }}>com muito sabor</span>
            </h1>
            <p style={{ color: '#6b7280', fontSize: 18, marginBottom: 32, lineHeight: 1.7 }}>
              Confeitaria artesanal fit, feita com ingredientes selecionados para você aproveitar sem abrir mão da saúde.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/cardapio')}
                style={{ background: '#D4537E', color: '#fff', padding: '16px 32px', borderRadius: 32, fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(212,83,126,0.3)' }}
              >
                <ShoppingBag size={20} />
                Ver cardápio completo
              </button>
              <a
                href={'https://wa.me/' + whatsapp}
                target="_blank"
                rel="noreferrer"
                style={{ border: '2px solid #D4537E', color: '#D4537E', padding: '16px 32px', borderRadius: 32, fontWeight: 600, fontSize: 16, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <MessageCircle size={20} />
                Falar no WhatsApp
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginTop: 40 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: 28, color: '#D4537E', margin: 0 }}>200+</p>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Clientes felizes</p>
              </div>
              <div style={{ width: 1, height: 40, background: '#f9a8d4' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: 28, color: '#D4537E', margin: 0 }}>100%</p>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Artesanal</p>
              </div>
              <div style={{ width: 1, height: 40, background: '#f9a8d4' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: 28, color: '#D4537E', margin: 0 }}>0g</p>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Açúcar refinado</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 380, height: 380, background: '#FBEAF0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ width: 280, height: 280, background: '#F4C0D1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 100 }}>🍰</span>
              </div>
              <div style={{ position: 'absolute', top: 20, right: 10, background: '#fff', borderRadius: 16, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Avaliação</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={14} color="#facc15" fill="#facc15" />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>5.0</span>
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 40, left: -10, background: '#fff', borderRadius: 16, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: 12, color: '#D4537E', fontWeight: 500, margin: 0 }}>✓ Sem açúcar</p>
                <p style={{ fontSize: 12, color: '#D4537E', fontWeight: 500, margin: 0 }}>✓ Sem glúten</p>
                <p style={{ fontSize: 12, color: '#D4537E', fontWeight: 500, margin: 0 }}>✓ Sem lactose</p>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 48 }}>
          <a href="#cardapio" style={{ color: '#D4537E' }}>
            <ChevronDown size={32} />
          </a>
        </div>
      </section>

      <section style={{ background: '#D4537E', padding: '14px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex' }}>
          {['Sem açúcar', 'Sem glúten', 'Sem lactose', 'Artesanal', 'Fit', 'Saudável', 'Delicioso', 'Feito com amor', 'Sem açúcar', 'Sem glúten', 'Sem lactose', 'Artesanal'].map((tag, i) => (
            <span key={i} style={{ color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', padding: '0 24px', fontSize: 15 }}>✦ {tag}</span>
          ))}
        </div>
      </section>

      <section id="cardapio" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ color: '#D4537E', fontWeight: 500, fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 }}>Nossos produtos</span>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: '#2C2C2A', margin: '8px 0' }}>Em destaque</h2>
            <p style={{ color: '#9ca3af', maxWidth: 400, margin: '0 auto' }}>Selecionamos os queridinhos dos nossos clientes para você experimentar</p>
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ background: '#fff', borderRadius: 20, padding: 16 }}>
                  <div style={{ height: 200, background: '#fce7f3', borderRadius: 12, marginBottom: 16 }} />
                  <div style={{ height: 16, background: '#e5e7eb', borderRadius: 8, marginBottom: 8 }} />
                  <div style={{ height: 12, background: '#f3f4f6', borderRadius: 8, width: '60%' }} />
                </div>
              ))}
            </div>
          ) : produtos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {produtos.map(produto => (
                <ProdutoCard key={produto.id} produto={produto} onPedir={() => navigate('/pedido/' + produto.id)} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🍰</div>
              <p style={{ color: '#9ca3af', fontSize: 16 }}>Produtos em breve!</p>
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button
              onClick={() => navigate('/cardapio')}
              style={{ border: '2px solid #D4537E', color: '#D4537E', padding: '14px 32px', borderRadius: 32, fontWeight: 600, fontSize: 15, background: 'transparent', cursor: 'pointer' }}
            >
              Ver cardápio completo →
            </button>
          </div>
        </div>
      </section>

      <section id="sobre" style={{ padding: '80px 24px', background: '#FBEAF0' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 280, height: 280, background: '#F4C0D1', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 96, boxShadow: '0 20px 60px rgba(212,83,126,0.2)' }}>
              👩‍🍳
            </div>
          </div>
          <div>
            <span style={{ color: '#D4537E', fontWeight: 500, fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 }}>Nossa história</span>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#2C2C2A', margin: '8px 0 16px' }}>Feito com amor e cuidado</h2>
            <p style={{ color: '#6b7280', lineHeight: 1.8, marginBottom: 16 }}>
              A Tufit Delícias nasceu da paixão por criar doces que todo mundo possa aproveitar — sem restrições, sem culpa, com muito sabor.
            </p>
            <p style={{ color: '#6b7280', lineHeight: 1.8, marginBottom: 24 }}>
              Cada receita é desenvolvida com ingredientes selecionados, sem açúcar refinado, sem glúten e sem lactose. Porque cuidar da saúde não precisa ser sinônimo de abrir mão dos prazeres da vida.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {['Sem açúcar refinado', 'Sem glúten', 'Sem lactose', 'Ingredientes naturais', 'Feito artesanalmente'].map(tag => (
                <span key={tag} style={{ background: '#fff', color: '#993556', padding: '8px 16px', borderRadius: 24, fontSize: 13, fontWeight: 500, border: '1px solid #f9a8d4' }}>
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="avaliacoes" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ color: '#D4537E', fontWeight: 500, fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 }}>Depoimentos</span>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: '#2C2C2A', margin: '8px 0' }}>O que nossos clientes dizem</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {(avaliacoes.length > 0 ? avaliacoes : depoimentosFallback).map((av, i) => (
              <div key={av.id || i} style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #fce7f3', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={16} color={s <= av.nota ? '#facc15' : '#e5e7eb'} fill={s <= av.nota ? '#facc15' : '#e5e7eb'} />
                  ))}
                </div>
                <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>"{av.comentario || av.texto}"</p>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#993556', margin: 0 }}>— {av.nome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 24px', background: '#D4537E' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Pronta para fazer seu pedido?</h2>
          <p style={{ color: '#fce7f3', fontSize: 18, marginBottom: 32 }}>Escolha seus doces favoritos e encomendar nunca foi tão fácil</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/cardapio')}
              style={{ background: '#fff', color: '#D4537E', padding: '16px 32px', borderRadius: 32, fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
            >
              Ver cardápio
            </button>
            <a
              href={'https://wa.me/' + whatsapp}
              target="_blank"
              rel="noreferrer"
              style={{ border: '2px solid #fff', color: '#fff', padding: '16px 32px', borderRadius: 32, fontWeight: 700, fontSize: 16, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <MessageCircle size={20} />
              WhatsApp
            </a>
            <a
              href={instagram}
              target="_blank"
              rel="noreferrer"
              style={{ border: '2px solid #fff', color: '#fff', padding: '16px 32px', borderRadius: 32, fontWeight: 700, fontSize: 16, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {iconeInstagram}
              Instagram
            </a>
          </div>
        </div>
      </section>

      <footer style={{ background: '#2C2C2A', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, background: '#D4537E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={12} color="#fff" fill="#fff" />
            </div>
            <span style={{ color: '#fff', fontWeight: 600 }}>Tufit Delícias</span>
          </div>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>Goiânia - GO · Feito com amor 💕</p>
          <a
            href={instagram}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#9ca3af', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {iconeInstagram}
            @tufitdelicias
          </a>
        </div>
      </footer>

    </div>
  )
}
