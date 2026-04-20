import * as XLSX from 'xlsx'

export function exportExcel(festival, pedidos, distribuicao) {
  const wb = XLSX.utils.book_new()

  const wsPedidos = XLSX.utils.json_to_sheet(pedidos)
  XLSX.utils.book_append_sheet(wb, wsPedidos, `BD_${festival}`)

  const wsDistrib = XLSX.utils.json_to_sheet(distribuicao)
  XLSX.utils.book_append_sheet(wb, wsDistrib, `DISTRIB_${festival}`)

  XLSX.writeFile(wb, `BYD_${festival}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
