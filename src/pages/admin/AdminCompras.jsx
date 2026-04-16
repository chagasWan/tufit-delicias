import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ShoppingCart, RefreshCw, AlertTriangle, CheckCircle, Package, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_PENDENTES = ['novo', 'confirmado', 'producao']

export default function AdminCompras() {
  const [carregando, setCarregando] = useState(true)
  const [listaCompras, setListaCompras] = useState([])
  const [semReceita, setSemReceita] = useState([])
  const [totalPedidos, setTotalPedidos] = useState(0)
  const [expandidos, setExpandidos] = useState({})
  const [comprados, setComprados] = useState({})

  useEffect(() => {
    calcularLista()
  }, [])

  async function calcularLista() {
    setCarregando(true)
    try {
      // 1. Buscar pedidos pendentes com itens
      const { data: pedidos, error: errPedidos } = await supabase
        .from('pedidos')
        .select('id, data_retirada, pedido_itens ( nome_produto, quantidade )')
        .in('status', STATUS_PENDENTES)
        .order('data_retirada')

      if (errPedidos) throw errPedidos

      setTotalPedidos(pedidos?.length || 0)

      // 2. Consolidar quantidade por produto
      const qtdPorProduto = {}
      ;(pedidos || []).forEach(pedido => {
        ;(pedido.pedido_itens || []).forEach(item => {
          if (!qtdPorProduto[item.nome_produto]) qtdPorProduto[item.nome_produto] = 0
          qtdPorProduto[item.nome_produto] += item.quantidade
        })
      })

      if (Object.keys(qtdPorProduto).length === 0) {
        setListaCompras([])
        setSemReceita([])
        setCarregando(false)
        return
      }

      // 3. Buscar receitas pelo nome do produto
      const nomesProdutos = Object.keys(qtdPorProduto)
      const { data: receitas, error: errReceitas } = await supabase
        .from('receitas')
        .select('id, nome, rendimento, unidade_rendimento, receita_ingredientes ( quantidade, ingredientes ( id, nome, unidade_uso, unidade_compra, quantidade_por_unidade, preco_unidade, estoque_atual ) )')
        .in('nome', nomesProdutos)

      // 4. Buscar também por nome de produto na tabela produtos -> receita_id (caso futuro)
      // Por ora, match por nome da receita === nome do produto

      const receitasPorNome = {}
      ;(receitas || []).forEach(r => { receitasPorNome[r.nome] = r })

      // 5. Identificar produtos sem receita cadastrada
      const semReceitaList = nomesProdutos.filter(n => !receitasPorNome[n])
      setSemReceita(semReceitaList.map(n => ({ nome: n, quantidade: qtdPorProduto[n] })))

      // 6. Calcular ingredientes necessários
      const ingredientesMap = {}

      nomesProdutos.forEach(nomeProduto => {
        const receita = receitasPorNome[nomeProduto]
        if (!receita) return

        const qtdPedida = qtdPorProduto[nomeProduto]
        const fator = qtdPedida / (receita.rendimento || 1)

        ;(receita.receita_ingredientes || []).forEach(ri => {
          const ing = ri.ingredientes
          if (!ing) return
          const qtdNecessaria = ri.quantidade * fator

          if (!ingredientesMap[ing.id]) {
            ingredientesMap[ing.id] = {
              id: ing.id,
              nome: ing.nome,
              unidade_uso: ing.unidade_uso,
              unidade_compra: ing.unidade_compra,
              quantidade_por_unidade: ing.quantidade_por_unidade,
              preco_unidade: ing.preco_unidade,
              estoque_atual: (ing.estoque_atual || 0) * (ing.quantidade_por_unidade || 1),
              estoque_atual_compra: ing.estoque_atual || 0,
              necessario: 0,
              produtos: [],
            }
          }

          ingredientesMap[ing.id].necessario += qtdNecessaria
          ingredientesMap[ing.id].produtos.push({
            produto: nomeProduto,
            qtdProduto: qtdPedida,
            qtdIngrediente: qtdNecessaria,
          })
        })
      })

      // 7. Calcular o que falta comprar
      const lista = Object.values(ingredientesMap).map(ing => {
        const falta = Math.max(0, ing.necessario - ing.estoque_atual)
        const unidadesComprar = ing.quantidade_por_unidade > 0
          ? Math.ceil(falta / ing.quantidade_por_unidade)
          : 0
        const custoEstimado = unidadesComprar * (ing.preco_unidade || 0)

        return {
          ...ing,
          falta,
          unidadesComprar,
          custoEstimado,
          ok: falta <= 0,
        }
      }).sort((a, b) => {
        // Primeiro os que faltam, depois os que estão ok
        if (a.ok !== b.ok) return a.ok ? 1 : -1
        return b.falta - a.falta
      })

      setListaCompras(lista)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao calcular lista de compras')
    }
    setCarregando(false)
  }

  function toggleExpand(id) {
    setExpandidos(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleComprado(id) {
    setComprados(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const totalCustoEstimado = listaCompras
    .filter(i => !i.ok)
    .reduce((acc, i) => acc + i.custoEstimado, 0)

  const faltando = listaCompras.filter(i => !i.ok)
  const emEstoque = listaCompras.filter(i => i.ok)
  const compradosCount = Object.values(comprados).filter(Boolean).length

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#2C2C2A' }}>Lista de Compras</h1>
          <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 14 }}>
            Baseada em {totalPedidos} {totalPedidos === 1 ? 'pedido pendente' : 'pedidos pendentes'}
          </p>
        </div>
        <button
          onClick={calcularLista}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FBEAF0', color: '#D4537E', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
        >
          <RefreshCw size={14} /> Recalcular
        </button>
      </div>

      {carregando ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#9ca3af' }}>
          <ShoppingCart size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <p>Calculando lista de compras...</p>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f3f4f6', padding: '18px 20px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Itens para comprar</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: faltando.length > 0 ? '#ef4444' : '#10b981' }}>{faltando.length}</p>
              {compradosCount > 0 && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#10b981' }}>{compradosCount} marcado(s) como comprado</p>}
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f3f4f6', padding: '18px 20px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Custo estimado</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#D4537E' }}>
                R$ {totalCustoEstimado.toFixed(2).replace('.', ',')}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>para atender todos os pedidos</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f3f4f6', padding: '18px 20px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Já em estoque</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#10b981' }}>{emEstoque.length}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>{emEstoque.length > 0 ? 'ingredientes suficientes' : '—'}</p>
            </div>
          </div>

          {/* Aviso produtos sem receita */}
          {semReceita.length > 0 && (
            <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#92400e', fontSize: 14 }}>
                  {semReceita.length} {semReceita.length === 1 ? 'produto sem receita cadastrada' : 'produtos sem receita cadastrada'}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
                  Não foi possível calcular ingredientes para:{' '}
                  {semReceita.map(p => `${p.nome} (${p.quantidade}×)`).join(', ')}.
                  Cadastre as receitas com o mesmo nome do produto para incluir no cálculo.
                </p>
              </div>
            </div>
          )}

          {listaCompras.length === 0 && semReceita.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', padding: 64, textAlign: 'center', color: '#9ca3af' }}>
              <CheckCircle size={40} style={{ margin: '0 auto 12px', display: 'block', color: '#10b981', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#2C2C2A' }}>Nenhum pedido pendente</p>
              <p style={{ margin: '6px 0 0', fontSize: 14 }}>Quando houver pedidos ativos, a lista de compras aparece aqui.</p>
            </div>
          )}

          {/* Lista: o que falta comprar */}
          {faltando.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#ef4444', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCart size={16} /> Precisa comprar ({faltando.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {faltando.map(ing => {
                  const comprado = comprados[ing.id]
                  const aberto = expandidos[ing.id]
                  return (
                    <div key={ing.id} style={{
                      background: '#fff',
                      borderRadius: 14,
                      border: comprado ? '1.5px solid #bbf7d0' : '1.5px solid #fecaca',
                      opacity: comprado ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
                        {/* Checkbox comprado */}
                        <button
                          onClick={() => toggleComprado(ing.id)}
                          style={{
                            width: 24, height: 24, borderRadius: '50%', border: '2px solid',
                            borderColor: comprado ? '#10b981' : '#d1d5db',
                            background: comprado ? '#10b981' : 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, padding: 0,
                          }}
                        >
                          {comprado && <CheckCircle size={14} color="#fff" />}
                        </button>

                        {/* Info principal */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: comprado ? '#6b7280' : '#2C2C2A', fontSize: 15, textDecoration: comprado ? 'line-through' : 'none' }}>
                              {ing.nome}
                            </span>
                            <span style={{ background: '#fef2f2', color: '#ef4444', fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>
                              faltam {ing.falta.toFixed(0)} {ing.unidade_uso}
                            </span>
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
                            Necessário: {ing.necessario.toFixed(0)} {ing.unidade_uso} · Estoque: {ing.estoque_atual} {ing.unidade_uso}
                          </p>
                        </div>

                        {/* Comprar */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {ing.unidadesComprar > 0 && (
                            <p style={{ margin: 0, fontWeight: 700, color: '#D4537E', fontSize: 14 }}>
                              Comprar {ing.unidadesComprar} {ing.unidade_compra}
                            </p>
                          )}
                          {ing.custoEstimado > 0 && (
                            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>
                              ~R$ {ing.custoEstimado.toFixed(2).replace('.', ',')}
                            </p>
                          )}
                        </div>

                        {/* Expandir */}
                        <button
                          onClick={() => toggleExpand(ing.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, flexShrink: 0 }}
                        >
                          {aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      {/* Detalhe: para quais produtos */}
                      {aberto && (
                        <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 18px 14px', background: '#fafafa' }}>
                          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Usado em</p>
                          {ing.produtos.map((p, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', padding: '3px 0' }}>
                              <span>{p.qtdProduto}× {p.produto}</span>
                              <span style={{ fontWeight: 600 }}>{p.qtdIngrediente.toFixed(0)} {ing.unidade_uso}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Lista: já tem em estoque */}
          {emEstoque.length > 0 && (
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#10b981', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} /> Já em estoque ({emEstoque.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {emEstoque.map(ing => {
                  const aberto = expandidos[ing.id + '_ok']
                  return (
                    <div key={ing.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CheckCircle size={14} color="#10b981" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, color: '#2C2C2A', fontSize: 14 }}>{ing.nome}</span>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>
                            Necessário: {ing.necessario.toFixed(0)} {ing.unidade_uso} · Estoque: {ing.estoque_atual} {ing.unidade_uso}
                          </p>
                        </div>
                        <span style={{ background: '#f0fdf4', color: '#15803d', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                          sobram {(ing.estoque_atual - ing.necessario).toFixed(0)} {ing.unidade_uso}
                        </span>
                        <button
                          onClick={() => toggleExpand(ing.id + '_ok')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}
                        >
                          {aberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      {aberto && (
                        <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 18px 14px', background: '#fafafa' }}>
                          <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Usado em</p>
                          {ing.produtos.map((p, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', padding: '3px 0' }}>
                              <span>{p.qtdProduto}× {p.produto}</span>
                              <span style={{ fontWeight: 600 }}>{p.qtdIngrediente.toFixed(0)} {ing.unidade_uso}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
