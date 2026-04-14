import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Save, Phone, MapPin, Clock, Percent, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const CAMPOS = [
  { chave: 'nome_negocio', label: 'Nome do negócio', icon: null, placeholder: 'Tufit Delícias' },
  { chave: 'whatsapp_numero', label: 'Número WhatsApp (com DDD, sem +55)', icon: Phone, placeholder: '62999049716' },
  { chave: 'instagram', label: 'Instagram', icon: null, placeholder: '@tufitdelicias' },
  { chave: 'cidade', label: 'Cidade', icon: MapPin, placeholder: 'Goiânia - GO' },
  { chave: 'margem_padrao', label: 'Margem de lucro padrão (%)', icon: Percent, placeholder: '40' },
  { chave: 'dias_funcionamento', label: 'Dias de funcionamento (0=Dom, 6=Sáb)', icon: Clock, placeholder: '1,2,3,4,5,6' },
]

export default function AdminConfiguracoes() {
  const [configs, setConfigs] = useState({})
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { buscarConfigs() }, [])

  async function buscarConfigs() {
    const { data } = await supabase.from('configuracoes').select('*')
    const mapa = {}
    ;(data || []).forEach(c => { mapa[c.chave] = c.valor })
    setConfigs(mapa)
    setLoading(false)
  }

  async function salvarTudo() {
    setSalvando(true)
    const promises = Object.entries(configs).map(([chave, valor]) =>
      supabase.from('configuracoes').upsert({ chave, valor, descricao: '' }, { onConflict: 'chave' })
    )
    await Promise.all(promises)
    toast.success('Configurações salvas!')
    setSalvando(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 600 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#2C2C2A', margin: 0 }}>Configurações</h1>
          <p style={{ color: '#9ca3af', fontSize: 14, margin: '4px 0 0' }}>Dados do negócio e preferências</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 56, background: '#f9fafb', borderRadius: 10 }} />)}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2C2C2A', margin: 0 }}>Informações do negócio</h3>

          {CAMPOS.map(campo => (
            <div key={campo.chave}>
              <label style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                {campo.label}
              </label>
              <input
                style={inputStyle}
                value={configs[campo.chave] || ''}
                onChange={e => setConfigs(prev => ({ ...prev, [campo.chave]: e.target.value }))}
                placeholder={campo.placeholder}
              />
              {campo.chave === 'margem_padrao' && (
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
                  Usado como padrão no cálculo de preço sugerido das receitas
                </p>
              )}
              {campo.chave === 'dias_funcionamento' && (
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
                  Separe por vírgula. Ex: 1,2,3,4,5,6 = segunda a sábado
                </p>
              )}
              {campo.chave === 'whatsapp_numero' && (
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
                  Este número receberá as notificações de novos pedidos
                </p>
              )}
            </div>
          ))}

          <button
            onClick={salvarTudo}
            disabled={salvando}
            style={{ background: salvando ? '#f9a8d4' : '#D4537E', color: '#fff', padding: '14px', borderRadius: 24, border: 'none', cursor: salvando ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}
          >
            <Save size={18} />
            {salvando ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f3f4f6', marginTop: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2C2C2A', margin: '0 0 4px' }}>Conta</h3>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 16px' }}>Sessão e acesso ao painel</p>
        <button
          onClick={handleLogout}
          style={{ background: '#fef2f2', color: '#ef4444', padding: '12px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <LogOut size={16} />
          Sair do painel
        </button>
      </div>

      <div style={{ background: '#FBEAF0', borderRadius: 16, padding: 20, marginTop: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#993556', margin: '0 0 6px' }}>💡 Dica</p>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
          Para adicionar ou remover categorias de produtos, acesse a tabela <strong>categorias</strong> diretamente no Supabase. Em breve essa funcionalidade estará disponível aqui.
        </p>
      </div>
    </div>
  )
}
