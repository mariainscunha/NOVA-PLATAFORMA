import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  FESTIVALS, RIR_DAYS, NOSALIVE_DAYS, RIR_TIPOS, NOSALIVE_TIPOS,
  STOCK_RIR, STOCK_NOSALIVE,
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

  const [usado, setUsado] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from(table)
        .select('Tipo,' + dias.map(d => `Dia_${d}`).join(',') + ',STATUS')

      const counts = {}
      tipos.forEach(t => {
        counts[t] = {}
        dias.forEach(d => { counts[t][d] = 0 })
      })

      ;(data || []).forEach(row => {
        if (row.STATUS === 'Verificar') return
        dias.forEach(d => {
          if (row[`Dia_${d}`] === 'Sim' && counts[row.Tipo]) {
            counts[row.Tipo][d] = (counts[row.Tipo][d] || 0) + 1
          }
        })
      })

      setUsado(counts)
      setLoading(false)
    }
    load()
  }, [festival])

  if (loading) return <div className="text-center py-12 text-slate-400">A carregar...</div>

  return (
    <div className="space-y-6">
      {tipos.map(tipo => (
        <div key={tipo} className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{tipo}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {dias.map(dia => {
              const neg = stockNeg[tipo]?.[dia] ?? 0
              const used = usado[tipo]?.[dia] ?? 0
              const livres = neg - used
              const pct = neg > 0 ? Math.round((used / neg) * 100) : 0
              return (
                <div key={dia} className="border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-medium text-slate-500 mb-2 uppercase">{dia}</div>
                  <div className={`text-2xl font-bold mb-1 ${textColor(pct)}`}>{livres}</div>
                  <div className="text-xs text-slate-400 mb-2">livres de {neg}</div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${barColor(pct)}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{pct}% usado</div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
