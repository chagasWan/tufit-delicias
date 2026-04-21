import { useState } from 'react'
import { X } from 'lucide-react'

const NUTRIENTES = [
  { campo: 'kcal_porcao', label: 'Valor energético', unidade: 'kcal', destaque: true },
  { campo: 'carb_porcao', label: 'Carboidratos', unidade: 'g' },
  { campo: 'acucar_porcao', label: '  Açúcares', unidade: 'g', sub: true },
  { campo: 'proteina_porcao', label: 'Proteínas', unidade: 'g' },
  { campo: 'gordura_porcao', label: 'Gorduras totais', unidade: 'g' },
  { campo: 'gordura_sat_porcao', label: '  Gorduras saturadas', unidade: 'g', sub: true },
  { campo: 'gordura_trans_porcao', label: '  Gorduras trans', unidade: 'g', sub: true },
  { campo: 'fibra_porcao', label: 'Fibra alimentar', unidade: 'g' },
  { campo: 'sodio_porcao', label: 'Sódio', unidade: 'mg' },
]

export function BotaoTabelaNutricional({ nutricao, nomeProduto, porcao = '1 unidade' }) {
  const [aberto, setAberto] = useState(false)

  if (!nutricao || Object.values(nutricao).every(v => !v || v === 0)) return null

  const temDados = NUTRIENTES.some(n => nutricao[n.campo] > 0)
  if (!temDados) return null

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        style={{
          background: '#f0fdf4',
          color: '#15803d',
          border: '1px solid #bbf7d0',
          borderRadius: 20,
          padding: '5px 12px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        🥗 Tabela Nutricional
      </button>

      {aberto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={() => setAberto(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#2C2C2A' }}>Informação Nutricional</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{nomeProduto}</p>
              </div>
              <button onClick={() => setAberto(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#f9fafb', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#6b7280' }}>
              Porção: <strong style={{ color: '#2C2C2A' }}>{porcao}</strong>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #2C2C2A' }}>
                  <th style={{ textAlign: 'left', padding: '6px 4px', fontSize: 12, color: '#2C2C2A', fontWeight: 700 }}>Nutriente</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: 12, color: '#2C2C2A', fontWeight: 700 }}>Por porção</th>
                </tr>
              </thead>
              <tbody>
                {NUTRIENTES.map((n, i) => {
                  const valor = nutricao[n.campo]
                  if (!valor || valor === 0) return null
                  return (
                    <tr key={n.campo} style={{ borderBottom: '1px solid #f3f4f6', background: n.destaque ? '#FBEAF0' : 'transparent' }}>
                      <td style={{ padding: '7px 4px', fontSize: n.sub ? 12 : 13, color: n.sub ? '#9ca3af' : '#2C2C2A', fontWeight: n.destaque ? 700 : 400 }}>
                        {n.label}
                      </td>
                      <td style={{ padding: '7px 4px', fontSize: 13, color: n.destaque ? '#D4537E' : '#2C2C2A', fontWeight: n.destaque ? 800 : 600, textAlign: 'right' }}>
                        {valor % 1 === 0 ? valor : valor.toFixed(1)} {n.unidade}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <p style={{ fontSize: 11, color: '#9ca3af', margin: '12px 0 0', textAlign: 'center' }}>
              * Valores calculados com base nos ingredientes da receita. Podem variar conforme o preparo.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
