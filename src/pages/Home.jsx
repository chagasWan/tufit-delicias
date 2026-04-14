import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ShoppingBag, Star, Leaf, Heart, ChevronDown, MessageCircle } from 'lucide-react'

function ProdutoCard({ produto, onPedir }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-pink-50 group">
      <div className="h-48 bg-[#FBEAF0] flex items-center justify-center relative overflow-hidden">
        {produto.foto_url ? (
          <img src={produto.foto_url} alt={produto.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <span className="text-6xl">🍰</span>
        )}
        {produto.destaque && (
          <div className="absolute top-3 left-3 bg-[#D4537E] text-white text-xs px-3 py-1 rounded-full font-medium">
            Destaque
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-bold text-[#2C2C2A] text-lg mb-1">{produto.nome}</h3>
        {produto.descricao && (
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{produto.descricao}</p>
        )}
        {produto.ingredientes_destaque?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {produto.ingredientes_destaque.map(tag => (
              <span key={tag} className="bg-[#FBEAF0] text-[#993556] text-xs px-2 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-4">
          <span className="text-[#D4537E] font-bold text-xl">
            R$ {produto.preco?.toFixed(2).replace('.', ',')}
          </span>
          <button
            onClick={onPedir}
            className="bg-[#D4537E] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#993556] transition-colors flex items-center gap-1"
          >
            <ShoppingBag size={14} />
            Pedir
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [produtos, setProdutos] = useState([])
  const [avaliacoes, setAvaliacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const whatsapp = '5562999999999'

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

  const depoimentosFallback = [
    { nome: 'Ana Lima', texto: 'Melhor brigadeiro fit que já comi! Não acredito que não tem açúcar.', nota: 5 },
    { nome: 'Carlos M.', texto: 'Pedi para o aniversário da minha filha. Todo mundo amou!', nota: 5 },
    { nome: 'Patrícia S.', texto: 'Finalmente um docinho que posso comer sem culpa. Vício garantido!', nota: 5 },
  ]

  return (
    <div className="min-h-screen bg-[#FDF8F0]">

      <nav className="bg-white/90 backdrop-blur-sm sticky top-0 z-50 border-b border-pink-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#D4537E] rounded-full flex items-center justify-center">
              <Heart size={16} className="text-white fill-white" />
            </div>
            <span className="font-bold text-[#993556] text-lg">Tufit Delícias</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#cardapio" className="hover:text-[#D4537E] transition-colors">Cardápio</a>
            <a href="#sobre" className="hover:text-[#D4537E] transition-colors">Sobre</a>
            <a href="#avaliacoes" className="hover:text-[#D4537E] transition-colors">Avaliações</a>
          </div>
          <button
            onClick={() => navigate('/cardapio')}
            className="bg-[#D4537E] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#993556] transition-colors flex items-center gap-2"
          >
            <ShoppingBag size={16} />
            Fazer pedido
          </button>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-[#FBEAF0] via-[#FDF8F0] to-[#FFF5E6] py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#FBEAF0] text-[#993556] px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Leaf size={14} />
              Sem açúcar · Sem glúten · Sem lactose
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#2C2C2A] leading-tight mb-4">
              Doces sem culpa,
              <span className="text-[#D4537E]"> com muito sabor</span>
            </h1>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Confeitaria artesanal fit, feita com ingredientes selecionados para você aproveitar sem abrir mão da saúde.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/cardapio')}
                className="bg-[#D4537E] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#993556] transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
              >
                <ShoppingBag size={20} />
                Ver cardápio completo
              </button>
              <a
                href={'https://wa.me/' + whatsapp}
                target="_blank"
                rel="noreferrer"
                className="border-2 border-[#D4537E] text-[#D4537E] px-8 py-4 rounded-full font-semibold hover:bg-[#FBEAF0] transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                Falar no WhatsApp
              </a>
            </div>
            <div className="flex items-center gap-6 mt-8">
              <div className="text-center">
                <p className="font-bold text-2xl text-[#D4537E]">200+</p>
                <p className="text-sm text-gray-500">Clientes felizes</p>
              </div>
              <div className="w-px h-10 bg-pink-200" />
              <div className="text-center">
                <p className="font-bold text-2xl text-[#D4537E]">100%</p>
                <p className="text-sm text-gray-500">Artesanal</p>
              </div>
              <div className="w-px h-10 bg-pink-200" />
              <div className="text-center">
                <p className="font-bold text-2xl text-[#D4537E]">0g</p>
                <p className="text-sm text-gray-500">Açúcar refinado</p>
              </div>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="w-72 h-72 md:w-96 md:h-96 bg-[#FBEAF0] rounded-full flex items-center justify-center relative">
              <div className="w-56 h-56 md:w-72 md:h-72 bg-[#F4C0D1] rounded-full flex items-center justify-center">
                <span className="text-8xl">🍰</span>
              </div>
              <div className="absolute top-4 right-4 bg-white rounded-2xl p-3 shadow-lg">
                <p className="text-xs text-gray-500">Avaliação</p>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-sm">5.0</span>
                </div>
              </div>
              <div className="absolute bottom-8 left-0 bg-white rounded-2xl p-3 shadow-lg">
                <p className="text-xs text-[#D4537E] font-medium">✓ Sem glúten</p>
                <p className="text-xs text-[#D4537E] font-medium">✓ Sem lactose</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-12">
          <a href="#cardapio" className="animate-bounce text-[#D4537E]">
            <ChevronDown size={32} />
          </a>
        </div>
      </section>

      <section className="bg-[#D4537E] py-4">
        <div className="max-w-6xl mx-auto flex gap-8 overflow-hidden">
          {['Sem açúcar', 'Sem glúten', 'Sem lactose', 'Artesanal', 'Fit', 'Saudável', 'Delicioso', 'Feito com amor'].map((tag, i) => (
            <span key={i} className="text-white font-medium whitespace-nowrap px-4">✦ {tag}</span>
          ))}
        </div>
      </section>

      <section id="cardapio" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#D4537E] font-medium text-sm uppercase tracking-wider">Nossos produtos</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2A] mt-2">Em destaque</h2>
            <p className="text-gray-500 mt-3 max-w-md mx-auto">Selecionamos os queridinhos dos nossos clientes para você experimentar</p>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                  <div className="h-48 bg-pink-100 rounded-xl mb-4" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : produtos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {produtos.map(produto => (
                <ProdutoCard key={produto.id} produto={produto} onPedir={() => navigate('/pedido/' + produto.id)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🍰</div>
              <p className="text-gray-500">Produtos em breve!</p>
            </div>
          )}
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/cardapio')}
              className="border-2 border-[#D4537E] text-[#D4537E] px-8 py-3 rounded-full font-semibold hover:bg-[#FBEAF0] transition-all"
            >
              Ver cardápio completo →
            </button>
          </div>
        </div>
      </section>

      <section id="sobre" className="py-20 px-4 bg-[#FBEAF0]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            <div className="w-64 h-64 bg-[#F4C0D1] rounded-3xl flex items-center justify-center text-8xl shadow-xl">
              👩‍🍳
            </div>
          </div>
          <div>
            <span className="text-[#D4537E] font-medium text-sm uppercase tracking-wider">Nossa história</span>
            <h2 className="text-3xl font-bold text-[#2C2C2A] mt-2 mb-4">Feito com amor e cuidado</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              A Tufit Delícias nasceu da paixão por criar doces que todo mundo possa aproveitar — sem restrições, sem culpa, com muito sabor.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Cada receita é desenvolvida com ingredientes selecionados, sem açúcar refinado, sem glúten e sem lactose. Porque cuidar da saúde não precisa ser sinônimo de abrir mão dos prazeres da vida.
            </p>
            <div className="flex flex-wrap gap-3">
              {['Sem açúcar refinado', 'Sem glúten', 'Sem lactose', 'Ingredientes naturais', 'Feito artesanalmente'].map(tag => (
                <span key={tag} className="bg-white text-[#993556] px-4 py-2 rounded-full text-sm font-medium border border-pink-200">
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="avaliacoes" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#D4537E] font-medium text-sm uppercase tracking-wider">Depoimentos</span>
            <h2 className="text-3xl font-bold text-[#2C2C2A] mt-2">O que nossos clientes dizem</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(avaliacoes.length > 0 ? avaliacoes : depoimentosFallback).map((av, i) => (
              <div key={av.id || i} className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
                <div className="flex mb-3">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={16} className={s <= av.nota ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{av.comentario || av.texto}"</p>
                <p className="font-medium text-sm text-[#993556]">— {av.nome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#D4537E]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Pronta para fazer seu pedido?</h2>
          <p className="text-pink-100 mb-8 text-lg">Escolha seus doces favoritos e encomendar nunca foi tão fácil</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/cardapio')}
              className="bg-white text-[#D4537E] px-8 py-4 rounded-full font-bold hover:bg-pink-50 transition-all hover:scale-105 shadow-lg"
            >
              Ver cardápio
            </button>
            <a
              href={'https://wa.me/' + whatsapp}
              target="_blank"
              rel="noreferrer"
              className="border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} />
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-[#2C2C2A] text-gray-400 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#D4537E] rounded-full flex items-center justify-center">
              <Heart size={12} className="text-white fill-white" />
            </div>
            <span className="text-white font-semibold">Tufit Delícias</span>
          </div>
          <p className="text-sm">Goiânia - GO · Feito com amor</p>
          <a
            href="https://instagram.com/tufitdelicias"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm hover:text-[#D4537E] transition-colors"
          >
            @tufitdelicias
          </a>
        </div>
      </footer>

    </div>
  )
}
