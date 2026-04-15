import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Trash2, X, ChevronDown, ChevronUp, BookOpen, Package, DollarSign, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }
const labelStyle = { fontSize: 13, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 5 }

function ModalIngrediente({ ingrediente, onFechar, onSalvar }) {
  const [form, setForm] = useState({
    nome: ingrediente?.nome || '',
    unidade_compra: ingrediente?.unidade_compra || 'kg',
    quantidade_por_unidade: ingrediente?.quantidade_por_unidade || 1000,
    unidade_uso: ingrediente?.unidade_uso || 'g',
    preco_unidade: ingrediente?.preco_unidade || '',
    estoque_atual: ingrediente?.estoque_atual || 0,
    estoque_minimo: ingrediente?.estoque_minimo || 0,
  })
  const [salvando, setSalvando] = useState(false)

  const custoPorUsoUnit = form.preco_unidade && form.quantidade_por_unidade
    ? (parseFloat(form.preco_unidade) / parseFloat(form.quantidade_por_unidade))
    : 0

  async function handleSalvar() {
    if (!form.nome.trim()) return toast.error('Digite o nome do ingrediente')
    if (!form.preco_unidade) return toast.error('Digite o preço')
    setSalvando(true)
    const dados = {
      nome: form.nome.trim(),
      unidade_compra: form.unidade_compra,
      quantidade_por_unidade: parseFloat(form.quantidade_por_unidade),
      unidade_uso: form.unidade_uso,
      preco_unidade: parseFloat(form.preco_unidade),
      estoque_atual: parseFloat(form.estoque_atual) || 0,
      estoque_minimo: parseFloat(form.estoque_minimo) || 0,
    }
    let error
    if (ingrediente?.id) {
      const res = await supabase.from('ingredientes').update(dados).eq('id', ingrediente.id)
      error = res.error
    } else {
      const res = await supabase.from('ingredientes').insert(dados)
      error = res.error
    }
    if (error) { toast.error('Erro ao salvar'); console.error(error) }
    else { toast.success('Ingrediente salvo!'); onSalvar() }
    setSalvando(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onFechar} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: 32, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2C2C2A', margin: 0 }}>{ingrediente?.id ? 'Editar ingrediente' : 'Novo ingrediente'}</h2>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nome do ingrediente *</label>
            <input style={inputStyle} value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))} placeholder="Ex: Chocolate em pó" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Unidade de compra</label>
              <select style={inputStyle} value={form.unidade_compra} onChange={e => setForm(f => ({...f, unidade_compra: e.target.value}))}>
                {['kg','g','litro','ml','unidade','pacote','caixa','lata'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Unidade de uso na receita</label>
              <select style={inputStyle} value={form.unidade_uso} onChange={e => setForm(f => ({...f, unidade_uso: e.target.value}))}>
                {['g','ml','unidade','colher','xícara'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Qtd por unidade de compra</label>
              <input style={inputStyle} type="number" value={form.quantidade_por_unidade} onChange={e => setForm(f => ({...f, quantidade_por_unidade: e.target.value}))} placeholder="Ex: 1000 (1kg = 1000g)" />
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '3px 0 0' }}>1 {form.unidade_compra} = ? {form.unidade_uso}</p>
            </div>
            <div>
              <label style={labelStyle}>Preço da unidade de compra (R$)</label>
              <input style={inputStyle} type="number" step="0.01" value={form.preco_unidade} onChange={e => setForm(f => ({...f, preco_unidade: e.target.value}))} placeholder="0,00" />
            </div>
          </div>

          {custoPorUsoUnit > 0 && (
            <div style={{ background: '#FBEAF0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#993556' }}>
              💡 Custo por {form.unidade_uso}: <strong>R$ {custoPorUsoUnit.toFixed(4)}</strong>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Estoque atual ({form.unidade_uso})</label>
              <input style={inputStyle} type="number" value={form.estoque_atual} onChange={e => setForm(f => ({...f, estoque_atual: e.target.value}))} />
            </div>
            <div>
              <label style={labelStyle}>Estoque mínimo ({form.unidade_uso})</label>
              <input style={inputStyle} type="number" value={form.estoque_minimo} onChange={e => setForm(f => ({...f, estoque_minimo: e.target.value}))} />
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '3px 0 0' }}>Alerta abaixo deste valor</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={onFechar} style={{ flex: 1, background: 'transparent', color: '#6b7280', padding: '12px', borderRadius: 20, border: '1.5px solid #e5e7eb', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSalvar} disabled={salvando} style={{ flex: 2, background: salvando ? '#f9a8d4' : '#D4537E', color: '#fff', padding: '12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              {salvando ? 'Salvando...' : 'Salvar ingrediente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalReceita({ receita, ingredientes, margemInicial = 40, onFechar, onSalvar }) {
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
          ingrediente: ri.ingredientes,
          quantidade: ri.quantidade,
          observacao: ri.observacao || '',
        })) || [])
      })
    }
  }, [receita?.id])

  function adicionarItem() {
    setItens(prev => [...prev, { ingrediente_id: '', ingrediente: null, quantidade: '', observacao: '' }])
  }

  function removerItem(idx) {
    setItens(prev => prev.filter((_, i) => i !== idx))
  }

  function atualizarItem(idx, campo, valor) {
    setItens(prev => prev.map((item, i) => {
      if (i !== idx) return item
      if (campo === 'ingrediente_id') {
        const ing = ingredientes.find(ig => ig.id === valor)
        return { ...item, ingrediente_id: valor, ingrediente: ing || null }
      }
      return { ...item, [campo]: valor }
    }))
  }

  const custoTotal = itens.reduce((acc, item) => {
    if (!item.ingrediente || !item.quantidade) return acc
    const custoPorUnit = item.ingrediente.preco_unidade / item.ingrediente.quantidade_por_unidade
    return acc + (custoPorUnit * parseFloat(item.quantidade || 0))
  }, 0)

  const custoPorUnidade = form.rendimento > 0 ? custoTotal / parseFloat(form.rendimento) : 0
  const precoSugerido = custoPorUnidade / (1 - margem / 100)

  async function handleSalvar() {
    if (!form.nome.trim()) return toast.error('Digite o nome da receita')
    if (itens.length === 0) return toast.error('Adicione pelo menos um ingrediente')
    const itensValidos = itens.filter(i => i.ingrediente_id && i.quantidade)
    if (itensValidos.length === 0) return toast.error('Preencha os ingredientes corretamente')

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
              <label style={labelStyle}>Tempo de preparo (min)</label>
              <input style={inputStyle} type="number" value={form.tempo_preparo_minutos} onChange={e => setForm(f => ({...f, tempo_preparo_minutos: e.target.value}))} placeholder="Ex: 60" />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ ...labelStyle, margin: 0 }}>Ingredientes</label>
              <button onClick={adicionarItem} style={{ background: '#FBEAF0', color: '#D4537E', padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={14} /> Adicionar
              </button>
            </div>

            {itens.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: '#f9fafb', borderRadius: 10, color: '#9ca3af', fontSize: 14 }}>
                Clique em "Adicionar" para incluir ingredientes
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {itens.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, alignItems: 'center' }}>
                    <select
                      style={inputStyle}
                      value={item.ingrediente_id}
                      onChange={e => atualizarItem(idx, 'ingrediente_id', e.target.value)}
                    >
                      <option value="">Selecione o ingrediente...</option>
                      {ingredientes.map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.nome}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        style={{ ...inputStyle, width: '70%' }}
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Qtd"
                        value={item.quantidade}
                        onChange={e => atualizarItem(idx, 'quantidade', e.target.value)}
                      />
                      <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                        {item.ingrediente?.unidade_uso || '—'}
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

          {custoTotal > 0 && (
            <div style={{ background: '#f0fdf4', borderRadius: 14, padding: 16, border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#15803d', margin: '0 0 12px' }}>💰 Análise de custo</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#15803d', margin: '0 0 2px' }}>R$ {custoTotal.toFixed(2).replace('.', ',')}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Custo total da receita</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#15803d', margin: '0 0 2px' }}>R$ {custoPorUnidade.toFixed(2).replace('.', ',')}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Custo por {form.unidade_rendimento}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#D4537E', margin: '0 0 2px' }}>R$ {precoSugerido.toFixed(2).replace('.', ',')}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Preço sugerido ({margem}% margem)</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>Margem de lucro:</label>
                <input type="range" min="10" max="80" step="5" value={margem} onChange={e => setMargem(parseInt(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#D4537E', minWidth: 36 }}>{margem}%</span>
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Observações / modo de preparo</label>
            <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} value={form.observacoes} onChange={e => setForm(f => ({...f, observacoes: e.target.value}))} placeholder="Instruções de preparo, dicas, variações..." />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={onFechar} style={{ flex: 1, background: 'transparent', color: '#6b7280', padding: '12px', borderRadius: 20, border: '1.5px solid #e5e7eb', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSalvar} disabled={salvando} style={{ flex: 2, background: salvando ? '#f9a8d4' : '#D4537E', color: '#fff', padding: '12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              {salvando ? 'Salvando...' : 'Salvar receita'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminReceitas() {
  const [aba, setAba] = useState('receitas')
  const [receitas, setReceitas] = useState([])
  const [ingredientes, setIngredientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalReceita, setModalReceita] = useState(false)
  const [modalIngrediente, setModalIngrediente] = useState(false)
  const [editandoReceita, setEditandoReceita] = useState(null)
  const [editandoIngrediente, setEditandoIngrediente] = useState(null)
  const [expandido, setExpandido] = useState(null)
  const [margemPadrao, setMargemPadrao] = useState(40)

  useEffect(() => { buscarDados() }, [])

  async function buscarDados() {
    const [{ data: r }, { data: i }, { data: cfg }] = await Promise.all([
      supabase.from('receitas').select('*, receita_ingredientes(*, ingredientes(*))').order('nome'),
      supabase.from('ingredientes').select('*').order('nome'),
      supabase.from('configuracoes').select('valor').eq('chave', 'margem_padrao').single(),
    ])
    setReceitas(r || [])
    setIngredientes(i || [])
    if (cfg?.valor) setMargemPadrao(parseFloat(cfg.valor) || 40)
    setLoading(false)
  }

  async function excluirIngrediente(id) {
    if (!confirm('Excluir este ingrediente?')) return
    const { error } = await supabase.from('ingredientes').delete().eq('id', id)
    if (!error) { toast.success('Ingrediente excluído'); buscarDados() }
    else toast.error('Não é possível excluir — ingrediente está sendo usado em uma receita')
  }

  async function excluirReceita(id) {
    if (!confirm('Excluir esta receita?')) return
    await supabase.from('receita_ingredientes').delete().eq('receita_id', id)
    const { error } = await supabase.from('receitas').delete().eq('id', id)
    if (!error) { toast.success('Receita excluída'); buscarDados() }
  }

  function calcularCustoReceita(receita) {
    return (receita.receita_ingredientes || []).reduce((acc, ri) => {
      if (!ri.ingredientes) return acc
      const custoPorUnit = ri.ingredientes.preco_unidade / ri.ingredientes.quantidade_por_unidade
      return acc + custoPorUnit * ri.quantidade
    }, 0)
  }

  const alertasEstoque = ingredientes.filter(i => i.estoque_atual <= i.estoque_minimo && i.estoque_minimo > 0)

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {modalIngrediente && (
        <ModalIngrediente
          ingrediente={editandoIngrediente}
          onFechar={() => { setModalIngrediente(false); setEditandoIngrediente(null) }}
          onSalvar={() => { setModalIngrediente(false); setEditandoIngrediente(null); buscarDados() }}
        />
      )}
      {modalReceita && (
        <ModalReceita
          receita={editandoReceita}
          ingredientes={ingredientes}
          margemInicial={margemPadrao}
          onFechar={() => { setModalReceita(false); setEditandoReceita(null) }}
          onSalvar={() => { setModalReceita(false); setEditandoReceita(null); buscarDados() }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#2C2C2A', margin: 0 }}>Receitas</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: '4px 0 0' }}>Gerencie ingredientes e calcule o custo de cada produto</p>
        </div>
        <button
          onClick={() => aba === 'receitas' ? setModalReceita(true) : setModalIngrediente(true)}
          style={{ background: '#D4537E', color: '#fff', padding: '12px 20px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={18} />
          {aba === 'receitas' ? 'Nova receita' : 'Novo ingrediente'}
        </button>
      </div>

      {alertasEstoque.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 600, color: '#92400e', fontSize: 14, margin: 0 }}>Estoque baixo!</p>
            <p style={{ color: '#78350f', fontSize: 13, margin: 0 }}>{alertasEstoque.map(i => i.nome).join(', ')}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'receitas', label: 'Receitas', icon: BookOpen, count: receitas.length },
          { key: 'ingredientes', label: 'Ingredientes', icon: Package, count: ingredientes.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setAba(tab.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 24, border: '1.5px solid', borderColor: aba === tab.key ? '#D4537E' : '#e5e7eb', background: aba === tab.key ? '#FBEAF0' : '#fff', color: aba === tab.key ? '#D4537E' : '#6b7280', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          >
            <tab.icon size={16} />
            {tab.label}
            <span style={{ background: aba === tab.key ? '#D4537E' : '#f3f4f6', color: aba === tab.key ? '#fff' : '#9ca3af', fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20 }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} style={{ background: '#fff', borderRadius: 14, height: 64, border: '1px solid #f3f4f6' }} />)}
        </div>
      ) : aba === 'ingredientes' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ingredientes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🥚</div>
              <p>Nenhum ingrediente cadastrado</p>
              <button onClick={() => setModalIngrediente(true)} style={{ marginTop: 16, background: '#D4537E', color: '#fff', padding: '10px 24px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Cadastrar primeiro ingrediente
              </button>
            </div>
          ) : ingredientes.map(ing => {
            const custoPorUnit = ing.preco_unidade / ing.quantidade_por_unidade
            const estoqueAlerta = ing.estoque_atual <= ing.estoque_minimo && ing.estoque_minimo > 0
            return (
              <div key={ing.id} style={{ background: '#fff', borderRadius: 14, border: estoqueAlerta ? '1.5px solid #fde68a' : '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, color: '#2C2C2A', fontSize: 15 }}>{ing.nome}</span>
                    {estoqueAlerta && <span style={{ background: '#fffbeb', color: '#d97706', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>⚠️ Estoque baixo</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>1 {ing.unidade_compra} = {ing.quantidade_por_unidade}{ing.unidade_uso} · R$ {ing.preco_unidade?.toFixed(2).replace('.', ',')}</span>
                    <span style={{ fontSize: 13, color: '#D4537E', fontWeight: 600 }}>R$ {custoPorUnit.toFixed(4)}/{ing.unidade_uso}</span>
                    <span style={{ fontSize: 13, color: ing.estoque_atual <= ing.estoque_minimo ? '#ef4444' : '#10b981' }}>
                      Estoque: {ing.estoque_atual}{ing.unidade_uso}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setEditandoIngrediente(ing); setModalIngrediente(true) }} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => excluirIngrediente(ing.id)} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {receitas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
              <p>Nenhuma receita cadastrada</p>
              <button onClick={() => setModalReceita(true)} style={{ marginTop: 16, background: '#D4537E', color: '#fff', padding: '10px 24px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Criar primeira receita
              </button>
            </div>
          ) : receitas.map(rec => {
            const custo = calcularCustoReceita(rec)
            const custoPorUnidade = rec.rendimento > 0 ? custo / rec.rendimento : 0
            const precoSugerido40 = custoPorUnidade / (1 - margemPadrao / 100)
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
                      <span style={{ fontSize: 13, color: '#6b7280' }}>{rec.receita_ingredientes?.length || 0} ingredientes</span>
                      {custo > 0 && <>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>Custo total: <strong>R$ {custo.toFixed(2).replace('.', ',')}</strong></span>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>Por unidade: <strong>R$ {custoPorUnidade.toFixed(2).replace('.', ',')}</strong></span>
                        <span style={{ fontSize: 13, color: '#D4537E', fontWeight: 600 }}>Vender por ({margemPadrao}% margem): R$ {precoSugerido40.toFixed(2).replace('.', ',')}+</span>
                      </>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button onClick={e => { e.stopPropagation(); setEditandoReceita(rec); setModalReceita(true) }} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); excluirReceita(rec.id) }} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
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
                        return (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f9fafb', fontSize: 14 }}>
                            <span style={{ color: '#2C2C2A' }}>{ri.ingredientes?.nome || '—'}</span>
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
