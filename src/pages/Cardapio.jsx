import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ShoppingBag, Heart, Search, Filter, ChevronDown, MessageCircle, ArrowLeft } from 'lucide-react'

const iconeInstagram = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)

const produtosMock = [
  { id: '1', nome: 'Brigadeiro Fit', descricao: 'Brigadeiro cremoso sem açúcar refinado, feito com cacau 70% e adoçante natural.', preco: 4.50, categoria_id: 'docinhos', ingredientes_destaque: ['Sem açúcar', 'Sem glúten'], destaque: true, ativo: true, prazo_minimo_horas: 4 },
  { id: '2', nome: 'Cupcake Zero', descricao: 'Cupcake fofinho sem glúten e sem lactose com cobertura de cream cheese fit.', preco: 8.00, categoria_id: 'bolos', ingredientes_destaque: ['Sem glúten', 'Sem lactose'], destaque: true, ativo: true, prazo_minimo_horas: 8 },
  { id: '3', nome: 'Bolo de Cenoura Fit', descricao: 'Bolo integral de cenoura com cobertura de chocolate meio amargo. Rende 10 fatias.', preco: 45.00, categoria_id: 'bolos', ingredientes_destaque: ['Integral', 'Sem lactose'], destaque: false, ativo: true, prazo_minimo_horas: 24 },
  { id: '4', nome: 'Torta de Morango', descricao: 'Torta com base de aveia, recheio de cream cheese fit e morangos frescos.', preco: 65.00, categoria_id: 'tortas', ingredientes_destaque: ['Sem açúcar', 'Sem glúten'], destaque: true, ativo: true, prazo_minimo_horas: 48 },
  { id: '5', nome: 'Cookies de Aveia', descricao: 'Cookies crocantes de aveia com gotas de chocolate 70%. Pacote com 6 unidades.', preco: 18.00, categoria_id: 'docinhos', ingredientes_destaque: ['Integral', 'Sem lactose'], destaque: false, ativo: true, prazo_minimo_horas: 4 },
  { id: '6', nome: 'Bolo Decorado Fit', descricao: 'Bolo personalizado para festas, sem açúcar e sem glúten. Consulte sabores disponíveis.', preco: 120.00, categoria_id: 'bolos', ingredientes_destaque: ['Sem açúcar', 'Sem glúten', 'Personalizado'], destaque: true, ativo: true, prazo_minimo_horas: 120 },
]

const categoriasMock = [
  { id: 'todos', nome: 'Todos' },
  { id: 'docinhos', nome: 'Docinhos' },
  { id: 'bolos', nome: 'Bolos' },
  { id: 'tortas', nome: 'Tortas' },
]

function formatarPrazo(horas) {
  if (horas < 24) return horas + 'h de antecedência'
  const dias = Math.floor(horas / 24)
  return dias + (dias === 1 ? ' dia de antecedência' : ' dias de antecedência')
}

