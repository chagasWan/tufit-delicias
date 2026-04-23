import { useState, useEffect } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, X, Upload, Clock, BookOpen } from 'lucide-react'
import { LabelComDica } from '../../components/Tooltip'
import { BotaoTabelaNutricional } from '../../components/TabelaNutricional'
import toast from 'react-hot-toast'

function ModalProduto({ produto, categorias, receitas, onFechar, onSalvar }) {
  const isMobile = useIsMobile()
  const [form, setForm] = useState({
    nome: produto?.nome || '',
    descricao: produto?.descricao || '',
    preco: produto?.preco || '',
    preco_custo: produto?.preco_custo || '',
    receita_id: produto?.receita_id || '',
    categoria_id: produto?.categoria_id || '',
    prazo_minimo_horas: produto?.prazo_minimo_horas || 4,
    horarios_retirada: produto?.horarios_retirada?.join(', ') || '09:00, 14:00, 16:00, 18:00',
    horarios_entrega: produto?.horarios_entrega?.join(', ') || '12:00, 18:00, 19:00',
    ingredientes_destaque: produto?.ingredientes_destaque?.join(', ') || '',
    destaque: produto?.destaque || false,
    ativo: produto?.ativo ?? true,
    foto_url: produto?.foto_url || '',
    capacidade_dia: produto?.capacidade_dia || 10,
  })
  const [salvando, setSalvando] = useState(false)
  const [uploadando, setUploadando] = useState(false)
  const [recalculando, setRecalculando] = useState(false)

  // Ao abrir o modal com receita vinculada, recalcula e salva o custo automaticamente
  useEffect(() => {
    if (produto?.id && produto?.receita_id) {
      recalcularEAutosalvar(produto.receita_id, produto.id)
    }
  }, [])

  async function recalcularEAutosalvar(receitaId, produtoId) {
    if (!receitaId) return
    setRecalculando(true)
    const { data: receita } = await supabase
      .from('receitas')
      .select('rendimento, receita_ingredientes(quantidade, ingredientes(preco_unidade, quantidade_por_unidade, kcal_por_100, carb_por_100, proteina_por_100, gordura_por_100, gordura_sat_por_100, gordura_trans_por_100, fibra_por_100, sodio_por_100, acucar_por_100))')
      .eq('id', receitaId)
      .single()

    if (receita) {
      const custo = (receita.receita_ingredientes || []).reduce((acc, ri) => {
        if (!ri.ingredientes) return acc
        return acc + (ri.ingredientes.preco_unidade / ri.ingredientes.quantidade_por_unidade) * ri.quantidade
      }, 0)
      const custoPorUnidade = receita.rendimento > 0 ? custo / receita.rendimento : 0

      // Calcular tabela nutricional por porção
      const CAMPOS_NUTRI = ['kcal_por_100','carb_por_100','proteina_por_100','gordura_por_100','gordura_sat_por_100','gordura_trans_por_100','fibra_por_100','sodio_por_100','acucar_por_100']
      const nutri = {}
      CAMPOS_NUTRI.forEach(campo => {
        const total = (receita.receita_ingredientes || []).reduce((soma, ri) => {
          const v = ri.ingredientes?.[campo] || 0
          return soma + (v * ri.quantidade) / 100
        }, 0)
        nutri[campo.replace('_por_100', '_porcao')] = receita.rendimento > 0 ? parseFloat((total / receita.rendimento).toFixed(2)) : 0
      })

      if (custoPorUnidade > 0 || Object.values(nutri).some(v => v > 0)) {
        const updates = {}
        if (custoPorUnidade > 0) {
          const novoCusto = custoPorUnidade.toFixed(4)
          setForm(f => ({ ...f, preco_custo: novoCusto }))
          updates.preco_custo = parseFloat(novoCusto)
        }
        // Guardar nutrição como JSON no campo descricao_nutricional (vamos usar metadata)
        updates.nutricao = nutri
        if (produtoId) {
          await supabase.from('produtos').update(updates).eq('id', produtoId)
        }
      }
    }
    setRecalculando(false)
  }

  async function recalcularCusto(receitaId) {
    if (!receitaId) return
    setRecalculando(true)
    const { data: receita } = await supabase
      .from('receitas')
      .select('rendimento, receita_ingredientes(quantidade, ingredientes(preco_unidade, quantidade_por_unidade))')
      .eq('id', receitaId)
      .single()

    if (receita) {
      const custo = (receita.receita_ingredientes || []).reduce((acc, ri) => {
        if (!ri.ingredientes) return acc
        return acc + (ri.ingredientes.preco_unidade / ri.ingredientes.quantidade_por_unidade) * ri.quantidade
      }, 0)
      const custoPorUnidade = receita.rendimento > 0 ? custo / receita.rendimento : 0
      if (custoPorUnidade > 0) {
        setForm(f => ({ ...f, preco_custo: custoPorUnidade.toFixed(4) }))
      }
    }
    setRecalculando(false)
  }

  // Quando seleciona receita, busca custo atualizado do banco
  async function handleReceitaChange(receitaId) {
    const receitaLocal = receitas.find(r => r.id === receitaId)
    setForm(f => ({ ...f, receita_id: receitaId, nome: f.nome || receitaLocal?.nome || '' }))
    if (receitaId) await recalcularCusto(receitaId)
    else setForm(f => ({ ...f, receita_id: '' }))
  }

  function atualizar(campo, valor) { setForm(f => ({ ...f, [campo]: valor })) }

  async function handleUploadFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('Foto muito grande. Máximo 5MB.')
    setUploadando(true)
    const ext = file.name.split('.').pop()
    const nome = `produtos/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('fotos').upload(nome, file, { upsert: true })
    if (error) { toast.error('Erro ao enviar foto') }
    else {
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
      preco_custo: form.preco_custo ? parseFloat(form.preco_custo) : null,
      receita_id: form.receita_id || null,
      categoria_id: form.categoria_id || null,
      prazo_minimo_horas: parseInt(form.prazo_minimo_horas) || 4,
      horarios_retirada: form.horarios_retirada.split(',').map(h => h.trim()).filter(Boolean),
      horarios_entrega: form.horarios_entrega.split(',').map(h => h.trim()).filter(Boolean),
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
    if (error) { toast.error('Erro ao salvar produto'); console.error(error) }
    else { toast.success(produto?.id ? 'Produto atualizado!' : 'Produto criado!'); onSalvar() }
    setSalvando(false)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }
  const labelStyle = { fontSize: 13, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 5 }

  const receitaVinculada = receitas.find(r => r.id === form.receita_id)
  const margem = form.preco && form.preco_custo && parseFloat(form.preco_custo) > 0
    ? ((parseFloat(form.preco) - parseFloat(form.preco_custo)) / parseFloat(form.preco) * 100)
    : null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 24 }}>
      <div onClick={onFechar} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 16px' : 32, maxWidth: 580, width: '100%', maxHeight: isMobile ? '95vh' : '90vh', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2C2C2A', margin: 0 }}>{produto?.id ? 'Editar produto' : 'Novo produto'}</h2>
          <button onClick={onFechar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Receita vinculada — campo principal */}
          <div style={{ background: '#f0fdf4', borderRadius: 14, padding: 16, border: '1px solid #bbf7d0' }}>
            <LabelComDica dica="Vincule a receita deste produto. O custo por unidade será calculado automaticamente com base nos insumos da receita. Se não vincular, preencha o custo manualmente.">Receita vinculada</LabelComDica>
            <select style={{ ...inputStyle, border: '1.5px solid #86efac' }} value={form.receita_id} onChange={e => handleReceitaChange(e.target.value)}>
              <option value="">Selecione a receita deste produto...</option>
              {receitas.map(r => <option key={r.id} value={r.id}>{r.nome} (rende {r.rendimento} {r.unidade_rendimento})</option>)}
            </select>
            {receitaVinculada && form.preco_custo && (
              <p style={{ fontSize: 12, color: '#15803d', margin: '6px 0 0' }}>
                ✓ Custo por unidade calculado automaticamente: <strong>R$ {parseFloat(form.preco_custo).toFixed(2).replace('.', ',')}</strong>
              </p>
            )}
            {!receitaVinculada && (
              <p style={{ fontSize: 12, color: '#6b7280', margin: '6px 0 0' }}>Ao vincular uma receita, o custo é preenchido automaticamente</p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <LabelComDica dica="Nome que aparece no cardápio para os clientes. Use algo claro e apetitoso. Ex: Brigadeiro Fit de Cacau 70%." obrigatorio>Nome do produto</LabelComDica>
              <input style={inputStyle} value={form.nome} onChange={e => atualizar('nome', e.target.value)} placeholder="Ex: Brigadeiro Fit" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <LabelComDica dica="Descrição curta que aparece no cardápio. Destaque os diferenciais: ingredientes especiais, benefícios, tamanho, etc.">Descrição</LabelComDica>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={2} value={form.descricao} onChange={e => atualizar('descricao', e.target.value)} placeholder="Descreva o produto..." />
            </div>

            <div style={{ gridColumn: isMobile ? '1 / -1' : undefined }}>
              <LabelComDica dica="Preço que o cliente vai pagar. O sistema mostra a margem de lucro automaticamente ao comparar com o custo." obrigatorio>Preço de venda (R$)</LabelComDica>
              <input style={inputStyle} type="number" step="0.01" min="0" value={form.preco} onChange={e => atualizar('preco', e.target.value)} placeholder="0,00" />
            </div>
            <div style={{ gridColumn: isMobile ? '1 / -1' : undefined }}>
              <LabelComDica dica="Custo de produção de 1 unidade deste produto. Preenchido automaticamente quando uma receita é vinculada. Inclui ingredientes, embalagens e materiais. Sempre recalculado com os preços atuais dos insumos ao abrir esta tela.">{recalculando ? '⏳ Recalculando custo...' : 'Custo por unidade (R$)'}</LabelComDica>
              <input style={inputStyle} type="number" step="0.0001" min="0" value={form.preco_custo}
                onChange={e => atualizar('preco_custo', e.target.value)} placeholder="Preenchido pela receita" />
            </div>
          </div>

          {/* Margem calculada */}
          {margem !== null && (
            <div style={{ background: margem >= 30 ? '#f0fdf4' : '#fffbeb', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>Margem de lucro calculada:</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: margem >= 30 ? '#15803d' : '#d97706' }}>
                {margem.toFixed(1)}%
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <LabelComDica dica="Categoria do produto no cardápio. Ajuda os clientes a filtrar o que procuram. Ex: Docinhos, Bolos, Granolas.">Categoria</LabelComDica>
              <select style={inputStyle} value={form.categoria_id} onChange={e => atualizar('categoria_id', e.target.value)}>
                <option value="">Selecione...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <LabelComDica dica="Antecedência mínima que o cliente precisa ter para fazer o pedido. Ex: 24 = pedido com pelo menos 1 dia de antecedência. Impede pedidos para datas impossíveis.">Prazo mínimo (horas)</LabelComDica>
              <input style={inputStyle} type="number" min="1" value={form.prazo_minimo_horas} onChange={e => atualizar('prazo_minimo_horas', e.target.value)} />
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
                {form.prazo_minimo_horas < 24 ? form.prazo_minimo_horas + 'h' : Math.floor(form.prazo_minimo_horas/24) + ' dia(s)'} de antecedência
              </p>
            </div>
            <div>
              <LabelComDica dica="Quantidade máxima que você consegue produzir deste produto por dia. Ainda não está sendo usada para bloquear pedidos, mas serve como referência.">Capacidade por dia</LabelComDica>
              <input style={inputStyle} type="number" min="1" value={form.capacidade_dia} onChange={e => atualizar('capacidade_dia', e.target.value)} />
            </div>
            <div>
              <LabelComDica dica="Horários disponíveis para o cliente retirar pessoalmente. Separe por vírgula. Ex: 09:00, 14:00, 18:00.">🏠 Horários de retirada</LabelComDica>
              <input style={inputStyle} value={form.horarios_retirada} onChange={e => atualizar('horarios_retirada', e.target.value)} placeholder="09:00, 14:00, 16:00, 18:00" />
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>Horários disponíveis para retirada no local</p>
            </div>
            <div>
              <LabelComDica dica="Horários disponíveis para entrega em domicílio. Podem ser diferentes da retirada. Ex: 12:00, 18:00, 19:00.">🚗 Horários de entrega</LabelComDica>
              <input style={inputStyle} value={form.horarios_entrega} onChange={e => atualizar('horarios_entrega', e.target.value)} placeholder="12:00, 18:00, 19:00" />
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>Horários disponíveis para entrega em casa</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <LabelComDica dica="Palavras que aparecem como badges no cardápio. Use para destacar diferenciais. Ex: Sem açúcar, Sem glúten, Sem lactose, Vegano.">Tags (separadas por vírgula)</LabelComDica>
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
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#2C2C2A' }}>
              <input type="checkbox" checked={form.destaque} onChange={e => atualizar('destaque', e.target.checked)} />
              Produto em destaque
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#2C2C2A' }}>
              <input type="checkbox" checked={form.ativo} onChange={e => atualizar('ativo', e.target.checked)} />
              Produto ativo
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={onFechar} style={{ flex: 1, background: 'transparent', color: '#6b7280', padding: '12px', borderRadius: 20, border: '1.5px solid #e5e7eb', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
            <button onClick={handleSalvar} disabled={salvando}
              style={{ flex: 2, background: salvando ? '#f9a8d4' : '#D4537E', color: '#fff', padding: '12px', borderRadius: 20, border: 'none', cursor: salvando ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 15 }}>
              {salvando ? 'Salvando...' : produto?.id ? 'Salvar alterações' : 'Criar produto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminProdutos() {
  const isMobile = useIsMobile()
  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [receitas, setReceitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [atualizandoCustos, setAtualizandoCustos] = useState(false)
  const [taxasIfood, setTaxasIfood] = useState({ comissao: 27, pagamento: 2.5, embalagem: 0 })
  const [mostrarIfood, setMostrarIfood] = useState(false)

  useEffect(() => { buscarDados() }, [])

  async function buscarDados() {
    const [{ data: p }, { data: c }, { data: r }] = await Promise.all([
      supabase.from('produtos').select('*').order('created_at', { ascending: false }),
      supabase.from('categorias').select('*').eq('ativo', true).order('ordem'),
      supabase.from('receitas').select('*, receita_ingredientes(*, ingredientes(*))').order('nome'),
    ])
    setProdutos(p || [])
    setCategorias(c || [])
    setReceitas(r || [])
    setLoading(false)

    // Recalcular e salvar custo de todos os produtos com receita vinculada em segundo plano
    const produtosComReceita = (p || []).filter(prod => prod.receita_id)
    if (produtosComReceita.length > 0) {
      setAtualizandoCustos(true)
      const receitasMap = {}
      ;(r || []).forEach(rec => { receitasMap[rec.id] = rec })

      const updates = []
      produtosComReceita.forEach(prod => {
        const receita = receitasMap[prod.receita_id]
        if (!receita) return
        const custo = (receita.receita_ingredientes || []).reduce((acc, ri) => {
          if (!ri.ingredientes) return acc
          return acc + (ri.ingredientes.preco_unidade / ri.ingredientes.quantidade_por_unidade) * ri.quantidade
        }, 0)
        const custoPorUnidade = receita.rendimento > 0 ? custo / receita.rendimento : 0
        if (custoPorUnidade > 0) {
          updates.push({ id: prod.id, preco_custo: parseFloat(custoPorUnidade.toFixed(4)) })
        }
      })

      // Salvar todos os custos atualizados
      await Promise.all(updates.map(u =>
        supabase.from('produtos').update({ preco_custo: u.preco_custo }).eq('id', u.id)
      ))

      // Atualizar a lista local com os novos custos (sem precisar rebuscar do banco)
      if (updates.length > 0) {
        setProdutos(prev => prev.map(prod => {
          const upd = updates.find(u => u.id === prod.id)
          return upd ? { ...prod, preco_custo: upd.preco_custo } : prod
        }))
      }
      setAtualizandoCustos(false)
    }
  }

  async function toggleAtivo(produto) {
    const { error } = await supabase.from('produtos').update({ ativo: !produto.ativo }).eq('id', produto.id)
    if (!error) { toast.success(produto.ativo ? 'Produto desativado' : 'Produto ativado'); buscarDados() }
  }

  async function toggleDestaque(produto) {
    const { error } = await supabase.from('produtos').update({ destaque: !produto.destaque }).eq('id', produto.id)
    if (!error) { toast.success(produto.destaque ? 'Removido dos destaques' : 'Adicionado aos destaques'); buscarDados() }
  }

  async function excluirProduto(id) {
    if (!confirm('Excluir este produto?')) return
    const { error } = await supabase.from('produtos').delete().eq('id', id)
    if (!error) { toast.success('Produto excluído'); buscarDados() }
  }

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

  function nomeReceita(id) {
    return receitas.find(r => r.id === id)?.nome || ''
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Painel iFood */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #fed7aa', marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', cursor: 'pointer', background: mostrarIfood ? '#fff7ed' : '#fff' }} onClick={() => setMostrarIfood(v => !v)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🛵</span>
            <span style={{ fontWeight: 600, color: '#c2410c', fontSize: 14 }}>Simulação iFood</span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>— veja como ficam os preços com as taxas da plataforma</span>
          </div>
          <span style={{ color: '#9ca3af', fontSize: 12 }}>{mostrarIfood ? '▲ Ocultar' : '▼ Configurar'}</span>
        </div>
        {mostrarIfood && (
          <div style={{ padding: '0 18px 16px', borderTop: '1px solid #fed7aa' }}>
            <p style={{ fontSize: 12, color: '#92400e', margin: '12px 0 10px' }}>
              Configure as taxas do iFood para ver a margem real e o preço sugerido de cada produto na plataforma.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 4 }}>Comissão iFood (%)</label>
                <input type="number" step="0.1" min="0" max="40" value={taxasIfood.comissao}
                  onChange={e => setTaxasIfood(t => ({ ...t, comissao: parseFloat(e.target.value) || 0 }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #fed7aa', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '3px 0 0' }}>Padrão: 27%</p>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 4 }}>Taxa de pagamento (%)</label>
                <input type="number" step="0.1" min="0" max="10" value={taxasIfood.pagamento}
                  onChange={e => setTaxasIfood(t => ({ ...t, pagamento: parseFloat(e.target.value) || 0 }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #fed7aa', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '3px 0 0' }}>Padrão: 2,5%</p>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 4 }}>Custo embalagem (R$)</label>
                <input type="number" step="0.01" min="0" value={taxasIfood.embalagem}
                  onChange={e => setTaxasIfood(t => ({ ...t, embalagem: parseFloat(e.target.value) || 0 }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #fed7aa', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '3px 0 0' }}>Ex: sacola, isopor</p>
              </div>
            </div>
            <div style={{ marginTop: 10, padding: '8px 12px', background: '#fff7ed', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
              <strong>Total de taxas: {(taxasIfood.comissao + taxasIfood.pagamento).toFixed(1)}%</strong> — para cada R$ 100 vendidos, o iFood fica com R$ {(taxasIfood.comissao + taxasIfood.pagamento).toFixed(2)} e você recebe R$ {(100 - taxasIfood.comissao - taxasIfood.pagamento).toFixed(2)}.
            </div>
          </div>
        )}
      </div>

      {atualizandoCustos && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
          ⏳ Atualizando custos de produção com os preços atuais dos insumos...
        </div>
      )}
      {modalAberto && (
        <ModalProduto
          produto={produtoEditando}
          categorias={categorias}
          receitas={receitas}
          onFechar={() => { setModalAberto(false); setProdutoEditando(null) }}
          onSalvar={() => { setModalAberto(false); setProdutoEditando(null); buscarDados() }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#2C2C2A', margin: 0 }}>Produtos</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: '4px 0 0' }}>{produtos.length} produtos cadastrados</p>
        </div>
        <button onClick={() => { setProdutoEditando(null); setModalAberto(true) }}
          style={{ background: '#D4537E', color: '#fff', padding: '12px 20px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> Novo produto
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { key: 'todos', label: 'Total', valor: produtos.length, cor: '#6b7280' },
          { key: 'ativos', label: 'Ativos', valor: produtos.filter(p => p.ativo).length, cor: '#10b981' },
          { key: 'destaque', label: 'Em destaque', valor: produtos.filter(p => p.destaque).length, cor: '#f59e0b' },
          { key: 'inativos', label: 'Inativos', valor: produtos.filter(p => !p.ativo).length, cor: '#ef4444' },
        ].map(item => (
          <div key={item.key} onClick={() => setFiltro(item.key)}
            style={{ background: '#fff', border: filtro === item.key ? '2px solid ' + item.cor : '1px solid #f3f4f6', borderRadius: 14, padding: '14px 18px', cursor: 'pointer' }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: item.cor, margin: '0 0 2px' }}>{item.valor}</p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{item.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} style={{ background: '#fff', borderRadius: 14, height: 80, border: '1px solid #f3f4f6' }} />)}
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p>Nenhum produto encontrado</p>
          <button onClick={() => setModalAberto(true)} style={{ marginTop: 16, background: '#D4537E', color: '#fff', padding: '10px 24px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            Criar primeiro produto
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {produtosFiltrados.map(p => {
            const margem = p.preco && p.preco_custo && p.preco_custo > 0
              ? ((p.preco - p.preco_custo) / p.preco * 100)
              : null
            return (
              <div key={p.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: '#FBEAF0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {p.foto_url ? <img src={p.foto_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>🍰</span>}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, color: '#2C2C2A', fontSize: 15 }}>{p.nome}</span>
                    {p.destaque && <span style={{ background: '#fffbeb', color: '#d97706', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Destaque</span>}
                    {!p.ativo && <span style={{ background: '#fef2f2', color: '#ef4444', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Inativo</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ color: '#D4537E', fontWeight: 700, fontSize: 15 }}>R$ {p.preco?.toFixed(2).replace('.', ',')}</span>
                    {p.preco_custo > 0 && <span style={{ fontSize: 13, color: '#6b7280' }}>Custo: R$ {p.preco_custo.toFixed(2).replace('.', ',')}</span>}
                    {margem !== null && (
                      <span style={{ fontSize: 12, fontWeight: 600, background: margem >= 30 ? '#f0fdf4' : '#fffbeb', color: margem >= 30 ? '#15803d' : '#d97706', padding: '2px 8px', borderRadius: 10 }}>
                        {margem.toFixed(0)}% margem
                      </span>
                    )}
                    {mostrarIfood && p.preco_custo > 0 && (() => {
                      const taxaTotal = (taxasIfood.comissao + taxasIfood.pagamento) / 100
                      const custoComEmbalagem = p.preco_custo + (taxasIfood.embalagem || 0)
                      const precoLiquidoIfood = p.preco * (1 - taxaTotal)
                      const margemIfood = precoLiquidoIfood > 0 ? ((precoLiquidoIfood - custoComEmbalagem) / precoLiquidoIfood * 100) : 0
                      const precoSugeridoIfood = custoComEmbalagem / (1 - taxaTotal) / (1 - (margem !== null ? margem / 100 : 0.35))
                      return (
                        <span style={{ fontSize: 12, fontWeight: 600, background: '#fff7ed', color: '#c2410c', padding: '2px 8px', borderRadius: 10, border: '1px solid #fed7aa' }}>
                          🛵 iFood: {margemIfood.toFixed(0)}% margem · sugerido R$ {precoSugeridoIfood.toFixed(2).replace('.', ',')}
                        </span>
                      )
                    })()}
                    {p.receita_id && <span style={{ fontSize: 12, color: '#8b5cf6', background: '#f5f3ff', padding: '2px 8px', borderRadius: 10 }}>📖 {nomeReceita(p.receita_id)}</span>}
                    {p.nutricao && Object.values(p.nutricao).some(v => v > 0) && (
                      <BotaoTabelaNutricional nutricao={p.nutricao} nomeProduto={p.nome} />
                    )}
                    <span style={{ fontSize: 13, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={12} /> {formatarPrazo(p.prazo_minimo_horas)}
                    </span>
                    {p.categoria_id && <span style={{ fontSize: 13, color: '#9ca3af' }}>{nomeDaCategoria(p.categoria_id)}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => toggleDestaque(p)} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e5e7eb', background: p.destaque ? '#fffbeb' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.destaque ? '#d97706' : '#9ca3af' }}>
                    <Star size={15} fill={p.destaque ? '#d97706' : 'none'} />
                  </button>
                  <button onClick={() => toggleAtivo(p)} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e5e7eb', background: p.ativo ? '#ecfdf5' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.ativo ? '#10b981' : '#9ca3af' }}>
                    {p.ativo ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button onClick={() => { setProdutoEditando(p); setModalAberto(true) }} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => excluirProduto(p.id)} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                    <Trash2 size={15} />
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
