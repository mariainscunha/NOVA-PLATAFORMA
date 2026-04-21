import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  FESTIVALS, RIR_DAYS, NOSALIVE_DAYS, RIR_TIPOS, NOSALIVE_TIPOS,
  STOCK_RIR, STOCK_NOSALIVE, INCLUI_RELVADO,
} from '../lib/constants'

function barColor(pct) {
  if (pct > 85) return 'bg-red-500'
  if (pct > 60) return 'bg-orange-400'
  return 'bg-green-500'
}

function textColor(pct) {
  if (pct > 85) return 'text-red-600'
  if (pct > 60) return 'text-orange-500'
  return 'text-green-600'
}

export default function StockView({ festival }) {
  const isRiR = festival === FESTIVALS.RIR
  const dias = isRiR ? RIR_DAYS : NOSALIVE_DAYS
  const tipos = isRiR ? RIR_TIPOS : NOSALIVE_TIPOS
  const stockNeg = isRiR ? STOCK_RIR : STOCK_NOSALIVE
  const table = isRiR ? 'BD_RiR' : 'BD_NosAlive'

  // All keys in stockNeg (includes 'Slide' for RiR)
  const tiposDisplay = Object.keys(stockNeg)

  const incluiRelvado = INCLUI_RELVADO[festival] || []

  const [rawData, setRawData] = useState([])
  const [usado, setUsado] = useState({})
  const [loading, setLoading] = useState(true)
  const [breakdown, setBreakdown] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const baseSelect = 'Tipo,' + dias.map(d => `Dia_${d}`).join(',') + ',STATUS,Quantidade,Nome,Entidade'
      let { data, error } = await supabase.from(table).select(baseSelect + (isRiR ? ',Slide' : ''))
      if (error) {
        // Slide column may not exist yet — retry without it
        const res = await supabase.from(table).select(baseSelect)
        data = res.data
      }

      const counts = {}
      tiposDisplay.forEach(t => {
        counts[t] = {}
        dias.forEach(d => { counts[t][d] = 0 })
      })

      ;(data || []).forEach(row => {
        if (row.STATUS === 'Verificar') return
        const qty = parseInt(row.Quantidade) || 1
        dias.forEach(d => {
          if (row[`Dia_${d}`] === 'Sim') {
            if (counts[row.Tipo]) {
              counts[row.Tipo][d] = (counts[row.Tipo][d] || 0) + qty
            }
            // Rooftop NOS Alive ocupa também um slot de Relvado
            if (incluiRelvado.includes(row.Tipo) && counts['Relvado']) {
              counts['Relvado'][d] = (counts['Relvado'][d] || 0) + qty
            }
            if (isRiR && row.Slide === 'Sim' && counts['Slide']) {
              counts['Slide'][d] = (counts['Slide'][d] || 0) + qty
            }
          }
        })
      })

      setRawData(data || [])
      setUsado(counts)
      setLoading(false)
    }
    load()
  }, [festival])

  function getBreakdownRows(tipo, dia) {
    const rows = []
    rawData.forEach(row => {
      if (row.STATUS === 'Verificar') return
      if (row[`Dia_${dia}`] !== 'Sim') return
      const qty = parseInt(row.Quantidade) || 1
      if (tipo === 'Slide') {
        if (row.Slide === 'Sim') {
          rows.push({ nome: row.Nome || '(sem nome)', entidade: row.Entidade || '', tipo: row.Tipo, qty, via: null })
        }
      } else if (row.Tipo === tipo) {
        rows.push({ nome: row.Nome || '(sem nome)', entidade: row.Entidade || '', tipo: row.Tipo, qty, via: null })
      } else if (tipo === 'Relvado' && incluiRelvado.includes(row.Tipo)) {
        rows.push({ nome: row.Nome || '(sem nome)', entidade: row.Entidade || '', tipo: row.Tipo, qty, via: row.Tipo })
      }
    })
    return rows
  }

  if (loading) return <div className="text-center py-12 text-slate-400">A carregar...</div>

  const active = breakdown

  return (
    <div className="space-y-6">
      {active && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setBreakdown(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Detalhe: {active.tipo} — {active.dia}
              </h3>
              <button onClick={() => setBreakdown(null)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
            </div>
            {(() => {
              const bRows = getBreakdownRows(active.tipo, active.dia)
              if (!bRows.length) return <p className="text-slate-400 text-sm">Sem pedidos registados.</p>
              return (
                <table className="w-full text-sm">
                  {(() => {
                    const showTipo = active.tipo === 'Slide' || active.tipo === 'Relvado'
                    return (
                      <>
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                          <tr>
                            <th className="px-3 py-2 text-left">Nome</th>
                            <th className="px-3 py-2 text-left">Entidade</th>
                            {showTipo && <th className="px-3 py-2 text-center">Tipo</th>}
                            <th className="px-3 py-2 text-center">Qtd</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bRows.map((r, i) => (
                            <tr key={i} className={r.via ? 'bg-amber-50' : ''}>
                              <td className="px-3 py-2 font-medium text-slate-800">{r.nome}</td>
                              <td className="px-3 py-2 text-slate-500">{r.entidade}</td>
                              {showTipo && (
                                <td className="px-3 py-2 text-center text-slate-600">
                                  {r.tipo}
                                  {r.via && <span className="ml-1 text-xs text-amber-600">(+Relvado)</span>}
                                </td>
                              )}
                              <td className="px-3 py-2 text-center font-semibold text-slate-700">{r.qty}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50">
                            <td colSpan={showTipo ? 3 : 2} className="px-3 py-2 text-right text-xs font-medium text-slate-600">Total</td>
                            <td className="px-3 py-2 text-center font-bold text-slate-800">{bRows.reduce((s, r) => s + r.qty, 0)}</td>
                          </tr>
                        </tfoot>
                      </>
                    )
                  })()}
                </table>
              )
            })()}
          </div>
        </div>
      )}

      {tiposDisplay.map(tipo => (
        <div key={tipo} className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            {tipo}
            {tipo === 'Slide' && <span className="ml-2 text-xs font-normal text-slate-400">(experiência adicional)</span>}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {dias.map(dia => {
              const neg = stockNeg[tipo]?.[dia] ?? 0
              const used = usado[tipo]?.[dia] ?? 0
              const livres = neg - used
              const pct = neg > 0 ? Math.round((used / neg) * 100) : 0
              return (
                <div
                  key={dia}
                  className="border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition"
                  onClick={() => setBreakdown({ tipo, dia })}
                  title="Clica para ver detalhe"
                >
                  <div className="text-xs font-medium text-slate-500 mb-2 uppercase">{dia}</div>
                  {neg === 0 ? (
                    <>
                      <div className="text-lg font-bold mb-1 text-slate-400">A definir</div>
                      <div className="text-xs text-slate-400 mb-2">{used} com Slide</div>
                      <div className="w-full bg-slate-100 rounded-full h-2" />
                    </>
                  ) : (
                    <>
                      <div className={`text-2xl font-bold mb-1 ${textColor(pct)}`}>{livres}</div>
                      <div className="text-xs text-slate-400 mb-2">
                        <span className="font-medium text-slate-600">{used} usados</span> de {neg}
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${barColor(pct)}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{pct}% usado</div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
