import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Trash2, X, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
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
            <label style={labelStyle}>Nome da receita *</label>
            <input style={inputStyle} value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))} placeholder="Ex: Brigadeiro Fit de Cacau" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Rendimento</label>
              <input style={inputStyle} type="number" min="1" value={form.rendimento} onChange={e => setForm(f => ({...f, rendimento: e.target.value}))} />
            </div>
            <div>
              <label style={labelStyle}>Unidade</label>
              <select style={inputStyle} value={form.unidade_rendimento} onChange={e => setForm(f => ({...f, unidade_rendimento: e.target.value}))}>
                {['unidade','porção','fatia','litro','kg'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tempo preparo (min)</label>
              <input style={inputStyle} type="number" value={form.tempo_preparo_minutos} onChange={e => setForm(f => ({...f, tempo_preparo_minutos: e.target.value}))} placeholder="Ex: 60" />
            </div>
          </div>

          {/* Insumos da receita */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ ...labelStyle, margin: 0 }}>Insumos utilizados</label>
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
            </div>
          )}

          <div>
            <label style={labelStyle}>Observações / modo de preparo</label>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {receitas.map(rec => {
            const custo = calcularCusto(rec)
            const custoPorUnidade = rec.rendimento > 0 ? custo / rec.rendimento : 0
            const precoSugerido = custoPorUnidade / (1 - margemPadrao / 100)
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
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
