import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCarrinho } from '../contexts/CarrinhoContext'
import { BotaoTabelaNutricional } from '../components/TabelaNutricional'
import { ShoppingBag, Star, Clock, ChevronRight, Heart, Leaf, Award } from 'lucide-react'

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

  .tufit-home {
    font-family: 'Lato', sans-serif;
    background: ${CORES.creme};
    color: ${CORES.texto};
    min-height: 100vh;
  }

  .tufit-home h1, .tufit-home h2, .tufit-home h3 {
    font-family: 'Playfair Display', serif;
  }

  /* Navbar */
  .navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(253, 246, 238, 0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid ${CORES.cremeMedio};
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .navbar-logo {
    height: 42px;
    object-fit: contain;
  }

  .navbar-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .btn-carrinho {
    position: relative;
    background: ${CORES.rosa};
    color: white;
    border: none;
    border-radius: 24px;
    padding: 10px 20px;
    font-family: 'Lato', sans-serif;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(201, 79, 124, 0.3);
  }

  .btn-carrinho:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(201, 79, 124, 0.4); }

  .badge-qtd {
    background: white;
    color: ${CORES.rosa};
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 11px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Hero */
  .hero {
    position: relative;
    background: linear-gradient(135deg, ${CORES.cremeMedio} 0%, ${CORES.rosaClaro} 100%);
    padding: 60px 24px 80px;
    overflow: hidden;
  }

  .hero::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -60px;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(201,79,124,0.12) 0%, transparent 70%);
    border-radius: 50%;
  }

  .hero::after {
    content: '';
    position: absolute;
    bottom: -40px;
    left: -40px;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(201,145,58,0.10) 0%, transparent 70%);
    border-radius: 50%;
  }

  .hero-inner {
    max-width: 500px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    text-align: center;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: white;
    color: ${CORES.verde};
    border: 1.5px solid #C8E6C9;
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .hero-titulo {
    font-size: clamp(32px, 8vw, 48px);
    font-weight: 700;
    color: ${CORES.marrom};
    line-height: 1.15;
    margin-bottom: 16px;
  }

  .hero-titulo em {
    color: ${CORES.rosa};
    font-style: italic;
  }

  .hero-subtitulo {
    font-size: 16px;
    color: ${CORES.textoClaro};
    line-height: 1.6;
    margin-bottom: 32px;
    font-weight: 300;
  }

  .hero-foto {
    width: 130px;
    height: 130px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid white;
    box-shadow: 0 8px 30px rgba(201,79,124,0.2);
    margin: 0 auto 20px;
    display: block;
  }

  .hero-nome {
    font-size: 14px;
    color: ${CORES.textoClaro};
    font-style: italic;
  }

  .hero-nome strong {
    color: ${CORES.marrom};
    font-style: normal;
    font-weight: 700;
  }

  .hero-cta {
    background: ${CORES.rosa};
    color: white;
    border: none;
    border-radius: 28px;
    padding: 16px 36px;
    font-family: 'Lato', sans-serif;
    font-weight: 700;
    font-size: 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
    box-shadow: 0 6px 24px rgba(201,79,124,0.35);
    transition: all 0.25s;
  }

  .hero-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(201,79,124,0.45); }

  /* Diferenciais */
  .diferenciais {
    background: ${CORES.marrom};
    padding: 28px 24px;
    display: flex;
    justify-content: center;
    gap: 0;
    overflow-x: auto;
  }

  .diferencial-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 0 24px;
    border-right: 1px solid rgba(255,255,255,0.15);
    min-width: 90px;
    text-align: center;
  }

  .diferencial-item:last-child { border-right: none; }

  .diferencial-icon {
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .diferencial-texto {
    color: rgba(255,255,255,0.85);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }

  /* Destaques */
  .secao {
    padding: 48px 20px;
    max-width: 900px;
    margin: 0 auto;
  }

  .secao-header {
    text-align: center;
    margin-bottom: 36px;
  }

  .secao-pretitulo {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${CORES.rosa};
    margin-bottom: 8px;
  }

  .secao-titulo {
    font-size: clamp(24px, 5vw, 34px);
    color: ${CORES.marrom};
    line-height: 1.2;
  }

  .secao-titulo em { color: ${CORES.rosa}; }

  .secao-subtitulo {
    font-size: 15px;
    color: ${CORES.textoClaro};
    margin-top: 10px;
    font-weight: 300;
  }

  /* Cards de produto */
  .produtos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }

  .produto-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 2px 16px rgba(92,61,46,0.08);
    transition: all 0.3s;
    border: 1px solid rgba(92,61,46,0.06);
    cursor: pointer;
  }

  .produto-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(92,61,46,0.14);
  }

  .produto-foto-wrap {
    height: 190px;
    background: ${CORES.rosaClaro};
    position: relative;
    overflow: hidden;
  }

  .produto-foto {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s;
  }

  .produto-card:hover .produto-foto { transform: scale(1.06); }

  .produto-foto-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 56px;
  }

  .produto-destaque-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    background: ${CORES.dourado};
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 20px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .produto-corpo {
    padding: 18px;
  }

  .produto-nome {
    font-size: 16px;
    font-weight: 600;
    color: ${CORES.marrom};
    margin-bottom: 6px;
    font-family: 'Playfair Display', serif;
  }

  .produto-descricao {
    font-size: 13px;
    color: ${CORES.textoClaro};
    line-height: 1.5;
    margin-bottom: 12px;
    font-weight: 300;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .produto-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 12px;
  }

  .produto-tag {
    background: ${CORES.rosaClaro};
    color: ${CORES.rosa};
    font-size: 10px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .produto-rodape {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
  }

  .produto-preco {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 700;
    color: ${CORES.rosa};
  }

  .produto-preco-label {
    font-size: 11px;
    color: ${CORES.textoClaro};
    margin-bottom: 2px;
    font-weight: 300;
  }

  .btn-pedir {
    background: ${CORES.rosa};
    color: white;
    border: none;
    border-radius: 20px;
    padding: 10px 18px;
    font-family: 'Lato', sans-serif;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }

  .btn-pedir:hover { background: ${CORES.marrom}; transform: scale(1.04); }

  .prazo-info {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: ${CORES.textoClaro};
    margin-top: 8px;
    font-weight: 300;
  }

  /* Sobre */
  .secao-sobre {
    background: linear-gradient(135deg, ${CORES.marrom} 0%, ${CORES.marromClaro} 100%);
    padding: 60px 24px;
  }

  .sobre-inner {
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
  }

  .sobre-foto {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255,255,255,0.3);
    margin: 0 auto 20px;
    display: block;
  }

  .sobre-titulo {
    font-size: 28px;
    color: white;
    margin-bottom: 16px;
  }

  .sobre-texto {
    font-size: 15px;
    color: rgba(255,255,255,0.8);
    line-height: 1.7;
    font-weight: 300;
  }

  .sobre-texto strong { color: white; }

  .sobre-destaques {
    display: flex;
    justify-content: center;
    gap: 32px;
    margin-top: 36px;
    flex-wrap: wrap;
  }

  .sobre-destaque-item {
    text-align: center;
  }

  .sobre-destaque-num {
    font-family: 'Playfair Display', serif;
    font-size: 36px;
    font-weight: 700;
    color: ${CORES.rosaMedio};
  }

  .sobre-destaque-txt {
    font-size: 12px;
    color: rgba(255,255,255,0.7);
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
  }

  /* Footer */
  .footer {
    background: ${CORES.texto};
    padding: 40px 24px;
    text-align: center;
  }

  .footer-logo {
    height: 36px;
    object-fit: contain;
    margin-bottom: 16px;
    opacity: 0.8;
  }

  .footer-texto {
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    line-height: 1.6;
    font-weight: 300;
  }

  .footer-texto strong { color: rgba(255,255,255,0.8); }

  /* Botão ver mais */
  .btn-ver-mais {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 36px auto 0;
    background: transparent;
    color: ${CORES.rosa};
    border: 2px solid ${CORES.rosa};
    border-radius: 28px;
    padding: 14px 32px;
    font-family: 'Lato', sans-serif;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.2s;
    width: fit-content;
  }

  .btn-ver-mais:hover {
    background: ${CORES.rosa};
    color: white;
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
    box-shadow: 0 24px 60px rgba(0,0,0,0.5);
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
    text-shadow: 0 2px 8px rgba(0,0,0,0.6);
  }

  @media (max-width: 480px) {
    .diferenciais { gap: 0; justify-content: flex-start; }
    .diferencial-item { min-width: 80px; padding: 0 16px; }
    .sobre-destaques { gap: 24px; }
    .btn-pedir span { display: none; }
  }
