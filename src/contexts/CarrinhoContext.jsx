import { createContext, useContext, useState } from 'react'

const CarrinhoContext = createContext(null)

export function CarrinhoProvider({ children }) {
  const [itens, setItens] = useState([])
  const [aberto, setAberto] = useState(false)

  function adicionarItem(produto, quantidade = 1) {
    setItens(prev => {
      const existente = prev.find(i => i.produto.id === produto.id)
      if (existente) {
        return prev.map(i =>
          i.produto.id === produto.id
            ? { ...i, quantidade: i.quantidade + quantidade }
            : i
        )
      }
      return [...prev, { produto, quantidade }]
    })
    setAberto(true)
  }

  function removerItem(produtoId) {
    setItens(prev => prev.filter(i => i.produto.id !== produtoId))
  }

  function alterarQuantidade(produtoId, quantidade) {
    if (quantidade <= 0) return removerItem(produtoId)
    setItens(prev => prev.map(i =>
      i.produto.id === produtoId ? { ...i, quantidade } : i
    ))
  }

  function limparCarrinho() {
    setItens([])
  }

  const totalItens = itens.reduce((acc, i) => acc + i.quantidade, 0)
  const totalValor = itens.reduce((acc, i) => acc + i.produto.preco * i.quantidade, 0)
  const prazoMaximo = itens.reduce((acc, i) => Math.max(acc, i.produto.prazo_minimo_horas || 4), 0)

  return (
    <CarrinhoContext.Provider value={{
      itens,
      aberto,
      setAberto,
      adicionarItem,
      removerItem,
      alterarQuantidade,
      limparCarrinho,
      totalItens,
      totalValor,
      prazoMaximo,
    }}>
      {children}
    </CarrinhoContext.Provider>
  )
}

export function useCarrinho() {
  return useContext(CarrinhoContext)
}
