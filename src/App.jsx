import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CarrinhoProvider } from './contexts/CarrinhoContext'
import CarrinhoFlutuante from './components/CarrinhoFlutuante'
import Home from './pages/Home'
import Cardapio from './pages/Cardapio'
import Checkout from './pages/Checkout'
import Avaliacao from './pages/Avaliacao'
import AdminLogin from './pages/admin/AdminLogin'
import AdminProtegido from './pages/admin/AdminProtegido'
import AdminLayout from './pages/admin/AdminLayout'
import AdminPedidos from './pages/admin/AdminPedidos'
import AdminProdutos from './pages/admin/AdminProdutos'
import AdminReceitas from './pages/admin/AdminReceitas'
import AdminInsumos from './pages/admin/AdminInsumos'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminClientes from './pages/admin/AdminClientes'
import AdminConfiguracoes from './pages/admin/AdminConfiguracoes'
import AdminProducao from './pages/admin/AdminProducao'
import AdminCompras from './pages/admin/AdminCompras'
import AdminCupons from './pages/admin/AdminCupons'

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
          <Route path="/avaliacao/:pedidoId" element={<Avaliacao />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminProtegido />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/pedidos" element={<AdminPedidos />} />
              <Route path="/admin/produtos" element={<AdminProdutos />} />
              <Route path="/admin/receitas" element={<AdminReceitas />} />
              <Route path="/admin/insumos" element={<AdminInsumos />} />
              <Route path="/admin/clientes" element={<AdminClientes />} />
              <Route path="/admin/producao" element={<AdminProducao />} />
              <Route path="/admin/compras" element={<AdminCompras />} />
              <Route path="/admin/cupons" element={<AdminCupons />} />
              <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
            </Route>
          </Route>
        </Routes>
      </CarrinhoProvider>
    </BrowserRouter>
  )
}

export default App