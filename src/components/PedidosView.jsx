import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { exportExcel } from '../lib/excel'
import {
  FESTIVALS, RIR_DAYS, NOSALIVE_DAYS, RIR_TIPOS, NOSALIVE_TIPOS,
  ENTIDADES, ENVIADO_POR, STATUS_COLORS, STATUS_NEXT,
} from '../lib/constants'

const EMPTY_FORM = {
  STATUS: 'Por Enviar', EnviadoPor: '', Entidade: 'BYD Portugal',
  Nome: '', Tipo: 'Relvado', Email: '', Observacoes: '', Quantidade: 1,
}

export default function PedidosView({ festival }) {
  const isRiR = festival === FESTIVALS.RIR
  const dias = isRiR ? RIR_DAYS : NOSALIVE_DAYS
  const tipos = isRiR ? RIR_TIPOS : NOSALIVE_TIPOS
  const table = isRiR ? 'BD_RiR' : 'BD_NosAlive'
  const distTable = isRiR ? 'DISTRIB_RiR' : 'DISTRIB_NosAlive'

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM, Tipo: tipos[0] })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [festival])

  const filtered = rows.filter(r => {
    if (filterStatus && r.STATUS !== filterStatus) return false
    if (filterTipo && r.Tipo !== filterTipo) return false
    if (search) {
      const q = search.toLowerCase()
      if (!r.Nome?.toLowerCase().includes(q) && !r.Entidade?.toLowerCase().includes(q)) return false
    }
    return true
  })

  async function cycleStatus(row) {
    const next = STATUS_NEXT[row.STATUS] || 'Por Enviar'
    await supabase.from(table).update({ STATUS: next }).eq('id', row.id)
    load()
  }

  function openNew() {
    setEditId(null)
    setForm({ ...EMPTY_FORM, Tipo: tipos[0] })
    setShowForm(true)
  }

  function openEdit(row) {
    setEditId(row.id)
    const f = { ...EMPTY_FORM }
    Object.keys(EMPTY_FORM).forEach(k => { f[k] = row[k] ?? EMPTY_FORM[k] })
    dias.forEach(d => { f[`Dia_${d}`] = row[`Dia_${d}`] ?? 'Não' })
    setForm(f)
    setShowForm(true)
  }

  async function saveForm(e) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, Quantidade: parseInt(form.Quantidade) || 1 }
    dias.forEach(d => { payload[`Dia_${d}`] = form[`Dia_${d}`] === 'Sim' ? 'Sim' : 'Não' })
    if (editId) {
      await supabase.from(table).update(payload).eq('id', editId)
    } else {
      await supabase.from(table).insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  async function deleteRow(id) {
    if (!confirm('Eliminar este pedido?')) return
    await supabase.from(table).delete().eq('id', id)
    load()
  }

  async function handleExport() {
    const { data: distData } = await supabase.from(distTable).select('*')
    exportExcel(festival, rows, distData || [])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Pesquisar nome/entidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">Todos os status</option>
          <option>Por Enviar</option>
          <option>Enviado</option>
          <option>Verificar</option>
        </select>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">Todos os tipos</option>
          {tipos.map(t => <option key={t}>{t}</option>)}
        </select>
        <button onClick={openNew}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          + Novo Pedido
        </button>
        <button onClick={handleExport}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          ↓ Excel
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-auto">
        {loading ? (
          <div className="text-center py-10 text-slate-400">A carregar...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400">Sem pedidos</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Entidade</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-center">Qtd</th>
                {dias.map(d => <th key={d} className="px-2 py-3 text-center">{d}</th>)}
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(row => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.Nome}</td>
                  <td className="px-4 py-3 text-slate-600">{row.Entidade}</td>
                  <td className="px-4 py-3 text-slate-600">{row.Tipo}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-700">{row.Quantidade || 1}</td>
                  {dias.map(d => (
                    <td key={d} className="px-2 py-3 text-center">
                      {row[`Dia_${d}`] === 'Sim'
                        ? <span className="text-green-600 font-bold">✓</span>
                        : <span className="text-slate-300">–</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[row.STATUS]}`}>
                      {row.STATUS}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => cycleStatus(row)}
                      title="Ciclar status"
                      className="text-slate-500 hover:text-blue-600 transition text-base">↻</button>
                    <button onClick={() => openEdit(row)}
                      className="text-slate-400 hover:text-slate-700 transition text-sm">✏️</button>
                    <button onClick={() => deleteRow(row.id)}
                      className="text-slate-400 hover:text-red-600 transition text-sm">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-screen overflow-y-auto">
            <div className="text-lg font-semibold text-slate-800 mb-4">
              {editId ? 'Editar Pedido' : 'Novo Pedido'}
            </div>
            <form onSubmit={saveForm} className="space-y-3">
              <Field label="Nome">
                <input required value={form.Nome} onChange={e => setForm(f => ({ ...f, Nome: e.target.value }))}
                  className="input" />
              </Field>
              <Field label="Entidade">
                <select value={form.Entidade} onChange={e => setForm(f => ({ ...f, Entidade: e.target.value }))}
                  className="input">
                  {ENTIDADES.map(e => <option key={e}>{e}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo">
                  <select value={form.Tipo} onChange={e => setForm(f => ({ ...f, Tipo: e.target.value }))}
                    className="input">
                    {tipos.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Quantidade">
                  <input
                    type="number" min="1" max="999"
                    value={form.Quantidade}
                    onChange={e => setForm(f => ({ ...f, Quantidade: e.target.value }))}
                    className="input"
                  />
                </Field>
              </div>
              <Field label="Email">
                <input type="email" value={form.Email} onChange={e => setForm(f => ({ ...f, Email: e.target.value }))}
                  className="input" />
              </Field>
              <Field label="Enviado Por">
                <select value={form.EnviadoPor} onChange={e => setForm(f => ({ ...f, EnviadoPor: e.target.value }))}
                  className="input">
                  {ENVIADO_POR.map(p => <option key={p} value={p}>{p || '— selecionar —'}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.STATUS} onChange={e => setForm(f => ({ ...f, STATUS: e.target.value }))}
                  className="input">
                  <option>Por Enviar</option>
                  <option>Enviado</option>
                  <option>Verificar</option>
                </select>
              </Field>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dias</label>
                <div className="flex flex-wrap gap-3">
                  {dias.map(d => (
                    <label key={d} className="flex items-center gap-1 text-sm cursor-pointer">
                      <input type="checkbox"
                        checked={form[`Dia_${d}`] === 'Sim'}
                        onChange={e => setForm(f => ({ ...f, [`Dia_${d}`]: e.target.checked ? 'Sim' : 'Não' }))}
                        className="rounded" />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
              <Field label="Observações">
                <textarea value={form.Observacoes} onChange={e => setForm(f => ({ ...f, Observacoes: e.target.value }))}
                  rows={2} className="input" />
              </Field>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50">
                  {saving ? 'A guardar...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`.input { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; font-size: 14px; outline: none; }`}</style>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
