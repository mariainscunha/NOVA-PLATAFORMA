import * as XLSX from 'xlsx'
import { STOCK_RIR, STOCK_NOSALIVE, RIR_DAYS, NOSALIVE_DAYS, RIR_TIPOS, NOSALIVE_TIPOS } from './constants'

const HIDDEN_COLS = ['id', 'created_at']

function cleanRows(rows) {
  return rows.map(row => {
    const r = {}
    Object.keys(row).forEach(k => { if (!HIDDEN_COLS.includes(k)) r[k] = row[k] })
    return r
  })
}

function colWidths(keys) {
  return keys.map(k => ({ wch: Math.max(k.length + 2, 16) }))
}

function makeSheet(data) {
  if (!data.length) return XLSX.utils.json_to_sheet([])
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = colWidths(Object.keys(data[0]))
  ws['!autofilter'] = { ref: ws['!ref'] }
  return ws
}

function stockSheet(festival, pedidos) {
  const isRiR = festival === 'RiR'
  const dias = isRiR ? RIR_DAYS : NOSALIVE_DAYS
  const tipos = isRiR ? RIR_TIPOS : NOSALIVE_TIPOS
  const stockNeg = isRiR ? STOCK_RIR : STOCK_NOSALIVE

  const used = {}
  tipos.forEach(t => { used[t] = {}; dias.forEach(d => { used[t][d] = 0 }) })
  pedidos.forEach(row => {
    if (row.STATUS === 'Verificar') return
    const qty = parseInt(row.Quantidade) || 1
    dias.forEach(d => {
      if (row[`Dia_${d}`] === 'Sim' && used[row.Tipo]) {
        used[row.Tipo][d] = (used[row.Tipo][d] || 0) + qty
      }
    })
  })

  const rows = []
  tipos.forEach(tipo => {
    dias.forEach(dia => {
      const neg = stockNeg[tipo]?.[dia] ?? 0
      const usedN = used[tipo]?.[dia] ?? 0
      const livre = neg - usedN
      rows.push({
        Tipo: tipo,
        Dia: dia,
        'Stock Total': neg || 'A definir',
        'Usado': usedN,
        'Disponível': neg ? livre : '-',
        '% Usado': neg > 0 ? Math.round((usedN / neg) * 100) + '%' : '-',
      })
    })
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 12 }]
  ws['!autofilter'] = { ref: ws['!ref'] }
  return ws
}

export function exportExcel(festival, pedidos, distribuicao) {
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, stockSheet(festival, pedidos), 'Stock')
  XLSX.utils.book_append_sheet(wb, makeSheet(cleanRows(pedidos)), `Pedidos_${festival}`)
  XLSX.utils.book_append_sheet(wb, makeSheet(cleanRows(distribuicao)), `Distrib_${festival}`)

  XLSX.writeFile(wb, `BYD_${festival}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
