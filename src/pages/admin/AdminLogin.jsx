import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Heart, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !senha) return toast.error('Preencha todos os campos')
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      toast.error('Email ou senha incorretos')
    } else {
      toast.success('Bem-vinda! 🍰')
      navigate('/admin')
    }
    setCarregando(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FBEAF0 0%, #FDF8F0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, background: '#D4537E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Heart size={28} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#2C2C2A', margin: '0 0 4px' }}>Tufit Delícias</h1>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Painel administrativo</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 24, padding: 36, border: '1px solid #fce7f3', boxShadow: '0 8px 32px rgba(212,83,126,0.08)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2C2C2A', marginBottom: 24, textAlign: 'center' }}>Entrar</h2>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 6 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: 12, border: '1.5px solid #fce7f3', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 14, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 6 }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  style={{ width: '100%', padding: '12px 40px 12px 40px', borderRadius: 12, border: '1.5px solid #fce7f3', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              style={{ background: carregando ? '#f9a8d4' : '#D4537E', color: '#fff', padding: '14px', borderRadius: 24, fontWeight: 700, fontSize: 16, border: 'none', cursor: carregando ? 'not-allowed' : 'pointer', marginTop: 8 }}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#9ca3af' }}>
          Área restrita — somente administradores
        </p>
      </div>
    </div>
  )
}
