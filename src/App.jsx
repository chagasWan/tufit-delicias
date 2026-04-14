import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CarrinhoProvider } from './contexts/CarrinhoContext'
import CarrinhoFlutuante from './components/CarrinhoFlutuante'
import Home from './pages/Home'
import Cardapio from './pages/Cardapio'
import Checkout from './pages/Checkout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminProtegido from './pages/admin/AdminProtegido'
import AdminLayout from './pages/admin/AdminLayout'
import AdminPedidos from './pages/admin/AdminPedidos'
import AdminProdutos from './pages/admin/AdminProdutos'

function App() {
  return (
    <BrowserRouter>
      <CarrinhoProvider>
        <Toaster position="top-center" />
        <CarrinhoFlutuante />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cardapio" element={<Cardapio />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminProtegido />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<div style={{padding:40,textAlign:'center',color:'#9ca3af'}}>Dashboard em breve 🍰</div>} />
              <Route path="/admin/pedidos" element={<AdminPedidos />} />
              <Route path="/admin/produtos" element={<AdminProdutos />} />
              <Route path="/admin/receitas" element={<div style={{padding:40,textAlign:'center',color:'#9ca3af'}}>Receitas em breve 🍰</div>} />
              <Route path="/admin/clientes" element={<div style={{padding:40,textAlign:'center',color:'#9ca3af'}}>Clientes em breve 🍰</div>} />
              <Route path="/admin/configuracoes" element={<div style={{padding:40,textAlign:'center',color:'#9ca3af'}}>Configurações em breve 🍰</div>} />
            </Route>
          </Route>
        </Routes>
      </CarrinhoProvider>
    </BrowserRouter>
  )
}

export default App