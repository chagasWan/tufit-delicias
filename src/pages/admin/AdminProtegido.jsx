import { useEffect, useState } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminProtegido() {
  const [verificando, setVerificando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/admin/login')
      else setVerificando(false)
    })
  }, [navigate])

  if (verificando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDF8F0', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍰</div>
          <p style={{ color: '#9ca3af' }}>Verificando acesso...</p>
        </div>
      </div>
    )
  }

  return <Outlet />
}
