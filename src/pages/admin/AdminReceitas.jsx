import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Trash2, X, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { LabelComDica } from '../../components/Tooltip'
import toast from 'react-hot-toast'

const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }
const labelStyle = { fontSize: 13, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 5 }

const CATEGORIA_EMOJI = { ingrediente: '🥚', embalagem: '📦', material: '🎀' }


function BuscaInsumo({ insumos, value, onChange, inputStyle }) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const insumoSelecionado = insumos.find(i => i.id === value)

  const insumosFiltrados = busca.trim()
    ? insumos.filter(i => i.nome.toLowerCase().includes(busca.toLowerCase()))
    : insumos

  const porCategoria = {
    ingrediente: insumosFiltrados.filter(i => i.categoria === 'ingrediente' || !i.categoria),
    embalagem: insumosFiltrados.filter(i => i.categoria === 'embalagem'),
    material: insumosFiltrados.filter(i => i.categoria === 'material'),
  }

  function selecionar(ins) {
    onChange(ins.id)
    setBusca('')
    setAberto(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Campo de exibição */}
      <div
        onClick={() => setAberto(v => !v)}
        style={{ ...inputStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', userSelect: 'none' }}
      >
        <span style={{ color: insumoSelecionado ? '#2C2C2A' : '#9ca3af', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {insumoSelecionado ? `${CATEGORIA_EMOJI[insumoSelecionado.categoria] || '🥚'} ${insumoSelecionado.nome}` : 'Selecione o insumo...'}
        </span>
        <span style={{ color: '#9ca3af', flexShrink: 0, marginLeft: 4 }}>▾</span>
      </div>

      {/* Dropdown */}
      {aberto && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: '#fff', borderRadius: 10, border: '1.5px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4, maxHeight: 280, display: 'flex', flexDirection: 'column' }}>
          {/* Campo de busca */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
            <input
              autoFocus
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="🔍 Buscar insumo..."
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #fce7f3', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Lista */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {insumosFiltrados.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Nenhum insumo encontrado</div>
            ) : (
              Object.entries(porCategoria).map(([cat, lista]) => lista.length === 0 ? null : (
                <div key={cat}>
                  <div style={{ padding: '6px 12px 2px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {CATEGORIA_EMOJI[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}s
                  </div>
                  {lista.map(ins => (
                    <div key={ins.id} onClick={() => selecionar(ins)}
                      style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 14, color: '#2C2C2A', background: ins.id === value ? '#FBEAF0' : 'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background = ins.id === value ? '#FBEAF0' : '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = ins.id === value ? '#FBEAF0' : 'transparent'}
                    >
                      {ins.nome}
                      <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>R$ {(ins.preco_unidade / ins.quantidade_por_unidade).toFixed(4)}/{ins.unidade_uso}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay para fechar */}
      {aberto && <div onClick={() => setAberto(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />}
    </div>
  )
}

function ModalReceita({ receita, insumos, margemInicial = 40, onFechar, onSalvar }) {
  const [form, setForm] = useState({
    nome: receita?.nome || '',
    descricao: receita?.descricao || '',
    rendimento: receita?.rendimento || 1,
    unidade_rendimento: receita?.unidade_rendimento || 'unidade',
    tempo_preparo_minutos: receita?.tempo_preparo_minutos || '',
    observacoes: receita?.observacoes || '',
  })
  const [itens, setItens] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [margem, setMargem] = useState(margemInicial)
  const [taxasIfood, setTaxasIfood] = useState({ comissao: 27, pagamento: 2.5, embalagem: 0 })
  const [mostrarIfood, setMostrarIfood] = useState(false)

  useEffect(() => {
    if (receita?.id) {
      supabase.from('receita_ingredientes').select('*, ingredientes(*)').eq('receita_id', receita.id).then(({ data }) => {
        setItens(data?.map(ri => ({
          ingrediente_id: ri.ingrediente_id,
          insumo: ri.ingredientes,
          quantidade: ri.quantidade,
          observacao: ri.observacao || '',
        })) || [])
      })
    }
  }, [receita?.id])

  function adicionarItem() {
    setItens(prev => [...prev, { ingrediente_id: '', insumo: null, quantidade: '', observacao: '' }])
  }

  function removerItem(idx) {
    setItens(prev => prev.filter((_, i) => i !== idx))
  }

  function atualizarItem(idx, campo, valor) {
    setItens(prev => prev.map((item, i) => {
      if (i !== idx) return item
      if (campo === 'ingrediente_id') {
        const ins = insumos.find(s => s.id === valor)
        return { ...item, ingrediente_id: valor, insumo: ins || null }
      }
      return { ...item, [campo]: valor }
    }))
  }

  const custoTotal = itens.reduce((acc, item) => {
    if (!item.insumo || !item.quantidade) return acc
    const custoPorUnit = item.insumo.preco_unidade / item.insumo.quantidade_por_unidade
    return acc + (custoPorUnit * parseFloat(item.quantidade || 0))
  }, 0)

  const custoPorUnidade = form.rendimento > 0 ? custoTotal / parseFloat(form.rendimento) : 0
  const precoSugerido = custoPorUnidade / (1 - margem / 100)
  // Calcular tabela nutricional por unidade/porção
  const NUTRIENTES = [
    { campo: 'kcal_por_100', label: 'Valor energético', unidade: 'kcal' },
    { campo: 'carb_por_100', label: 'Carboidratos', unidade: 'g' },
    { campo: 'acucar_por_100', label: 'Açúcares', unidade: 'g' },
    { campo: 'proteina_por_100', label: 'Proteínas', unidade: 'g' },
    { campo: 'gordura_por_100', label: 'Gorduras totais', unidade: 'g' },
    { campo: 'gordura_sat_por_100', label: 'Gorduras saturadas', unidade: 'g' },
    { campo: 'gordura_trans_por_100', label: 'Gorduras trans', unidade: 'g' },
    { campo: 'fibra_por_100', label: 'Fibra alimentar', unidade: 'g' },
    { campo: 'sodio_por_100', label: 'Sódio', unidade: 'mg' },
  ]

  const tabelaNutricional = NUTRIENTES.reduce((acc, n) => {
    const totalNutriente = itens.reduce((soma, item) => {
      if (!item.insumo || !item.quantidade) return soma
      const valorPor100 = item.insumo[n.campo] || 0
      // quantidade está em unidade_uso (g ou ml), valor nutricional é por 100g/ml
      return soma + (valorPor100 * parseFloat(item.quantidade || 0)) / 100
    }, 0)
    // Dividir pelo rendimento para obter por porção/unidade
    acc[n.campo] = form.rendimento > 0 ? totalNutriente / parseFloat(form.rendimento) : 0
    return acc
  }, {})

  const temDadosNutricionais = Object.values(tabelaNutricional).some(v => v > 0)

  const taxaTotalIfood = (taxasIfood.comissao + taxasIfood.pagamento) / 100
  const custoComEmbalagemIfood = custoPorUnidade + (taxasIfood.embalagem || 0)
  const precoSugeridoIfood = custoComEmbalagemIfood / (1 - taxaTotalIfood) / (1 - margem / 100)

  async function handleSalvar() {
    if (!form.nome.trim()) return toast.error('Digite o nome da receita')
    if (itens.length === 0) return toast.error('Adicione pelo menos um insumo')
    const itensValidos = itens.filter(i => i.ingrediente_id && i.quantidade)
    if (itensValidos.length === 0) return toast.error('Preencha os insumos corretamente')

    setSalvando(true)
    const dadosReceita = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      rendimento: parseFloat(form.rendimento),
      unidade_rendimento: form.unidade_rendimento,
      tempo_preparo_minutos: parseInt(form.tempo_preparo_minutos) || null,
      observacoes: form.observacoes.trim() || null,
    }

    let receitaId = receita?.id
    let error

    if (receitaId) {
      const res = await supabase.from('receitas').update(dadosReceita).eq('id', receitaId)
      error = res.error
      if (!error) await supabase.from('receita_ingredientes').delete().eq('receita_id', receitaId)
    } else {
      const res = await supabase.from('receitas').insert(dadosReceita).select().single()
      error = res.error
      receitaId = res.data?.id
    }

    if (!error && receitaId) {
      const { error: errItens } = await supabase.from('receita_ingredientes').insert(
        itensValidos.map(i => ({
          receita_id: receitaId,
          ingrediente_id: i.ingrediente_id,
          quantidade: parseFloat(i.quantidade),
          observacao: i.observacao || null,
        }))
      )
      error = errItens
    }

    if (error) { toast.error('Erro ao salvar receita'); console.error(error) }
    else { toast.success('Receita salva!'); onSalvar() }
    setSalvando(false)
  }

  // Agrupar insumos por categoria para o select
  const insumosPorCategoria = {
    ingrediente: insumos.filter(i => i.categoria === 'ingrediente' || !i.categoria),
    embalagem: insumos.filter(i => i.categoria === 'embalagem'),
    material: insumos.filter(i => i.categoria === 'material'),
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onFechar} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: 32, maxWidth: 640, width: '100%', maxHeight: '92vh', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2C2C2A', margin: 0 }}>{receita?.id ? 'Editar receita' : 'Nova receita'}</h2>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <LabelComDica dica="Use o mesmo nome que vai usar no produto. Ex: Brigadeiro Fit de Cacau. Isso facilita a vinculação e o cálculo de custos." obrigatorio>Nome da receita</LabelComDica>
            <input style={inputStyle} value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))} placeholder="Ex: Brigadeiro Fit de Cacau" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <LabelComDica dica="Quantas unidades essa receita produz no total. Ex: se faz 30 brigadeiros, coloque 30. Se faz 1 bolo inteiro, coloque 1.">Rendimento</LabelComDica>
              <input style={inputStyle} type="number" min="1" value={form.rendimento} onChange={e => setForm(f => ({...f, rendimento: e.target.value}))} />
            </div>
            <div>
              <LabelComDica dica="A unidade de cada item produzido. Ex: unidade para brigadeiros, fatia para bolos fatiados, porção para granolas.">Unidade</LabelComDica>
              <select style={inputStyle} value={form.unidade_rendimento} onChange={e => setForm(f => ({...f, unidade_rendimento: e.target.value}))}>
                {['unidade','porção','fatia','litro','kg'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <LabelComDica dica="Tempo total de preparo em minutos. Serve como referência para planejamento da produção.">Tempo de preparo (min)</LabelComDica>
              <input style={inputStyle} type="number" value={form.tempo_preparo_minutos} onChange={e => setForm(f => ({...f, tempo_preparo_minutos: e.target.value}))} placeholder="Ex: 60" />
            </div>
          </div>

          {/* Insumos da receita */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <LabelComDica dica="Adicione todos os ingredientes, embalagens e materiais usados nessa receita. O custo total será calculado automaticamente com base nos preços cadastrados em Insumos.">Insumos utilizados</LabelComDica>
              <button onClick={adicionarItem} style={{ background: '#FBEAF0', color: '#D4537E', padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={14} /> Adicionar
              </button>
            </div>

            {itens.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', background: '#f9fafb', borderRadius: 10, color: '#9ca3af', fontSize: 14 }}>
                Adicione ingredientes, embalagens e materiais usados nesta receita
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {itens.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, alignItems: 'center' }}>
                    <BuscaInsumo
                      insumos={insumos}
                      value={item.ingrediente_id}
                      onChange={val => atualizarItem(idx, 'ingrediente_id', val)}
                      inputStyle={inputStyle}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input style={{ ...inputStyle, width: '70%' }} type="number" min="0" step="0.1" placeholder="Qtd"
                        value={item.quantidade} onChange={e => atualizarItem(idx, 'quantidade', e.target.value)} />
                      <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                        {item.insumo?.unidade_uso || '—'}
                      </span>
                    </div>
                    <button onClick={() => removerItem(idx)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Análise de custo */}
          {custoTotal > 0 && (
            <div style={{ background: '#f0fdf4', borderRadius: 14, padding: 16, border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#15803d', margin: '0 0 12px' }}>💰 Análise de custo</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#15803d', margin: '0 0 2px' }}>R$ {custoTotal.toFixed(2).replace('.', ',')}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Custo total</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#15803d', margin: '0 0 2px' }}>R$ {custoPorUnidade.toFixed(2).replace('.', ',')}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Por {form.unidade_rendimento}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#D4537E', margin: '0 0 2px' }}>R$ {precoSugerido.toFixed(2).replace('.', ',')}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Sugerido ({margem}%)</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>Margem:</label>
                <input type="range" min="10" max="80" step="5" value={margem} onChange={e => setMargem(parseInt(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#D4537E', minWidth: 36 }}>{margem}%</span>
              </div>

              {/* Simulação iFood */}
              <div style={{ marginTop: 12, borderTop: '1px solid #bbf7d0', paddingTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: mostrarIfood ? 10 : 0 }} onClick={() => setMostrarIfood(v => !v)}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#c2410c' }}>🛵 Simular no iFood</span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{mostrarIfood ? '▲ Ocultar' : '▼ Ver'}</span>
                </div>
                {mostrarIfood && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Comissão (%)</label>
                        <input type="number" step="0.1" min="0" max="40" value={taxasIfood.comissao}
                          onChange={e => setTaxasIfood(t => ({ ...t, comissao: parseFloat(e.target.value) || 0 }))}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1.5px solid #fed7aa', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                        <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0' }}>Padrão: 27%</p>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Tx. pagamento (%)</label>
                        <input type="number" step="0.1" min="0" max="10" value={taxasIfood.pagamento}
                          onChange={e => setTaxasIfood(t => ({ ...t, pagamento: parseFloat(e.target.value) || 0 }))}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1.5px solid #fed7aa', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                        <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0' }}>Padrão: 2,5%</p>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>Embalagem (R$)</label>
                        <input type="number" step="0.01" min="0" value={taxasIfood.embalagem}
                          onChange={e => setTaxasIfood(t => ({ ...t, embalagem: parseFloat(e.target.value) || 0 }))}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1.5px solid #fed7aa', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                        <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0' }}>Isopor, sacola...</p>
                      </div>
                    </div>
                    <div style={{ background: '#fff7ed', borderRadius: 10, padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#c2410c', margin: '0 0 2px' }}>R$ {precoSugeridoIfood.toFixed(2).replace('.', ',')}</p>
                        <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Preço sugerido iFood ({margem}% margem)</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#c2410c', margin: '0 0 2px' }}>{(taxasIfood.comissao + taxasIfood.pagamento).toFixed(1)}%</p>
                        <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Total de taxas iFood</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabela Nutricional no modal */}
          {temDadosNutricionais && (
            <div style={{ background: '#f9fafb', borderRadius: 12, padding: 14, border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2A', margin: '0 0 10px' }}>
                🥗 Tabela Nutricional <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 12 }}>por {form.unidade_rendimento}</span>
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {NUTRIENTES.map((n, i) => tabelaNutricional[n.campo] > 0 && (
                    <tr key={n.campo} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                      <td style={{ padding: '5px 8px', color: '#2C2C2A' }}>{n.label}</td>
                      <td style={{ padding: '5px 8px', color: '#6b7280', textAlign: 'right', fontWeight: 600 }}>
                        {tabelaNutricional[n.campo].toFixed(1)} {n.unidade}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '8px 0 0' }}>
                Valores calculados automaticamente com base nos insumos cadastrados.
              </p>
            </div>
          )}

          <div>
            <LabelComDica dica="Anote o passo a passo, dicas de preparo, temperatura, tempo de forno, etc. Não afeta o cálculo de custo.">Observações / modo de preparo</LabelComDica>
            <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={form.observacoes}
              onChange={e => setForm(f => ({...f, observacoes: e.target.value}))} placeholder="Instruções de preparo, dicas, variações..." />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={onFechar} style={{ flex: 1, background: 'transparent', color: '#6b7280', padding: '12px', borderRadius: 20, border: '1.5px solid #e5e7eb', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSalvar} disabled={salvando}
              style={{ flex: 2, background: salvando ? '#f9a8d4' : '#D4537E', color: '#fff', padding: '12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              {salvando ? 'Salvando...' : 'Salvar receita'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminReceitas() {
  const [receitas, setReceitas] = useState([])
  const [insumos, setInsumos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalReceita, setModalReceita] = useState(false)
  const [editandoReceita, setEditandoReceita] = useState(null)
  const [expandido, setExpandido] = useState(null)
  const [margemPadrao, setMargemPadrao] = useState(40)
  const [taxasIfoodLista, setTaxasIfoodLista] = useState({ comissao: 27, pagamento: 2.5, embalagem: 0 })
  const [mostrarIfoodLista, setMostrarIfoodLista] = useState(false)

  useEffect(() => { buscarDados() }, [])

  async function buscarDados() {
    const [{ data: r }, { data: i }, { data: cfg }] = await Promise.all([
      supabase.from('receitas').select('*, receita_ingredientes(*, ingredientes(*))').order('nome'),
      supabase.from('ingredientes').select('*').order('categoria').order('nome'),
      supabase.from('configuracoes').select('valor').eq('chave', 'margem_padrao').single(),
    ])
    setReceitas(r || [])
    setInsumos(i || [])
    if (cfg?.valor) setMargemPadrao(parseFloat(cfg.valor) || 40)
    setLoading(false)
  }

  async function excluirReceita(id) {
    if (!confirm('Excluir esta receita?')) return
    await supabase.from('receita_ingredientes').delete().eq('receita_id', id)
    const { error } = await supabase.from('receitas').delete().eq('id', id)
    if (!error) { toast.success('Receita excluída'); buscarDados() }
  }

  function calcularCusto(receita) {
    return (receita.receita_ingredientes || []).reduce((acc, ri) => {
      if (!ri.ingredientes) return acc
      const custoPorUnit = ri.ingredientes.preco_unidade / ri.ingredientes.quantidade_por_unidade
      return acc + custoPorUnit * ri.quantidade
    }, 0)
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {modalReceita && (
        <ModalReceita
          receita={editandoReceita}
          insumos={insumos}
          margemInicial={margemPadrao}
          onFechar={() => { setModalReceita(false); setEditandoReceita(null) }}
          onSalvar={() => { setModalReceita(false); setEditandoReceita(null); buscarDados() }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#2C2C2A', margin: 0 }}>Receitas</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: '4px 0 0' }}>{receitas.length} receitas · custo calculado com insumos cadastrados</p>
        </div>
        <button onClick={() => { setEditandoReceita(null); setModalReceita(true) }}
          style={{ background: '#D4537E', color: '#fff', padding: '12px 20px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> Nova receita
        </button>
      </div>

      {insumos.length === 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#92400e' }}>
          ⚠️ Cadastre os insumos primeiro em <strong>Insumos</strong> para poder montar as receitas com cálculo de custo.
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} style={{ background: '#fff', borderRadius: 14, height: 64, border: '1px solid #f3f4f6' }} />)}
        </div>
      ) : receitas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
          <BookOpen size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <p style={{ fontSize: 15 }}>Nenhuma receita cadastrada</p>
          <button onClick={() => setModalReceita(true)} style={{ marginTop: 16, background: '#D4537E', color: '#fff', padding: '10px 24px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            Criar primeira receita
          </button>
        </div>
      ) : (
        <>
        {/* Painel iFood na listagem */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #fed7aa', marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', cursor: 'pointer', background: mostrarIfoodLista ? '#fff7ed' : '#fff' }} onClick={() => setMostrarIfoodLista(v => !v)}>
            <span style={{ fontWeight: 600, color: '#c2410c', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>🛵 Simulação iFood <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 12 }}>— ver preço sugerido com taxas da plataforma</span></span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{mostrarIfoodLista ? '▲ Ocultar' : '▼ Configurar'}</span>
          </div>
          {mostrarIfoodLista && (
            <div style={{ padding: '0 16px 14px', borderTop: '1px solid #fed7aa' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 4 }}>Comissão iFood (%)</label>
                  <input type="number" step="0.1" min="0" max="40" value={taxasIfoodLista.comissao}
                    onChange={e => setTaxasIfoodLista(t => ({ ...t, comissao: parseFloat(e.target.value) || 0 }))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #fed7aa', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Padrão: 27%</p>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 4 }}>Taxa de pagamento (%)</label>
                  <input type="number" step="0.1" min="0" max="10" value={taxasIfoodLista.pagamento}
                    onChange={e => setTaxasIfoodLista(t => ({ ...t, pagamento: parseFloat(e.target.value) || 0 }))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #fed7aa', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Padrão: 2,5%</p>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 4 }}>Embalagem extra (R$)</label>
                  <input type="number" step="0.01" min="0" value={taxasIfoodLista.embalagem}
                    onChange={e => setTaxasIfoodLista(t => ({ ...t, embalagem: parseFloat(e.target.value) || 0 }))}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #fed7aa', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Isopor, sacola, etc.</p>
                </div>
              </div>
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#fff7ed', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
                <strong>Total de taxas: {(taxasIfoodLista.comissao + taxasIfoodLista.pagamento).toFixed(1)}%</strong> — para cada R$ 100 vendidos, o iFood retém R$ {(taxasIfoodLista.comissao + taxasIfoodLista.pagamento).toFixed(2)} e você recebe R$ {(100 - taxasIfoodLista.comissao - taxasIfoodLista.pagamento).toFixed(2)}.
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {receitas.map(rec => {
            const custo = calcularCusto(rec)
            const custoPorUnidade = rec.rendimento > 0 ? custo / rec.rendimento : 0
            const precoSugerido = custoPorUnidade / (1 - margemPadrao / 100)
            // Calcular nutrição da receita para listagem
            const nutriReceitaTotais = {}
            const NUTRIENTES_LISTA = ['kcal_por_100','carb_por_100','proteina_por_100','gordura_por_100','fibra_por_100']
            NUTRIENTES_LISTA.forEach(campo => {
              const total = (rec.receita_ingredientes || []).reduce((soma, ri) => {
                const valorPor100 = ri.ingredientes?.[campo] || 0
                return soma + (valorPor100 * ri.quantidade) / 100
              }, 0)
              nutriReceitaTotais[campo] = rec.rendimento > 0 ? total / rec.rendimento : 0
            })
            const temNutri = Object.values(nutriReceitaTotais).some(v => v > 0)
            const aberto = expandido === rec.id
            return (
              <div key={rec.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f3f4f6', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }} onClick={() => setExpandido(aberto ? null : rec.id)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, color: '#2C2C2A', fontSize: 15 }}>{rec.nome}</span>
                      <span style={{ background: '#f0fdf4', color: '#15803d', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                        Rende {rec.rendimento} {rec.unidade_rendimento}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>{rec.receita_ingredientes?.length || 0} insumos</span>
                      {custo > 0 && <>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>Custo total: <strong>R$ {custo.toFixed(2).replace('.', ',')}</strong></span>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>Por unidade: <strong>R$ {custoPorUnidade.toFixed(2).replace('.', ',')}</strong></span>
                        <span style={{ fontSize: 13, color: '#D4537E', fontWeight: 600 }}>Vender por ({margemPadrao}% margem): R$ {precoSugerido.toFixed(2).replace('.', ',')}+</span>
                        {mostrarIfoodLista && (() => {
                          const taxaTotal = (taxasIfoodLista.comissao + taxasIfoodLista.pagamento) / 100
                          const custoComEmb = custoPorUnidade + (taxasIfoodLista.embalagem || 0)
                          const precoIfood = custoComEmb / (1 - taxaTotal) / (1 - margemPadrao / 100)
                          return <span style={{ fontSize: 13, color: '#c2410c', fontWeight: 600 }}>🛵 iFood ({margemPadrao}% margem): R$ {precoIfood.toFixed(2).replace('.', ',')}+</span>
                        })()}
                      </>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button onClick={e => { e.stopPropagation(); setEditandoReceita(rec); setModalReceita(true) }}
                      style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); excluirReceita(rec.id) }}
                      style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                      <Trash2 size={14} />
                    </button>
                    {aberto ? <ChevronUp size={18} color="#9ca3af" /> : <ChevronDown size={18} color="#9ca3af" />}
                  </div>
                </div>
                {aberto && (
                  <div style={{ padding: '0 18px 18px', borderTop: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                      {rec.receita_ingredientes?.map((ri, i) => {
                        const custoPorUnit = ri.ingredientes ? ri.ingredientes.preco_unidade / ri.ingredientes.quantidade_por_unidade : 0
                        const custoItem = custoPorUnit * ri.quantidade
                        const emoji = CATEGORIA_EMOJI[ri.ingredientes?.categoria] || '🥚'
                        return (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f9fafb', fontSize: 14 }}>
                            <span style={{ color: '#2C2C2A' }}>{emoji} {ri.ingredientes?.nome || '—'}</span>
                            <span style={{ color: '#9ca3af' }}>{ri.quantidade} {ri.ingredientes?.unidade_uso}</span>
                            <span style={{ color: '#6b7280', fontWeight: 500 }}>R$ {custoItem.toFixed(4)}</span>
                          </div>
                        )
                      })}
                    </div>
                    {rec.observacoes && (
                      <p style={{ color: '#6b7280', fontSize: 13, marginTop: 10, fontStyle: 'italic' }}>📝 {rec.observacoes}</p>
                    )}
                    {temNutri && (
                      <div style={{ marginTop: 12, padding: '10px 12px', background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#2C2C2A', margin: '0 0 6px' }}>🥗 Por {rec.unidade_rendimento}:</p>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#6b7280' }}>
                          {nutriReceitaTotais.kcal_por_100 > 0 && <span><strong>{nutriReceitaTotais.kcal_por_100.toFixed(0)} kcal</strong></span>}
                          {nutriReceitaTotais.carb_por_100 > 0 && <span>Carb: <strong>{nutriReceitaTotais.carb_por_100.toFixed(1)}g</strong></span>}
                          {nutriReceitaTotais.proteina_por_100 > 0 && <span>Prot: <strong>{nutriReceitaTotais.proteina_por_100.toFixed(1)}g</strong></span>}
                          {nutriReceitaTotais.gordura_por_100 > 0 && <span>Gord: <strong>{nutriReceitaTotais.gordura_por_100.toFixed(1)}g</strong></span>}
                          {nutriReceitaTotais.fibra_por_100 > 0 && <span>Fibras: <strong>{nutriReceitaTotais.fibra_por_100.toFixed(1)}g</strong></span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        </>
      )}
    </div>
  )
}
