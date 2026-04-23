import { useState, useEffect } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Trash2, X, AlertTriangle, Package, Search } from 'lucide-react'
import { LabelComDica } from '../../components/Tooltip'
import toast from 'react-hot-toast'

const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }
const labelStyle = { fontSize: 13, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 5 }

const CATEGORIAS = [
  { value: 'ingrediente', label: '🥚 Ingrediente', desc: 'Farinha, chocolate, ovos...' },
  { value: 'embalagem', label: '📦 Embalagem', desc: 'Caixas, potes, sacos...' },
  { value: 'material', label: '🎀 Material', desc: 'Adesivos, fitas, etiquetas...' },
]

function ModalInsumo({ insumo, onFechar, onSalvar }) {
  const isMobile = useIsMobile()
  const [form, setForm] = useState({
    nome: insumo?.nome || '',
    categoria: insumo?.categoria || 'ingrediente',
    unidade_compra: insumo?.unidade_compra || 'unidade',
    quantidade_por_unidade: insumo?.quantidade_por_unidade || 1,
    unidade_uso: insumo?.unidade_uso || 'unidade',
    preco_unidade: insumo?.preco_unidade || '',
    estoque_atual: insumo?.estoque_atual || 0,
    estoque_minimo: insumo?.estoque_minimo || 0,
    kcal_por_100: insumo?.kcal_por_100 || 0,
    carb_por_100: insumo?.carb_por_100 || 0,
    proteina_por_100: insumo?.proteina_por_100 || 0,
    gordura_por_100: insumo?.gordura_por_100 || 0,
    gordura_sat_por_100: insumo?.gordura_sat_por_100 || 0,
    gordura_trans_por_100: insumo?.gordura_trans_por_100 || 0,
    fibra_por_100: insumo?.fibra_por_100 || 0,
    sodio_por_100: insumo?.sodio_por_100 || 0,
    acucar_por_100: insumo?.acucar_por_100 || 0,
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
      kcal_por_100: parseFloat(form.kcal_por_100) || 0,
      carb_por_100: parseFloat(form.carb_por_100) || 0,
      proteina_por_100: parseFloat(form.proteina_por_100) || 0,
      gordura_por_100: parseFloat(form.gordura_por_100) || 0,
      gordura_sat_por_100: parseFloat(form.gordura_sat_por_100) || 0,
      gordura_trans_por_100: parseFloat(form.gordura_trans_por_100) || 0,
      fibra_por_100: parseFloat(form.fibra_por_100) || 0,
      sodio_por_100: parseFloat(form.sodio_por_100) || 0,
      acucar_por_100: parseFloat(form.acucar_por_100) || 0,
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 24 }}>
      <div onClick={onFechar} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 16px' : 32, maxWidth: 520, width: '100%', maxHeight: isMobile ? '95vh' : '92vh', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2C2C2A', margin: 0 }}>{insumo?.id ? 'Editar insumo' : 'Novo insumo'}</h2>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Categoria */}
          <div>
            <LabelComDica dica="Classifique o insumo para organizar melhor. Ingredientes vão para receitas. Embalagens e materiais também entram no custo." obrigatorio>Categoria</LabelComDica>
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
            <LabelComDica dica="Use um nome descritivo, de preferência com o tamanho ou quantidade. Ex: Chocolate em pó 200g, Caixinha kraft 9cm." obrigatorio>Nome</LabelComDica>
            <input style={inputStyle} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder={form.categoria === 'ingrediente' ? 'Ex: Chocolate em pó' : form.categoria === 'embalagem' ? 'Ex: Caixinha kraft 9cm' : 'Ex: Adesivo personalizado'} />
          </div>

          {/* Preço e unidades */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            <div>
              <LabelComDica dica="Como você compra esse insumo? Ex: kg, unidade, pacote. Para uma lata de leite condensado, seria unidade.">Unidade de compra</LabelComDica>
              <select style={inputStyle} value={form.unidade_compra} onChange={e => setForm(f => ({ ...f, unidade_compra: e.target.value }))}>
                {['unidade', 'pacote', 'caixa', 'kg', 'g', 'litro', 'ml', 'lata', 'rolo'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <LabelComDica dica="Quanto você paga por 1 unidade de compra. Ex: se compra 1kg de farinha por R$ 8,50, coloque 8,50.">Preço da unidade (R$)</LabelComDica>
              <input style={inputStyle} type="number" step="0.01" value={form.preco_unidade}
                onChange={e => setForm(f => ({ ...f, preco_unidade: e.target.value }))} placeholder="0,00" />
            </div>
          </div>

          {/* Conversão (só relevante se não for unidade simples) */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            <div>
              <LabelComDica dica="Quantas unidades de uso cabem em 1 unidade de compra. Ex: 1 kg = 1000g, então coloque 1000. 1 lata de leite condensado 395g = 395, coloque 395.">Quantidade por unidade comprada</LabelComDica>
              <input style={inputStyle} type="number" value={form.quantidade_por_unidade}
                onChange={e => setForm(f => ({ ...f, quantidade_por_unidade: e.target.value }))}
                placeholder={isIngrediente ? 'Ex: 1000 (1kg = 1000g)' : 'Ex: 10 (1 pacote = 10 un)'} />
            </div>
            <div>
              <LabelComDica dica="Como você mede esse insumo na hora de fazer a receita. Ingredientes sólidos geralmente são g, líquidos ml, embalagens são unidade.">Unidade de uso na receita</LabelComDica>
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
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            <div>
              <LabelComDica dica="Quantas unidades de compra você tem agora. Ex: se tem 2 latas, coloque 2. Se tem meio pacote de 1kg, coloque 0,5.">Estoque atual ({form.unidade_compra})</LabelComDica>
              <input style={inputStyle} type="number" value={form.estoque_atual}
                onChange={e => setForm(f => ({ ...f, estoque_atual: e.target.value }))} />
            </div>
            <div>
              <LabelComDica dica="Quando o estoque chegar abaixo desse valor, o sistema vai exibir um alerta de reposição. Ex: coloque 1 para ser avisado quando tiver menos de 1 unidade.">Estoque mínimo ({form.unidade_compra})</LabelComDica>
              <input style={inputStyle} type="number" value={form.estoque_minimo}
                onChange={e => setForm(f => ({ ...f, estoque_minimo: e.target.value }))} />
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '3px 0 0' }}>Alerta abaixo deste valor</p>
            </div>
          </div>

          {/* Tabela Nutricional — só para ingredientes */}
          {form.categoria === 'ingrediente' && (
            <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 14, border: '1px solid #bbf7d0' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#15803d', margin: '0 0 10px' }}>
                🥗 Informações Nutricionais <span style={{ fontWeight: 400, color: '#6b7280', fontSize: 12 }}>(por 100g/ml — opcional)</span>
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { campo: 'kcal_por_100', label: 'Calorias (kcal)' },
                  { campo: 'carb_por_100', label: 'Carboidratos (g)' },
                  { campo: 'acucar_por_100', label: 'Açúcares (g)' },
                  { campo: 'proteina_por_100', label: 'Proteínas (g)' },
                  { campo: 'gordura_por_100', label: 'Gorduras totais (g)' },
                  { campo: 'gordura_sat_por_100', label: 'Gorduras sat. (g)' },
                  { campo: 'gordura_trans_por_100', label: 'Gorduras trans (g)' },
                  { campo: 'fibra_por_100', label: 'Fibras (g)' },
                  { campo: 'sodio_por_100', label: 'Sódio (mg)' },
                ].map(({ campo, label }) => (
                  <div key={campo}>
                    <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 3 }}>{label}</label>
                    <input style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }} type="number" step="0.1" min="0"
                      value={form[campo]} onChange={e => setForm(f => ({ ...f, [campo]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '8px 0 0' }}>
                💡 Encontre esses valores na embalagem do produto ou em tabelas nutricionais online. O sistema calcula automaticamente para a receita inteira.
              </p>
            </div>
          )}

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
  const [busca, setBusca] = useState('')

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
  const filtrados = insumos
    .filter(i => categoriaFiltro === 'todos' || i.categoria === categoriaFiltro)
    .filter(i => !busca.trim() || i.nome.toLowerCase().includes(busca.toLowerCase()))

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

      {/* Campo de busca */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar insumo..."
          style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}
        />
        {busca && (
          <button onClick={() => setBusca('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18, lineHeight: 1 }}>✕</button>
        )}
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