`

function ProdutoCard({ produto, onPedir }) {
  const [fotoAberta, setFotoAberta] = useState(false)

  const prazo = produto.prazo_minimo_horas
  const prazoTexto = prazo ? (prazo < 24 ? `${prazo}h de antecedência` : `${Math.floor(prazo / 24)} dia(s) de antecedência`) : null

  return (
    <>
      {fotoAberta && produto.foto_url && (
        <div className="foto-modal" onClick={() => setFotoAberta(false)}>
          <img src={produto.foto_url} alt={produto.nome} />
          <button className="foto-modal-fechar" onClick={() => setFotoAberta(false)}>✕</button>
          <div className="foto-modal-nome">{produto.nome}</div>
        </div>
      )}

      <div className="produto-card">
        <div className="produto-foto-wrap" onClick={() => produto.foto_url && setFotoAberta(true)} style={{ cursor: produto.foto_url ? 'zoom-in' : 'default' }}>
          {produto.foto_url
            ? <img src={produto.foto_url} alt={produto.nome} className="produto-foto" />
            : <div className="produto-foto-placeholder">🍰</div>
          }
          {produto.destaque && (
            <div className="produto-destaque-badge">
              <Star size={10} fill="white" /> Destaque
            </div>
          )}
        </div>

        <div className="produto-corpo">
          <div className="produto-nome">{produto.nome}</div>
          {produto.descricao && <div className="produto-descricao">{produto.descricao}</div>}

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
            <div>
              <div className="produto-preco-label">a partir de</div>
              <div className="produto-preco">R$ {produto.preco?.toFixed(2).replace('.', ',')}</div>
            </div>
            <button className="btn-pedir" onClick={() => onPedir(produto)}>
              <ShoppingBag size={15} />
              <span>Pedir</span>
            </button>
          </div>

          {prazoTexto && (
            <div className="prazo-info">
              <Clock size={11} />
              {prazoTexto}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function Home() {
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { adicionarItem, itens } = useCarrinho()

  const totalCarrinho = itens.reduce((acc, i) => acc + i.quantidade, 0)

  useEffect(() => {
    supabase
      .from('produtos')
      .select('*')
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProdutos(data || [])
        setLoading(false)
      })
  }, [])

  function handlePedir(produto) {
    adicionarItem(produto)
    navigate('/cardapio')
  }

  const destaques = produtos.filter(p => p.destaque).slice(0, 4)
  const exibirProdutos = destaques.length > 0 ? destaques : produtos.slice(0, 4)

  return (
    <>
      <style>{estilos}</style>
      <div className="tufit-home">

        {/* Navbar */}
        <nav className="navbar">
          <img src="/logo.png" alt="Tufit Delícias" className="navbar-logo" onError={e => { e.target.style.display = 'none' }} />
          <div className="navbar-actions">
            <button className="btn-carrinho" onClick={() => navigate('/cardapio')}>
              <ShoppingBag size={16} />
              Cardápio
              {totalCarrinho > 0 && <span className="badge-qtd">{totalCarrinho}</span>}
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero">
          <div className="hero-inner">
            <img src="/thainara.png" alt="Thainara" className="hero-foto" onError={e => { e.target.style.display = 'none' }} />

            <div className="hero-badge">
              <Leaf size={12} /> 100% Fit & Artesanal
            </div>

            <h1 className="hero-titulo">
              Doces que fazem <em>bem</em> para a alma
            </h1>

            <p className="hero-subtitulo">
              Receitas sem açúcar, sem glúten e sem lactose, feitas com carinho e ingredientes de qualidade — porque você merece se deliciar sem culpa.
            </p>

            <div className="hero-nome">
              Feito com amor por <strong>Thainara Chagas</strong>
            </div>

            <button className="hero-cta" onClick={() => navigate('/cardapio')}>
              Ver cardápio completo
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        {/* Diferenciais */}
        <div className="diferenciais">
          {[
            { icon: '🌿', texto: 'Sem açúcar' },
            { icon: '🌾', texto: 'Sem glúten' },
            { icon: '🥛', texto: 'Sem lactose' },
            { icon: '💛', texto: 'Artesanal' },
            { icon: '🚚', texto: 'Entregamos' },
          ].map(d => (
            <div key={d.texto} className="diferencial-item">
              <div className="diferencial-icon">{d.icon}</div>
              <div className="diferencial-texto">{d.texto}</div>
            </div>
          ))}
        </div>

        {/* Produtos em destaque */}
        <section className="secao">
          <div className="secao-header">
            <div className="secao-pretitulo">✦ Nossos favoritos ✦</div>
            <h2 className="secao-titulo">Produtos em <em>destaque</em></h2>
            <p className="secao-subtitulo">Feitos fresquinhos, entregues com amor</p>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ background: 'white', borderRadius: 20, height: 320, opacity: 0.5, animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : (
            <>
              <div className="produtos-grid">
                {exibirProdutos.map(p => (
                  <ProdutoCard key={p.id} produto={p} onPedir={handlePedir} />
                ))}
              </div>
              {produtos.length > 4 && (
                <button className="btn-ver-mais" onClick={() => navigate('/cardapio')}>
                  Ver todos os {produtos.length} produtos
                  <ChevronRight size={18} />
                </button>
              )}
            </>
          )}
        </section>

        {/* Sobre */}
        <section className="secao-sobre">
          <div className="sobre-inner">
            <img src="/thainara.png" alt="Thainara" className="sobre-foto" onError={e => { e.target.style.display = 'none' }} />
            <h2 className="sobre-titulo">Nossa história</h2>
            <p className="sobre-texto">
              A <strong>Tufit Delícias</strong> nasceu do desejo de provar que comida saudável pode ser <strong>deliciosa</strong>. Cada receita é desenvolvida com cuidado para que você possa se presentear sem abrir mão da saúde — sem açúcar refinado, sem glúten e sem lactose.
            </p>
            <div className="sobre-destaques">
              <div className="sobre-destaque-item">
                <div className="sobre-destaque-num">100%</div>
                <div className="sobre-destaque-txt">Artesanal</div>
              </div>
              <div className="sobre-destaque-item">
                <div className="sobre-destaque-num">0g</div>
                <div className="sobre-destaque-txt">Açúcar refinado</div>
              </div>
              <div className="sobre-destaque-item">
                <div className="sobre-destaque-num">❤️</div>
                <div className="sobre-destaque-txt">Com amor</div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <img src="/logo.png" alt="Tufit Delícias" className="footer-logo" onError={e => { e.target.style.display = 'none' }} />
          <p className="footer-texto">
            <strong>Tufit Delícias</strong> · Goiânia, GO<br />
            Feito com carinho por Thainara Chagas<br />
            <span style={{ marginTop: 6, display: 'block' }}>Pedidos pelo site ou WhatsApp</span>
          </p>
        </footer>

      </div>
    </>
  )
}
