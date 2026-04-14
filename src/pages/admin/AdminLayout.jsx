import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Heart, ShoppingBag, Package, BookOpen, BarChart2, Users, Settings, LogOut, Menu, X, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

const menus = [
  { path: '/admin', label: 'Dashboard', icon: BarChart2 },
  { path: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { path: '/admin/produtos', label: 'Produtos', icon: Package },
  { path: '/admin/receitas', label: 'Receitas', icon: BookOpen },
  { path: '/admin/clientes', label: 'Clientes', icon: Users },
  { path: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export default function AdminLayout() {
  const [usuario, setUsuario] = useState(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const [pedidosNovos, setPedidosNovos] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate('/admin/login')
      else setUsuario(data.user)
    })

    supabase.from('pedidos').select('id', { count: 'exact' }).eq('status', 'novo').then(({ count }) => {
      setPedidosNovos(count || 0)
    })

    const canal = supabase.channel('pedidos-novos')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, payload => {
        setPedidosNovos(n => n + 1)
        toast('🍰 Novo pedido recebido!', { icon: '🔔', duration: 5000 })
      })
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [navigate])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter, sans-serif', display: 'flex' }}>

      {menuAberto && (
        <div onClick={() => setMenuAberto(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      )}

      <aside style={{
        width: 240,
        background: '#fff',
        borderRight: '1px solid #f3f4f6',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: menuAberto ? 0 : -240,
        bottom: 0,
        zIndex: 50,
        transition: 'left 0.3s',
      }}
        className="admin-sidebar"
      >
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: '#D4537E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Heart size={16} color="#fff" fill="#fff" />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: '#2C2C2A', fontSize: 14, margin: 0 }}>Tufit Delícias</p>
            <p style={{ color: '#9ca3af', fontSize: 11, margin: 0 }}>Painel admin</p>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {menus.map(item => {
            const ativo = location.pathname === item.path
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMenuAberto(false) }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 20px',
                  background: ativo ? '#FBEAF0' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: ativo ? '#D4537E' : '#6b7280',
                  fontWeight: ativo ? 600 : 400,
                  fontSize: 14,
                  textAlign: 'left',
                  borderRight: ativo ? '3px solid #D4537E' : '3px solid transparent',
                  position: 'relative',
                }}
              >
                <Icon size={18} />
                {item.label}
                {item.label === 'Pedidos' && pedidosNovos > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#D4537E', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                    {pedidosNovos}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {usuario?.email}
          </p>
          <button
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FEF2F2', border: 'none', borderRadius: 10, cursor: 'pointer', color: '#ef4444', fontSize: 14, fontWeight: 500 }}
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, marginLeft: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setMenuAberto(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', padding: 4 }}
            >
              {menuAberto ? <X size={22} /> : <Menu size={22} />}
            </button>
            <span style={{ fontWeight: 600, color: '#2C2C2A', fontSize: 16 }}>
              {menus.find(m => m.path === location.pathname)?.label || 'Admin'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {pedidosNovos > 0 && (
              <button
                onClick={() => navigate('/admin/pedidos')}
                style={{ position: 'relative', background: '#FBEAF0', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#D4537E' }}
              >
                <Bell size={18} />
                <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#D4537E', borderRadius: '50%' }} />
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              style={{ background: '#FBEAF0', color: '#D4537E', padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
            >
              Ver site
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '32px 24px', maxWidth: 1200, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
