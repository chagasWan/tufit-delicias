import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, X, Upload, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

function ModalProduto({ produto, categorias, onFechar, onSalvar }) {
  const [form, setForm] = useState({
    nome: produto?.nome || '',
    descricao: produto?.descricao || '',
    preco: produto?.preco || '',
    categoria_id: produto?.categoria_id || '',
    prazo_minimo_horas: produto?.prazo_minimo_horas || 4,
    horarios_retirada: produto?.horarios_retirada?.join(', ') || '09:00, 14:00, 16:00, 18:00',
    ingredientes_destaque: produto?.ingredientes_destaque?.join(', ') || '',
    destaque: produto?.destaque || false,
    ativo: produto?.ativo ?? true,
    foto_url: produto?.foto_url || '',
    capacidade_dia: produto?.capacidade_dia || 10,
  })
  const [salvando, setSalvando] = useState(false)
  const [uploadando, setUploadando] = useState(false)

  function atualizar(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  async function handleUploadFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('Foto muito grande. Máximo 5MB.')
    setUploadando(true)
    const ext = file.name.split('.').pop()
    const nome = `produtos/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('fotos').upload(nome, file, { upsert: true })
    if (error) {
      toast.error('Erro ao enviar foto')
    } else {
      const { data: url } = supabase.storage.from('fotos').getPublicUrl(nome)
      atualizar('foto_url', url.publicUrl)
      toast.success('Foto enviada!')
    }
    setUploadando(false)
  }

  async function handleSalvar() {
    if (!form.nome.trim()) return toast.error('Digite o nome do produto')
    if (!form.preco || isNaN(form.preco)) return toast.error('Digite um preço válido')
    setSalvando(true)
    const dados = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      preco: parseFloat(form.preco),
      categoria_id: form.categoria_id || null,
      prazo_minimo_horas: parseInt(form.prazo_minimo_horas) || 4,
      horarios_retirada: form.horarios_retirada.split(',').map(h => h.trim()).filter(Boolean),
      ingredientes_destaque: form.ingredientes_destaque.split(',').map(t => t.trim()).filter(Boolean),
      destaque: form.destaque,
      ativo: form.ativo,
      foto_url: form.foto_url || null,
      capacidade_dia: parseInt(form.capacidade_dia) || 10,
    }
    let error
    if (produto?.id) {
      const res = await supabase.from('produtos').update(dados).eq('id', produto.id)
      error = res.error
    } else {
      const res = await supabase.from('produtos').insert(dados)
      error = res.error
    }
    if (error) {
      toast.error('Erro ao salvar produto')
      console.error(error)
    } else {
      toast.success(produto?.id ? 'Produto atualizado!' : 'Produto criado!')
      onSalvar()
    }
    setSalvando(false)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }
  const labelStyle = { fontSize: 13, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 5 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onFechar} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: 32, maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2C2C2A', margin: 0 }}>
            {produto?.id ? 'Editar produto' : 'Novo produto'}
          </h2>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nome do produto *</label>
              <input style={inputStyle} value={form.nome} onChange={e => atualizar('nome', e.target.value)} placeholder="Ex: Brigadeiro Fit" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Descrição</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={form.descricao} onChange={e => atualizar('descricao', e.target.value)} placeholder="Descreva o produto..." />
            </div>
            <div>
              <label style={labelStyle}>Preço (R$) *</label>
              <input style={inputStyle} type="number" step="0.01" min="0" value={form.preco} onChange={e => atualizar('preco', e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select style={inputStyle} value={form.categoria_id} onChange={e => atualizar('categoria_id', e.target.value)}>
                <option value="">Selecione...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Prazo mínimo (horas)</label>
              <input style={inputStyle} type="number" min="1" value={form.prazo_minimo_horas} onChange={e => atualizar('prazo_minimo_horas', e.target.value)} />
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
                {form.prazo_minimo_horas < 24 ? form.prazo_minimo_horas + 'h' : Math.floor(form.prazo_minimo_horas/24) + ' dia(s)'} de antecedência
              </p>
            </div>
            <div>
              <label style={labelStyle}>Capacidade por dia</label>
              <input style={inputStyle} type="number" min="1" value={form.capacidade_dia} onChange={e => atualizar('capacidade_dia', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Horários de retirada (separados por vírgula)</label>
              <input style={inputStyle} value={form.horarios_retirada} onChange={e => atualizar('horarios_retirada', e.target.value)} placeholder="09:00, 14:00, 16:00, 18:00" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Tags / ingredientes destaque (separados por vírgula)</label>
              <input style={inputStyle} value={form.ingredientes_destaque} onChange={e => atualizar('ingredientes_destaque', e.target.value)} placeholder="Sem açúcar, Sem glúten, Sem lactose" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Foto do produto</label>
            {form.foto_url && (
              <div style={{ marginBottom: 10 }}>
                <img src={form.foto_url} alt="preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, border: '1px solid #e5e7eb' }} />
              </div>
            )}
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f9fafb', border: '1.5px dashed #d1d5db', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontSize: 14, color: '#6b7280' }}>
              <Upload size={16} />
              {uploadando ? 'Enviando...' : 'Escolher foto'}
              <input type="file" accept="image/*" onChange={handleUploadFoto} style={{ display: 'none' }} disabled={uploadando} />
            </label>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>JPG, PNG ou WebP. Máximo 5MB.</p>
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#2C2C2A' }}>
              <input type="checkbox" checked={form.destaque} onChange={e => atualizar('destaque', e.target.checked)} />
              Produto em destaque
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#2C2C2A' }}>
              <input type="checkbox" checked={form.ativo} onChange={e => atualizar('ativo', e.target.checked)} />
              Produto ativo (visível no site)
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={onFechar} style={{ flex: 1, background: 'transparent', color: '#6b7280', padding: '12px', borderRadius: 20, border: '1.5px solid #e5e7eb', cursor: 'pointer', fontWeight: 500 }}>
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={salvando}
              style={{ flex: 2, background: salvando ? '#f9a8d4' : '#D4537E', color: '#fff', padding: '12px', borderRadius: 20, border: 'none', cursor: salvando ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 15 }}
            >
              {salvando ? 'Salvando...' : produto?.id ? 'Salvar alterações' : 'Criar produto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminProdutos() {
  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    buscarProdutos()
    buscarCategorias()
  }, [])

  async function buscarProdutos() {
    const { data } = await supabase.from('produtos').select('*').order('created_at', { ascending: false })
    setProdutos(data || [])
    setLoading(false)
  }

  async function buscarCategorias() {
    const { data } = await supabase.from('categorias').select('*').eq('ativo', true).order('ordem')
    setCategorias(data || [])
  }

  async function toggleAtivo(produto) {
    const { error } = await supabase.from('produtos').update({ ativo: !produto.ativo }).eq('id', produto.id)
    if (!error) {
      toast.success(produto.ativo ? 'Produto desativado' : 'Produto ativado')
      buscarProdutos()
    }
  }

  async function toggleDestaque(produto) {
    const { error } = await supabase.from('produtos').update({ destaque: !produto.destaque }).eq('id', produto.id)
    if (!error) {
      toast.success(produto.destaque ? 'Removido dos destaques' : 'Adicionado aos destaques')
      buscarProdutos()
    }
  }

  async function excluirProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    const { error } = await supabase.from('produtos').delete().eq('id', id)
    if (!error) {
      toast.success('Produto excluído')
      buscarProdutos()
    }
  }

  function abrirNovo() { setProdutoEditando(null); setModalAberto(true) }
  function abrirEditar(p) { setProdutoEditando(p); setModalAberto(true) }
  function fecharModal() { setModalAberto(false); setProdutoEditando(null) }
  function aoSalvar() { fecharModal(); buscarProdutos() }

  const produtosFiltrados = filtro === 'todos' ? produtos
    : filtro === 'ativos' ? produtos.filter(p => p.ativo)
    : filtro === 'inativos' ? produtos.filter(p => !p.ativo)
    : produtos.filter(p => p.destaque)

  function formatarPrazo(h) {
    if (!h) return '—'
    if (h < 24) return h + 'h'
    return Math.floor(h / 24) + 'd'
  }

  function nomeDaCategoria(id) {
    return categorias.find(c => c.id === id)?.nome || ''
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {modalAberto && (
        <ModalProduto
          produto={produtoEditando}
          categorias={categorias}
          onFechar={fecharModal}
          onSalvar={aoSalvar}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#2C2C2A', margin: 0 }}>Produtos</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: '4px 0 0' }}>{produtos.length} produtos cadastrados</p>
        </div>
        <button
          onClick={abrirNovo}
          style={{ background: '#D4537E', color: '#fff', padding: '12px 20px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={18} />
          Novo produto
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { key: 'todos', label: 'Total', valor: produtos.length, cor: '#6b7280' },
          { key: 'ativos', label: 'Ativos', valor: produtos.filter(p => p.ativo).length, cor: '#10b981' },
          { key: 'destaque', label: 'Em destaque', valor: produtos.filter(p => p.destaque).length, cor: '#f59e0b' },
          { key: 'inativos', label: 'Inativos', valor: produtos.filter(p => !p.ativo).length, cor: '#ef4444' },
        ].map(item => (
          <div
            key={item.key}
            onClick={() => setFiltro(item.key)}
            style={{ background: '#fff', border: filtro === item.key ? '2px solid ' + item.cor : '1px solid #f3f4f6', borderRadius: 14, padding: '14px 18px', cursor: 'pointer' }}
          >
            <p style={{ fontSize: 26, fontWeight: 800, color: item.cor, margin: '0 0 2px' }}>{item.valor}</p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{item.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} style={{ background: '#fff', borderRadius: 16, height: 120, border: '1px solid #f3f4f6' }} />)}
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p>Nenhum produto encontrado</p>
          <button onClick={abrirNovo} style={{ marginTop: 16, background: '#D4537E', color: '#fff', padding: '10px 24px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            Criar primeiro produto
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {produtosFiltrados.map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: '#FBEAF0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {p.foto_url
                  ? <img src={p.foto_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 24 }}>🍰</span>}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, color: '#2C2C2A', fontSize: 15 }}>{p.nome}</span>
                  {p.destaque && <span style={{ background: '#fffbeb', color: '#d97706', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Destaque</span>}
                  {!p.ativo && <span style={{ background: '#fef2f2', color: '#ef4444', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Inativo</span>}
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ color: '#D4537E', fontWeight: 700, fontSize: 15 }}>R$ {p.preco?.toFixed(2).replace('.', ',')}</span>
                  <span style={{ fontSize: 13, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={12} /> {formatarPrazo(p.prazo_minimo_horas)} antecedência
                  </span>
                  {p.categoria_id && (
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>{nomeDaCategoria(p.categoria_id)}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => toggleDestaque(p)} title={p.destaque ? 'Remover destaque' : 'Destacar'}
                  style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e5e7eb', background: p.destaque ? '#fffbeb' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.destaque ? '#d97706' : '#9ca3af' }}>
                  <Star size={15} fill={p.destaque ? '#d97706' : 'none'} />
                </button>
                <button onClick={() => toggleAtivo(p)} title={p.ativo ? 'Desativar' : 'Ativar'}
                  style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e5e7eb', background: p.ativo ? '#ecfdf5' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.ativo ? '#10b981' : '#9ca3af' }}>
                  {p.ativo ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button onClick={() => abrirEditar(p)} title="Editar"
                  style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                  <Edit2 size={15} />
                </button>
                <button onClick={() => excluirProduto(p.id)} title="Excluir"
                  style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
