import { useState, useRef } from 'react'

export function Tooltip({ texto }) {
  const [visivel, setVisivel] = useState(false)
  const [posicao, setPosicao] = useState('center')
  const ref = useRef(null)

  function handleMouseEnter() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const espacoDireita = window.innerWidth - rect.right
      const espacoEsquerda = rect.left
      if (espacoDireita < 140) setPosicao('right')
      else if (espacoEsquerda < 140) setPosicao('left')
      else setPosicao('center')
    }
    setVisivel(true)
  }

  const translateX = posicao === 'right' ? 'translateX(-85%)' : posicao === 'left' ? 'translateX(-15%)' : 'translateX(-50%)'
  const arrowLeft = posicao === 'right' ? '85%' : posicao === 'left' ? '15%' : '50%'

  return (
    <span
      ref={ref}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 5, cursor: 'help' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisivel(false)}
    >
      <span style={{
        width: 15, height: 15, borderRadius: '50%',
        background: '#e5e7eb', color: '#6b7280',
        fontSize: 10, fontWeight: 800,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        userSelect: 'none', flexShrink: 0,
      }}>i</span>

      {visivel && (
        <span style={{
          position: 'fixed',
          background: '#1f2937',
          color: '#fff',
          fontSize: 12,
          lineHeight: 1.5,
          padding: '8px 12px',
          borderRadius: 8,
          width: 220,
          zIndex: 99999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
          top: ref.current ? ref.current.getBoundingClientRect().top - 8 : 0,
          left: ref.current ? ref.current.getBoundingClientRect().left + ref.current.offsetWidth / 2 : 0,
          transform: `${translateX} translateY(-100%)`,
        }}>
          {texto}
          <span style={{
            position: 'absolute',
            top: '100%',
            left: arrowLeft,
            transform: 'translateX(-50%)',
            border: '5px solid transparent',
            borderTopColor: '#1f2937',
          }} />
        </span>
      )}
    </span>
  )
}

export function LabelComDica({ children, dica, obrigatorio }) {
  return (
    <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, display: 'flex', alignItems: 'center', marginBottom: 5 }}>
      {children}
      {obrigatorio && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      {dica && <Tooltip texto={dica} />}
    </span>
  )
}
