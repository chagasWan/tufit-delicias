import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CarrinhoProvider } from './contexts/CarrinhoContext'
import CarrinhoFlutuante from './components/CarrinhoFlutuante'
import Home from './pages/Home'
import Cardapio from './pages/Cardapio'
import Checkout from './pages/Checkout'

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
        </Routes>
      </CarrinhoProvider>
    </BrowserRouter>
  )
}

export default App