import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, RefreshCw, Tag, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function ModalCupom({ cupom, onFechar, onSalvar }) {
  const [form, setForm] = useState({
    codigo: cupom?.codigo || '',
    tipo: cupom?.tipo || 'percentual',
    valor: cupom?.valor || '',
    uso_maximo: cupom?.uso_maximo || '',
    valido_ate: cupom?.valido_ate || '',
    ativo: cupom?.ativo ?? true,
  })
  const [salvando, setSalvando] = useState(false)

  async function handleSalvar() {
    if (!form.codigo.trim()) return toast.error('Digite o código do cupom')
    if (!form.valor || isNaN(form.valor)) return toast.error('Digite um valor válido')
    if (form.tipo === 'percentual' && (parseFloat(form.valor) <= 0 || parseFloat(form.valor) > 100))
      return toast.error('Percentual deve ser entre 1 e 100')

    setSalvando(true)
    const dados = {
      codigo: form.codigo.trim().toUpperCase(),
      tipo: form.tipo,
      valor: parseFloat(form.valor),
      uso_maximo: form.uso_maximo ? parseInt(form.uso_maximo) : null,
      valido_ate: form.valido_ate || null,
      ativo: form.ativo,
    }

    let error
    if (cupom?.id) {
      const res = await supabase.from('cupons').update(dados).eq('id', cupom.id)
      error = res.error
    } else {
      const res = await supabase.from('cupons').insert({ ...dados, uso_atual: 0 })
      error = res.error
    }

    if (error) {
      if (error.code === '23505') toast.error('Já existe um cupom com esse código')
      else toast.error('Erro ao salvar cupom')
    } else {
      toast.success(cupom?.id ? 'Cupom atualizado!' : 'Cupom criado!')
      onSalvar()
    }
    setSalvando(false)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #fce7f3', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }
  const labelStyle = { fontSize: 13, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 6 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onFechar} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: 28, maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', fontFamily: 'Inter, sans-serif' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2C2C2A', margin: '0 0 24px' }}>
          {cupom?.id ? 'Editar cupom' : 'Novo cupom'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Código *</label>
            <input style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 700, letterSpacing: 2 }}
              value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
              placeholder="EX: TUFIT10" disabled={!!cupom?.id} />
            {!cupom?.id && <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>O código não pode ser alterado após criação</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Tipo *</label>
              <select style={inputStyle} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="percentual">Percentual (%)</option>
                <option value="fixo">Valor fixo (R$)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{form.tipo === 'percentual' ? 'Desconto (%)' : 'Desconto (R$)'} *</label>
              <input style={inputStyle} type="number" min="0" max={form.tipo === 'percentual' ? 100 : undefined} step="0.01"
                value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                placeholder={form.tipo === 'percentual' ? 'Ex: 10' : 'Ex: 5.00'} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Limite de usos</label>
              <input style={inputStyle} type="number" min="1"
                value={form.uso_maximo} onChange={e => setForm(f => ({ ...f, uso_maximo: e.target.value }))}
                placeholder="Sem limite" />
            </div>
            <div>
              <label style={labelStyle}>Válido até</label>
              <input style={inputStyle} type="date" value={form.valido_ate}
                onChange={e => setForm(f => ({ ...f, valido_ate: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="ativo" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#D4537E' }} />
            <label htmlFor="ativo" style={{ fontSize: 14, color: '#2C2C2A', cursor: 'pointer' }}>Cupom ativo</label>
          </div>
        </div>

        {/* Preview do desconto */}
        {form.valor > 0 && (
          <div style={{ background: '#FBEAF0', borderRadius: 12, padding: '12px 16px', margin: '20px 0 0', fontSize: 13, color: '#993556' }}>
            💡 Este cupom dará <strong>{form.tipo === 'percentual' ? `${form.valor}%` : `R$ ${parseFloat(form.valor || 0).toFixed(2).replace('.', ',')}`}</strong> de desconto
            {form.uso_maximo ? ` para até ${form.uso_maximo} uso(s)` : ' sem limite de uso'}
            {form.valido_ate ? ` até ${new Date(form.valido_ate + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onFechar} style={{ flex: 1, background: 'transparent', color: '#D4537E', padding: '12px', borderRadius: 24, border: '2px solid #D4537E', cursor: 'pointer', fontWeight: 600 }}>
            Cancelar
          </button>
          <button onClick={handleSalvar} disabled={salvando}
            style={{ flex: 2, background: salvando ? '#f9a8d4' : '#D4537E', color: '#fff', padding: '12px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {salvando ? 'Salvando...' : 'Salvar cupom'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCupons() {
  const [cupons, setCupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)

  useEffect(() => { buscarCupons() }, [])

  async function buscarCupons() {
    setLoading(true)
    const { data } = await supabase.from('cupons').select('*').order('created_at', { ascending: false })
    setCupons(data || [])
    setLoading(false)
  }

  async function toggleAtivo(cupom) {
    const { error } = await supabase.from('cupons').update({ ativo: !cupom.ativo }).eq('id', cupom.id)
    if (!error) { toast.success(cupom.ativo ? 'Cupom desativado' : 'Cupom ativado'); buscarCupons() }
  }

  async function excluir(id) {
    if (!confirm('Excluir este cupom?')) return
    const { error } = await supabase.from('cupons').delete().eq('id', id)
    if (!error) { toast.success('Cupom excluído'); buscarCupons() }
  }

  function abrirEditar(cupom) { setEditando(cupom); setModal(true) }
  function abrirNovo() { setEditando(null); setModal(true) }

  const ativos = cupons.filter(c => c.ativo).length
  const inativos = cupons.filter(c => !c.ativo).length

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {modal && (
        <ModalCupom
          cupom={editando}
          onFechar={() => setModal(false)}
          onSalvar={() => { setModal(false); buscarCupons() }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#2C2C2A' }}>Cupons de Desconto</h1>
          <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 14 }}>
            {ativos} ativo{ativos !== 1 ? 's' : ''} · {inativos} inativo{inativos !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={buscarCupons} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f9fafb', color: '#6b7280', border: '1px solid #f3f4f6', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={abrirNovo} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#D4537E', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <Plus size={16} /> Novo cupom
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#9ca3af' }}>Carregando...</div>
      ) : cupons.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6', padding: 64, textAlign: 'center' }}>
          <Tag size={40} style={{ margin: '0 auto 12px', display: 'block', color: '#d1d5db' }} />
          <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: '#2C2C2A' }}>Nenhum cupom criado</p>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#9ca3af' }}>Crie cupons para oferecer descontos aos clientes</p>
          <button onClick={abrirNovo} style={{ background: '#D4537E', color: '#fff', padding: '10px 24px', borderRadius: 24, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Criar primeiro cupom
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cupons.map(cupom => {
            const expirado = cupom.valido_ate && new Date(cupom.valido_ate) < new Date()
            const esgotado = cupom.uso_maximo && cupom.uso_atual >= cupom.uso_maximo
            const statusReal = !cupom.ativo ? 'inativo' : expirado ? 'expirado' : esgotado ? 'esgotado' : 'ativo'

            const statusCor = { ativo: '#10b981', inativo: '#9ca3af', expirado: '#f59e0b', esgotado: '#ef4444' }
            const statusBg = { ativo: '#f0fdf4', inativo: '#f9fafb', expirado: '#fffbeb', esgotado: '#fef2f2' }
            const statusLabel = { ativo: 'Ativo', inativo: 'Inativo', expirado: 'Expirado', esgotado: 'Esgotado' }

            return (
              <div key={cupom.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f3f4f6', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, opacity: statusReal !== 'ativo' ? 0.75 : 1 }}>
                {/* Ícone */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FBEAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Tag size={20} color="#D4537E" />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, color: '#2C2C2A', fontSize: 16, letterSpacing: 1 }}>{cupom.codigo}</span>
                    <span style={{ background: statusBg[statusReal], color: statusCor[statusReal], fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>
                      {statusLabel[statusReal]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#D4537E', fontWeight: 700 }}>
                      {cupom.tipo === 'percentual' ? `${cupom.valor}% off` : `R$ ${cupom.valor.toFixed(2).replace('.', ',')} off`}
                    </span>
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>
                      {cupom.uso_atual} uso{cupom.uso_atual !== 1 ? 's' : ''}
                      {cupom.uso_maximo ? ` / ${cupom.uso_maximo}` : ' (sem limite)'}
                    </span>
                    {cupom.valido_ate && (
                      <span style={{ fontSize: 13, color: expirado ? '#f59e0b' : '#9ca3af' }}>
                        até {new Date(cupom.valido_ate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => toggleAtivo(cupom)}
                    style={{ background: cupom.ativo ? '#fef2f2' : '#f0fdf4', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: cupom.ativo ? '#ef4444' : '#10b981' }}>
                    {cupom.ativo ? <><XCircle size={14} /> Desativar</> : <><CheckCircle size={14} /> Ativar</>}
                  </button>
                  <button onClick={() => abrirEditar(cupom)}
                    style={{ background: '#FBEAF0', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#D4537E' }}>
                    Editar
                  </button>
                  <button onClick={() => excluir(cupom.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
                    <Trash2 size={16} />
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
