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
import AdminReceitas from './pages/admin/AdminReceitas'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminClientes from './pages/admin/AdminClientes'
import AdminConfiguracoes from './pages/admin/AdminConfiguracoes'

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
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/pedidos" element={<AdminPedidos />} />
              <Route path="/admin/produtos" element={<AdminProdutos />} />
              <Route path="/admin/receitas" element={<AdminReceitas />} />
              <Route path="/admin/clientes" element={<AdminClientes />} />
              <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
            </Route>
          </Route>
        </Routes>
      </CarrinhoProvider>
    </BrowserRouter>
  )
}

export default App