function ProdutoCard({ produto, onPedir }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid #fce7f3',
        transition: 'all 0.2s',
        transform: hover ? 'translateY(-4px)' : 'none',
        boxShadow: hover ? '0 12px 32px rgba(212,83,126,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ height: 200, background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {produto.foto_url ? (
          <img src={produto.foto_url} alt={produto.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', transform: hover ? 'scale(1.05)' : 'scale(1)' }} />
        ) : (
          <span style={{ fontSize: 64 }}>🍰</span>
        )}
        {produto.destaque && (
          <div style={{ position: 'absolute', top: 12, left: 12, background: '#D4537E', color: '#fff', fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
            ⭐ Destaque
          </div>
        )}
        <div style={{ position: 'absolute', top: 12, right: 12, background: '#fff', borderRadius: 10, padding: '4px 10px', fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
          ⏱ {formatarPrazo(produto.prazo_minimo_horas)}
        </div>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ fontWeight: 700, color: '#2C2C2A', fontSize: 17, marginBottom: 6 }}>{produto.nome}</h3>
        {produto.descricao && (
          <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6, marginBottom: 12, flex: 1 }}>{produto.descricao}</p>
        )}
        {produto.ingredientes_destaque?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
            {produto.ingredientes_destaque.map(tag => (
              <span key={tag} style={{ background: '#FBEAF0', color: '#993556', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>{tag}</span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{ color: '#D4537E', fontWeight: 800, fontSize: 22 }}>
            R$ {produto.preco?.toFixed(2).replace('.', ',')}
          </span>
          <button
            onClick={() => onPedir(produto)}
            style={{ background: '#D4537E', color: '#fff', padding: '10px 20px', borderRadius: 24, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#993556'}
            onMouseLeave={e => e.currentTarget.style.background = '#D4537E'}
          >
            <ShoppingBag size={14} />
            Pedir
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Cardapio() {
  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todos')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const whatsapp = '5562999049716'

  useEffect(() => {
    async function buscarDados() {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from('produtos').select('*').eq('ativo', true).order('destaque', { ascending: false }),
        supabase.from('categorias').select('*').eq('ativo', true).order('ordem')
      ])
      if (prods && prods.length > 0) {
        setProdutos(prods)
        const todasCats = [{ id: 'todos', nome: 'Todos' }, ...(cats || [])]
        setCategorias(todasCats)
      } else {
        setProdutos(produtosMock)
        setCategorias(categoriasMock)
      }
      setLoading(false)
    }
    buscarDados()
  }, [])

  const produtosFiltrados = produtos.filter(p => {
    const passaCategoria = categoriaSelecionada === 'todos' || p.categoria_id === categoriaSelecionada
    const passaBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.descricao?.toLowerCase().includes(busca.toLowerCase())
    return passaCategoria && passaBusca
  })

  function handlePedir(produto) {
    navigate('/pedido/' + produto.id)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDF8F0', fontFamily: 'Inter, sans-serif' }}>

      <nav style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #fce7f3' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}
            >
              <ArrowLeft size={18} />
              Voltar
            </button>
            <div style={{ width: 1, height: 20, background: '#fce7f3' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, background: '#D4537E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={14} color="#fff" fill="#fff" />
              </div>
              <span style={{ fontWeight: 700, color: '#993556', fontSize: 16 }}>Tufit Delícias</span>
            </div>
          </div>
          <a
            href={'https://wa.me/' + whatsapp}
            target="_blank"
            rel="noreferrer"
            style={{ background: '#D4537E', color: '#fff', padding: '10px 20px', borderRadius: 24, fontSize: 14, fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <MessageCircle size={16} />
            Dúvidas? WhatsApp
          </a>
        </div>
      </nav>

      <section style={{ background: 'linear-gradient(135deg, #FBEAF0 0%, #FDF8F0 100%)', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ color: '#D4537E', fontWeight: 500, fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 }}>Cardápio completo</span>
            <h1 style={{ fontSize: 40, fontWeight: 800, color: '#2C2C2A', margin: '8px 0' }}>Escolha seus favoritos</h1>
            <p style={{ color: '#9ca3af', fontSize: 16 }}>Todos feitos com amor, sem açúcar, sem glúten e sem lactose</p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 280, maxWidth: 400 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: 24, border: '1px solid #fce7f3', background: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoriaSelecionada(cat.id)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 24,
                  border: '1.5px solid',
                  borderColor: categoriaSelecionada === cat.id ? '#D4537E' : '#fce7f3',
                  background: categoriaSelecionada === cat.id ? '#D4537E' : '#fff',
                  color: categoriaSelecionada === cat.id ? '#fff' : '#6b7280',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {cat.nome}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 24px 80px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
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
          ) : produtosFiltrados.length > 0 ? (
            <>
              <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>
                {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''} encontrado{produtosFiltrados.length !== 1 ? 's' : ''}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                {produtosFiltrados.map(produto => (
                  <ProdutoCard key={produto.id} produto={produto} onPedir={handlePedir} />
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
              <h3 style={{ color: '#2C2C2A', fontWeight: 700, marginBottom: 8 }}>Nenhum produto encontrado</h3>
              <p style={{ color: '#9ca3af' }}>Tente buscar por outro nome ou categoria</p>
              <button
                onClick={() => { setBusca(''); setCategoriaSelecionada('todos') }}
                style={{ marginTop: 16, background: '#D4537E', color: '#fff', padding: '12px 24px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 500 }}
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </section>

      <section style={{ background: '#FBEAF0', padding: '40px 24px', borderTop: '1px solid #fce7f3' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 16, color: '#993556', fontWeight: 600, marginBottom: 8 }}>Não encontrou o que procura?</p>
          <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 14 }}>Entre em contato pelo WhatsApp e faça seu pedido personalizado!</p>
          <a
            href={'https://wa.me/' + whatsapp + '?text=Olá! Gostaria de fazer um pedido personalizado na Tufit Delícias 🍰'}
            target="_blank"
            rel="noreferrer"
            style={{ background: '#D4537E', color: '#fff', padding: '14px 32px', borderRadius: 32, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <MessageCircle size={18} />
            Pedir pelo WhatsApp
          </a>
        </div>
      </section>

      <footer style={{ background: '#2C2C2A', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, background: '#D4537E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={12} color="#fff" fill="#fff" />
            </div>
            <span style={{ color: '#fff', fontWeight: 600 }}>Tufit Delícias</span>
          </div>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>Goiânia - GO · Feito com amor 💕</p>
          <a
            href="https://instagram.com/tufitdelicias"
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
