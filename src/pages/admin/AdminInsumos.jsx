import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Trash2, X, AlertTriangle, Package } from 'lucide-react'
import toast from 'react-hot-toast'

const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }
const labelStyle = { fontSize: 13, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 5 }

const CATEGORIAS = [
  { value: 'ingrediente', label: '🥚 Ingrediente', desc: 'Farinha, chocolate, ovos...' },
  { value: 'embalagem', label: '📦 Embalagem', desc: 'Caixas, potes, sacos...' },
  { value: 'material', label: '🎀 Material', desc: 'Adesivos, fitas, etiquetas...' },
]

function ModalInsumo({ insumo, onFechar, onSalvar }) {
  const [form, setForm] = useState({
    nome: insumo?.nome || '',
    categoria: insumo?.categoria || 'ingrediente',
    unidade_compra: insumo?.unidade_compra || 'unidade',
    quantidade_por_unidade: insumo?.quantidade_por_unidade || 1,
    unidade_uso: insumo?.unidade_uso || 'unidade',
    preco_unidade: insumo?.preco_unidade || '',
    estoque_atual: insumo?.estoque_atual || 0,
    estoque_minimo: insumo?.estoque_minimo || 0,
  })
  const [salvando, setSalvando] = useState(false)

  const isIngrediente = form.categoria === 'ingrediente'
  const custoPorUso = form.preco_unidade && form.quantidade_por_unidade > 0
    ? parseFloat(form.preco_unidade) / parseFloat(form.quantidade_por_unidade)
    : 0

  // Quando muda categoria, ajusta unidades padrão
  function handleCategoria(cat) {
    const defaults = {
      ingrediente: { unidade_compra: 'kg', quantidade_por_unidade: 1000, unidade_uso: 'g' },
      embalagem: { unidade_compra: 'pacote', quantidade_por_unidade: 10, unidade_uso: 'unidade' },
      material: { unidade_compra: 'unidade', quantidade_por_unidade: 1, unidade_uso: 'unidade' },
    }
    setForm(f => ({ ...f, categoria: cat, ...defaults[cat] }))
  }

  async function handleSalvar() {
    if (!form.nome.trim()) return toast.error('Digite o nome do insumo')
    if (!form.preco_unidade) return toast.error('Digite o preço')
    setSalvando(true)
    const dados = {
      nome: form.nome.trim(),
      categoria: form.categoria,
      unidade_compra: form.unidade_compra,
      quantidade_por_unidade: parseFloat(form.quantidade_por_unidade),
      unidade_uso: form.unidade_uso,
      preco_unidade: parseFloat(form.preco_unidade),
      estoque_atual: parseFloat(form.estoque_atual) || 0,
      estoque_minimo: parseFloat(form.estoque_minimo) || 0,
    }
    let error
    if (insumo?.id) {
      const res = await supabase.from('ingredientes').update(dados).eq('id', insumo.id)
      error = res.error
    } else {
      const res = await supabase.from('ingredientes').insert(dados)
      error = res.error
    }
    if (error) { toast.error('Erro ao salvar'); console.error(error) }
    else { toast.success('Insumo salvo!'); onSalvar() }
    setSalvando(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onFechar} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: 32, maxWidth: 520, width: '100%', maxHeight: '92vh', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2C2C2A', margin: 0 }}>{insumo?.id ? 'Editar insumo' : 'Novo insumo'}</h2>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Categoria */}
          <div>
            <label style={labelStyle}>Categoria *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {CATEGORIAS.map(cat => (
                <button key={cat.value} onClick={() => handleCategoria(cat.value)}
                  style={{ padding: '10px 8px', borderRadius: 10, border: form.categoria === cat.value ? '2px solid #D4537E' : '1.5px solid #e5e7eb', background: form.categoria === cat.value ? '#FBEAF0' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 2 }}>{cat.label.split(' ')[0]}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: form.categoria === cat.value ? '#D4537E' : '#2C2C2A' }}>{cat.label.split(' ').slice(1).join(' ')}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{cat.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Nome */}
          <div>
            <label style={labelStyle}>Nome *</label>
            <input style={inputStyle} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder={form.categoria === 'ingrediente' ? 'Ex: Chocolate em pó' : form.categoria === 'embalagem' ? 'Ex: Caixinha kraft 9cm' : 'Ex: Adesivo personalizado'} />
          </div>

          {/* Preço e unidades */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Unidade de compra</label>
              <select style={inputStyle} value={form.unidade_compra} onChange={e => setForm(f => ({ ...f, unidade_compra: e.target.value }))}>
                {['unidade', 'pacote', 'caixa', 'kg', 'g', 'litro', 'ml', 'lata', 'rolo'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Preço da unidade de compra (R$)</label>
              <input style={inputStyle} type="number" step="0.01" value={form.preco_unidade}
                onChange={e => setForm(f => ({ ...f, preco_unidade: e.target.value }))} placeholder="0,00" />
            </div>
          </div>

          {/* Conversão (só relevante se não for unidade simples) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Quantidade por unidade comprada</label>
              <input style={inputStyle} type="number" value={form.quantidade_por_unidade}
                onChange={e => setForm(f => ({ ...f, quantidade_por_unidade: e.target.value }))}
                placeholder={isIngrediente ? 'Ex: 1000 (1kg = 1000g)' : 'Ex: 10 (1 pacote = 10 un)'} />
            </div>
            <div>
              <label style={labelStyle}>Unidade de uso na receita</label>
              <select style={inputStyle} value={form.unidade_uso} onChange={e => setForm(f => ({ ...f, unidade_uso: e.target.value }))}>
                {['unidade', 'g', 'ml', 'colher', 'xícara'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Custo por uso */}
          {custoPorUso > 0 && (
            <div style={{ background: '#FBEAF0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#993556' }}>
              💡 Custo por {form.unidade_uso}: <strong>R$ {custoPorUso.toFixed(4)}</strong>
            </div>
          )}

          {/* Estoque */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Estoque atual ({form.unidade_compra})</label>
              <input style={inputStyle} type="number" value={form.estoque_atual}
                onChange={e => setForm(f => ({ ...f, estoque_atual: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Estoque mínimo ({form.unidade_compra})</label>
              <input style={inputStyle} type="number" value={form.estoque_minimo}
                onChange={e => setForm(f => ({ ...f, estoque_minimo: e.target.value }))} />
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '3px 0 0' }}>Alerta abaixo deste valor</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={onFechar} style={{ flex: 1, background: 'transparent', color: '#6b7280', padding: '12px', borderRadius: 20, border: '1.5px solid #e5e7eb', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleSalvar} disabled={salvando}
              style={{ flex: 2, background: salvando ? '#f9a8d4' : '#D4537E', color: '#fff', padding: '12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              {salvando ? 'Salvando...' : 'Salvar insumo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminInsumos() {
  const [insumos, setInsumos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos')

  useEffect(() => { buscar() }, [])

  async function buscar() {
    setLoading(true)
    const { data } = await supabase.from('ingredientes').select('*').order('categoria').order('nome')
    setInsumos(data || [])
    setLoading(false)
  }

  async function excluir(id) {
    if (!confirm('Excluir este insumo?')) return
    const { error } = await supabase.from('ingredientes').delete().eq('id', id)
    if (!error) { toast.success('Insumo excluído'); buscar() }
    else toast.error('Não é possível excluir — insumo está sendo usado em uma receita')
  }

  const alertas = insumos.filter(i => i.estoque_atual <= i.estoque_minimo && i.estoque_minimo > 0)
  const filtrados = categoriaFiltro === 'todos' ? insumos : insumos.filter(i => i.categoria === categoriaFiltro)

  const contadores = {
    todos: insumos.length,
    ingrediente: insumos.filter(i => i.categoria === 'ingrediente').length,
    embalagem: insumos.filter(i => i.categoria === 'embalagem').length,
    material: insumos.filter(i => i.categoria === 'material').length,
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {modal && (
        <ModalInsumo
          insumo={editando}
          onFechar={() => { setModal(false); setEditando(null) }}
          onSalvar={() => { setModal(false); setEditando(null); buscar() }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#2C2C2A', margin: 0 }}>Insumos</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: '4px 0 0' }}>Ingredientes, embalagens e materiais</p>
        </div>
        <button onClick={() => { setEditando(null); setModal(true) }}
          style={{ background: '#D4537E', color: '#fff', padding: '12px 20px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> Novo insumo
        </button>
      </div>

      {/* Alerta de estoque */}
      {alertas.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={18} color="#d97706" />
          <div>
            <p style={{ fontWeight: 600, color: '#92400e', fontSize: 14, margin: 0 }}>Estoque baixo!</p>
            <p style={{ color: '#78350f', fontSize: 13, margin: 0 }}>{alertas.map(i => i.nome).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Filtros por categoria */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'ingrediente', label: '🥚 Ingredientes' },
          { key: 'embalagem', label: '📦 Embalagens' },
          { key: 'material', label: '🎀 Materiais' },
        ].map(f => (
          <button key={f.key} onClick={() => setCategoriaFiltro(f.key)}
            style={{ padding: '8px 18px', borderRadius: 24, border: '1.5px solid', borderColor: categoriaFiltro === f.key ? '#D4537E' : '#e5e7eb', background: categoriaFiltro === f.key ? '#FBEAF0' : '#fff', color: categoriaFiltro === f.key ? '#D4537E' : '#6b7280', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {f.label}
            <span style={{ background: categoriaFiltro === f.key ? '#D4537E' : '#f3f4f6', color: categoriaFiltro === f.key ? '#fff' : '#9ca3af', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>
              {contadores[f.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} style={{ background: '#fff', borderRadius: 14, height: 64, border: '1px solid #f3f4f6' }} />)}
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
          <Package size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <p style={{ fontSize: 15 }}>Nenhum insumo cadastrado</p>
          <button onClick={() => setModal(true)} style={{ marginTop: 16, background: '#D4537E', color: '#fff', padding: '10px 24px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            Cadastrar primeiro insumo
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtrados.map(ins => {
            const custoPorUso = ins.preco_unidade / ins.quantidade_por_unidade
            const alerta = ins.estoque_atual <= ins.estoque_minimo && ins.estoque_minimo > 0
            const catInfo = CATEGORIAS.find(c => c.value === ins.categoria)
            return (
              <div key={ins.id} style={{ background: '#fff', borderRadius: 14, border: alerta ? '1.5px solid #fde68a' : '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {catInfo?.label.split(' ')[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, color: '#2C2C2A', fontSize: 15 }}>{ins.nome}</span>
                    {alerta && <span style={{ background: '#fffbeb', color: '#d97706', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>⚠️ Estoque baixo</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13 }}>
                    <span style={{ color: '#6b7280' }}>
                      1 {ins.unidade_compra} = {ins.quantidade_por_unidade} {ins.unidade_uso} · R$ {ins.preco_unidade?.toFixed(2).replace('.', ',')}
                    </span>
                    <span style={{ color: '#D4537E', fontWeight: 600 }}>R$ {custoPorUso.toFixed(4)}/{ins.unidade_uso}</span>
                    <span style={{ color: alerta ? '#ef4444' : '#10b981' }}>
                      Estoque: {ins.estoque_atual} {ins.unidade_compra}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setEditando(ins); setModal(true) }}
                    style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => excluir(ins.id)}
                    style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
