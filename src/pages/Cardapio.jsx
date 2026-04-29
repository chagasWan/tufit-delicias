import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCarrinho } from '../contexts/CarrinhoContext'
import { BotaoTabelaNutricional } from '../components/TabelaNutricional'
import { ShoppingBag, Search, X, Star, Clock, ChevronLeft, Filter } from 'lucide-react'

const CORES = {
  rosa: '#C94F7C',
  rosaClaro: '#FBEAF0',
  rosaMedio: '#F2A7C3',
  creme: '#FDF6EE',
  cremeMedio: '#F5E6D3',
  marrom: '#5C3D2E',
  marromClaro: '#8B6355',
  verde: '#4A7C59',
  dourado: '#C9913A',
  texto: '#2C1810',
  textoClaro: '#7A5C4F',
}

const estilos = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .cardapio-page {
    font-family: 'Lato', sans-serif;
    background: ${CORES.creme};
    color: ${CORES.texto};
    min-height: 100vh;
  }

  .cardapio-page h1, .cardapio-page h2, .cardapio-page h3 {
    font-family: 'Playfair Display', serif;
  }

  /* Navbar */
  .navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(253,246,238,0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid ${CORES.cremeMedio};
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .btn-voltar {
    background: white;
    border: 1.5px solid ${CORES.cremeMedio};
    border-radius: 50%;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: ${CORES.marrom};
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .btn-voltar:hover { background: ${CORES.rosaClaro}; border-color: ${CORES.rosa}; }

  .navbar-logo {
    height: 36px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .navbar-titulo {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    color: ${CORES.marrom};
    flex: 1;
  }

  .btn-carrinho {
    position: relative;
    background: ${CORES.rosa};
    color: white;
    border: none;
    border-radius: 24px;
    padding: 9px 16px;
    font-family: 'Lato', sans-serif;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 7px;
    transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(201,79,124,0.3);
    flex-shrink: 0;
  }

  .btn-carrinho:hover { transform: translateY(-1px); }

  .badge-qtd {
    background: white;
    color: ${CORES.rosa};
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 10px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Busca e filtros */
  .busca-wrap {
    background: white;
    border-bottom: 1px solid ${CORES.cremeMedio};
    padding: 14px 20px;
  }

  .busca-input-wrap {
    position: relative;
    margin-bottom: 14px;
  }

  .busca-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: ${CORES.textoClaro};
  }

  .busca-input {
    width: 100%;
    padding: 11px 14px 11px 42px;
    border-radius: 14px;
    border: 1.5px solid ${CORES.cremeMedio};
    background: ${CORES.creme};
    font-family: 'Lato', sans-serif;
    font-size: 14px;
    color: ${CORES.texto};
    outline: none;
    transition: border-color 0.2s;
  }

  .busca-input:focus { border-color: ${CORES.rosaMedio}; }
  .busca-input::placeholder { color: ${CORES.textoClaro}; }

  .busca-limpar {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: ${CORES.textoClaro};
    display: flex;
    align-items: center;
  }

  .categorias-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
  }

  .categorias-scroll::-webkit-scrollbar { display: none; }

  .cat-btn {
    white-space: nowrap;
    padding: 7px 16px;
    border-radius: 20px;
    border: 1.5px solid transparent;
    font-family: 'Lato', sans-serif;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    background: ${CORES.creme};
    color: ${CORES.textoClaro};
    border-color: ${CORES.cremeMedio};
  }

  .cat-btn.ativo {
    background: ${CORES.rosa};
    color: white;
    border-color: ${CORES.rosa};
  }

  /* Grid de produtos */
  .produtos-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 24px 16px;
  }

  .resultados-texto {
    font-size: 13px;
    color: ${CORES.textoClaro};
    margin-bottom: 20px;
    font-weight: 300;
  }

  .resultados-texto strong { color: ${CORES.marrom}; }

  .produtos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 18px;
  }

  /* Card */
  .produto-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 2px 14px rgba(92,61,46,0.07);
    transition: all 0.3s;
    border: 1px solid rgba(92,61,46,0.06);
  }

  .produto-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 28px rgba(92,61,46,0.13);
  }

  .produto-foto-wrap {
    height: 180px;
    background: ${CORES.rosaClaro};
    position: relative;
    overflow: hidden;
  }

  .produto-foto {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s;
    cursor: zoom-in;
  }

  .produto-card:hover .produto-foto { transform: scale(1.05); }

  .produto-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 50px;
  }

  .destaque-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: ${CORES.dourado};
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .produto-corpo {
    padding: 16px;
  }

  .produto-nome {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 600;
    color: ${CORES.marrom};
    margin-bottom: 5px;
  }

  .produto-desc {
    font-size: 12px;
    color: ${CORES.textoClaro};
    line-height: 1.5;
    font-weight: 300;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .produto-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 10px;
  }

  .produto-tag {
    background: ${CORES.rosaClaro};
    color: ${CORES.rosa};
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .produto-rodape {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
  }

  .produto-preco {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: ${CORES.rosa};
  }

  .btn-adicionar {
    background: ${CORES.rosa};
    color: white;
    border: none;
    border-radius: 18px;
    padding: 9px 16px;
    font-family: 'Lato', sans-serif;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.2s;
  }

  .btn-adicionar:hover { background: ${CORES.marrom}; }
  .btn-adicionar.adicionado { background: #4A7C59; }

  .prazo-info {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: ${CORES.textoClaro};
    margin-top: 8px;
    font-weight: 300;
  }

  /* Vazio */
  .vazio {
    text-align: center;
    padding: 64px 24px;
    color: ${CORES.textoClaro};
  }

  .vazio-emoji { font-size: 56px; margin-bottom: 16px; }

  .vazio-titulo {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    color: ${CORES.marrom};
    margin-bottom: 8px;
  }

  /* Modal foto */
  .foto-modal {
    position: fixed;
    inset: 0;
    z-index: 500;
    background: rgba(0,0,0,0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    cursor: zoom-out;
  }

  .foto-modal img {
    max-width: 90vw;
    max-height: 85vh;
    border-radius: 16px;
    object-fit: contain;
  }

  .foto-modal-fechar {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255,255,255,0.15);
    border: none;
    border-radius: 50%;
    width: 42px;
    height: 42px;
    color: white;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .foto-modal-nome {
    position: absolute;
    bottom: 24px;
    left: 0;
    right: 0;
    text-align: center;
    color: white;
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-style: italic;
    text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }
`

function ProdutoCard({ produto, onAdicionar }) {
  const [fotoAberta, setFotoAberta] = useState(false)
  const [adicionado, setAdicionado] = useState(false)

  const prazo = produto.prazo_minimo_horas
  const prazoTexto = prazo ? (prazo < 24 ? `${prazo}h de antecedência` : `${Math.floor(prazo / 24)} dia(s)`) : null

  function handleAdicionar() {
    onAdicionar(produto)
    setAdicionado(true)
    setTimeout(() => setAdicionado(false), 1500)
  }

  return (
    <>
      {fotoAberta && produto.foto_url && (
        <div className="foto-modal" onClick={() => setFotoAberta(false)}>
          <img src={produto.foto_url} alt={produto.nome} />
          <button className="foto-modal-fechar">✕</button>
          <div className="foto-modal-nome">{produto.nome}</div>
        </div>
      )}

      <div className="produto-card">
        <div className="produto-foto-wrap">
          {produto.foto_url
            ? <img src={produto.foto_url} alt={produto.nome} className="produto-foto" onClick={() => setFotoAberta(true)} />
            : <div className="produto-placeholder">🍰</div>
          }
          {produto.destaque && (
            <div className="destaque-badge"><Star size={9} fill="white" /> Destaque</div>
          )}
        </div>

        <div className="produto-corpo">
          <div className="produto-nome">{produto.nome}</div>
          {produto.descricao && <div className="produto-desc">{produto.descricao}</div>}

          {produto.ingredientes_destaque?.length > 0 && (
            <div className="produto-tags">
              {produto.ingredientes_destaque.map(tag => (
                <span key={tag} className="produto-tag">{tag}</span>
              ))}
            </div>
          )}

          {produto.nutricao && Object.values(produto.nutricao).some(v => v > 0) && (
            <div style={{ marginBottom: 10 }}>
              <BotaoTabelaNutricional nutricao={produto.nutricao} nomeProduto={produto.nome} />
            </div>
          )}

          <div className="produto-rodape">
            <div className="produto-preco">R$ {produto.preco?.toFixed(2).replace('.', ',')}</div>
            <button className={`btn-adicionar ${adicionado ? 'adicionado' : ''}`} onClick={handleAdicionar}>
              <ShoppingBag size={13} />
              {adicionado ? '✓ Adicionado' : 'Adicionar'}
            </button>
          </div>

          {prazoTexto && (
            <div className="prazo-info">
              <Clock size={10} /> {prazoTexto}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function Cardapio() {
  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [busca, setBusca] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('todas')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { adicionarItem, itens } = useCarrinho()

  const totalCarrinho = itens.reduce((acc, i) => acc + i.quantidade, 0)

  useEffect(() => {
    Promise.all([
      supabase.from('produtos').select('*').eq('ativo', true).order('destaque', { ascending: false }).order('nome'),
      supabase.from('categorias').select('*').eq('ativo', true).order('ordem'),
    ]).then(([{ data: p }, { data: c }]) => {
      setProdutos(p || [])
      setCategorias(c || [])
      setLoading(false)
    })
  }, [])

  const filtrados = produtos.filter(p => {
    const buscaOk = !busca.trim() || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.descricao?.toLowerCase().includes(busca.toLowerCase())
    const catOk = categoriaAtiva === 'todas' || p.categoria_id === categoriaAtiva
    return buscaOk && catOk
  })

  return (
    <>
      <style>{estilos}</style>
      <div className="cardapio-page">

        {/* Navbar */}
        <nav className="navbar">
          <button className="btn-voltar" onClick={() => navigate('/')}>
            <ChevronLeft size={18} />
          </button>
          <span className="navbar-titulo">Cardápio</span>
          <button className="btn-carrinho" onClick={() => navigate('/checkout')}>
            <ShoppingBag size={15} />
            Meu pedido
            {totalCarrinho > 0 && <span className="badge-qtd">{totalCarrinho}</span>}
          </button>
        </nav>

        {/* Busca e filtros */}
        <div className="busca-wrap">
          <div className="busca-input-wrap">
            <Search size={16} className="busca-icon" />
            <input
              className="busca-input"
              placeholder="Buscar produto..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {busca && (
              <button className="busca-limpar" onClick={() => setBusca('')}>
                <X size={16} />
              </button>
            )}
          </div>

          {categorias.length > 0 && (
            <div className="categorias-scroll">
              <button
                className={`cat-btn ${categoriaAtiva === 'todas' ? 'ativo' : ''}`}
                onClick={() => setCategoriaAtiva('todas')}
              >
                Todos
              </button>
              {categorias.map(cat => (
                <button
                  key={cat.id}
                  className={`cat-btn ${categoriaAtiva === cat.id ? 'ativo' : ''}`}
                  onClick={() => setCategoriaAtiva(cat.id)}
                >
                  {cat.nome}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Produtos */}
        <div className="produtos-container">
          {!loading && (
            <p className="resultados-texto">
              <strong>{filtrados.length}</strong> {filtrados.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
              {busca && <> para "<strong>{busca}</strong>"</>}
            </p>
          )}

          {loading ? (
            <div className="produtos-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ background: 'white', borderRadius: 20, height: 300, opacity: 0.4 }} />
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="vazio">
              <div className="vazio-emoji">🍰</div>
              <div className="vazio-titulo">Nenhum produto encontrado</div>
              <p style={{ fontSize: 14 }}>Tente buscar com outros termos</p>
            </div>
          ) : (
            <div className="produtos-grid">
              {filtrados.map(p => (
                <ProdutoCard key={p.id} produto={p} onAdicionar={adicionarItem} />
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}
