import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { exportExcel } from '../lib/excel'
import { FESTIVALS, RIR_DAYS, NOSALIVE_DAYS, RIR_TIPOS, NOSALIVE_TIPOS } from '../lib/constants'

const EMPTY_FORM = {
  NrBilhete: '', Tipo: 'Relvado', Dia: '', Status: 'Disponível',
  Nome: '', Email: '', Telefone: '', AcaoParceiro: '',
}

export default function DistribView({ festival }) {
  const isRiR = festival === FESTIVALS.RIR
  const dias = isRiR ? RIR_DAYS : NOSALIVE_DAYS
  const tipos = isRiR ? RIR_TIPOS : NOSALIVE_TIPOS
  const table = isRiR ? 'DISTRIB_RiR' : 'DISTRIB_NosAlive'
  const bdTable = isRiR ? 'BD_RiR' : 'BD_NosAlive'

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM, Tipo: tipos[0], Dia: dias[0] })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [nomeSuggestions, setNomeSuggestions] = useState([])
  const [filterSec, setFilterSec] = useState('')
  const [filterDia, setFilterDia] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from(table).select('*').order('Dia').order('NrBilhete')
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [festival])

  // fetch name suggestions when Tipo/Dia changes in form
  useEffect(() => {
    if (!form.Tipo || !form.Dia) return
    async function fetchNomes() {
      const diaCol = `Dia_${form.Dia}`
      const { data } = await supabase
        .from(bdTable)
        .select('Nome')
        .eq('Tipo', form.Tipo)
        .eq(diaCol, 'Sim')
        .neq('STATUS', 'Verificar')
      setNomeSuggestions((data || []).map(r => r.Nome).filter(Boolean))
    }
    fetchNomes()
  }, [form.Tipo, form.Dia, festival])

  async function marcarEnviado(row) {
    await supabase.from(table).update({ Status: 'Enviado' }).eq('id', row.id)
    // sync BD
    if (row.Nome) {
      const diaCol = `Dia_${row.Dia}`
      const { data: bd } = await supabase
        .from(bdTable)
        .select('id')
        .eq('Nome', row.Nome)
        .eq('Tipo', row.Tipo)
        .eq(diaCol, 'Sim')
        .neq('STATUS', 'Verificar')
        .limit(1)
      if (bd?.length) {
        await supabase.from(bdTable).update({ STATUS: 'Enviado' }).eq('id', bd[0].id)
      }
    }
    load()
  }

  async function updateStatus(row, newStatus) {
    await supabase.from(table).update({ Status: newStatus }).eq('id', row.id)
    if (newStatus === 'Enviado' && row.Nome) {
      const diaCol = `Dia_${row.Dia}`
      const { data: bd } = await supabase
        .from(bdTable)
        .select('id')
        .eq('Nome', row.Nome)
        .eq('Tipo', row.Tipo)
        .eq(diaCol, 'Sim')
        .neq('STATUS', 'Verificar')
        .limit(1)
      if (bd?.length) {
        await supabase.from(bdTable).update({ STATUS: 'Enviado' }).eq('id', bd[0].id)
      }
    }
    load()
  }

  function openNew() {
    setEditId(null)
    setForm({ ...EMPTY_FORM, Tipo: tipos[0], Dia: dias[0] })
    setShowForm(true)
  }

  function openEdit(row) {
    setEditId(row.id)
    setForm({
      NrBilhete: row.NrBilhete || '',
      Tipo: row.Tipo || tipos[0],
      Dia: row.Dia || dias[0],
      Status: row.Status || 'Disponível',
      Nome: row.Nome || '',
      Email: row.Email || '',
      Telefone: row.Telefone || '',
      AcaoParceiro: row.AcaoParceiro || '',
    })
    setShowForm(true)
  }

  async function saveForm(e) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form }
    // auto-set status when nome assigned
    if (payload.Nome && payload.Status === 'Disponível') {
      payload.Status = 'Atribuído'
    }
    if (!payload.Nome) payload.Status = 'Disponível'
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
    if (!confirm('Eliminar este bilhete?')) return
    await supabase.from(table).delete().eq('id', id)
    load()
  }

  async function handleExport() {
    const { data: bdData } = await supabase.from(bdTable).select('*')
    exportExcel(festival, bdData || [], rows)
  }

  const disponíveis = rows.filter(r => r.Status === 'Disponível' || (!r.Nome && r.Status !== 'Atribuído' && r.Status !== 'Enviado'))
    .filter(r => !filterDia || r.Dia === filterDia)
  const atribuídos = rows.filter(r => r.Status === 'Atribuído')
    .filter(r => !filterDia || r.Dia === filterDia)
  const enviados = rows.filter(r => r.Status === 'Enviado')
    .filter(r => !filterDia || r.Dia === filterDia)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <select value={filterDia} onChange={e => setFilterDia(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">Todos os dias</option>
          {dias.map(d => <option key={d}>{d}</option>)}
        </select>
        <button onClick={openNew}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          + Novo Bilhete
        </button>
        <button onClick={handleExport}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          ↓ Excel
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">A carregar...</div>
      ) : (
        <>
          <Section title="Não Alocados" count={disponíveis.length} color="text-slate-600">
            <DistribTable rows={disponíveis} dias={dias} tipos={tipos}
              cols={['Dia', 'NrBilhete', 'Tipo', 'AcaoParceiro']}
              onEdit={openEdit} onDelete={deleteRow}
              renderActions={row => (
                <button onClick={() => openEdit(row)} className="text-blue-600 hover:underline text-xs">Alocar</button>
              )} />
          </Section>

          <Section title="Alocados — Por Enviar" count={atribuídos.length} color="text-amber-600">
            <DistribTable rows={atribuídos} dias={dias} tipos={tipos}
              cols={['Dia', 'NrBilhete', 'Tipo', 'Nome', 'Email']}
              onEdit={openEdit} onDelete={deleteRow}
              renderActions={row => (
                <button onClick={() => marcarEnviado(row)}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded-lg transition">
                  ✓ Enviado
                </button>
              )} />
          </Section>

          <Section title="Enviados" count={enviados.length} color="text-green-600">
            <DistribTable rows={enviados} dias={dias} tipos={tipos}
              cols={['Dia', 'NrBilhete', 'Tipo', 'Nome', 'Email']}
              onEdit={openEdit} onDelete={deleteRow} />
          </Section>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-screen overflow-y-auto">
            <div className="text-lg font-semibold text-slate-800 mb-4">
              {editId ? 'Editar Bilhete' : 'Novo Bilhete'}
            </div>
            <form onSubmit={saveForm} className="space-y-3">
              <Field label="Nº Bilhete">
                <input required value={form.NrBilhete} onChange={e => setForm(f => ({ ...f, NrBilhete: e.target.value }))}
                  className="input" />
              </Field>
              <Field label="Tipo">
                <select value={form.Tipo} onChange={e => setForm(f => ({ ...f, Tipo: e.target.value }))}
                  className="input">
                  {tipos.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Dia">
                <select value={form.Dia} onChange={e => setForm(f => ({ ...f, Dia: e.target.value }))}
                  className="input">
                  {dias.map(d => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Nome (opcional — filtra por Tipo+Dia da BD)">
                <input
                  list="nomes-list"
                  value={form.Nome}
                  onChange={e => setForm(f => ({ ...f, Nome: e.target.value }))}
                  className="input"
                  placeholder="Deixar em branco = Disponível"
                />
                <datalist id="nomes-list">
                  {nomeSuggestions.map(n => <option key={n} value={n} />)}
                </datalist>
              </Field>
              <Field label="Email">
                <input type="email" value={form.Email} onChange={e => setForm(f => ({ ...f, Email: e.target.value }))}
                  className="input" />
              </Field>
              <Field label="Telefone">
                <input value={form.Telefone} onChange={e => setForm(f => ({ ...f, Telefone: e.target.value }))}
                  className="input" />
              </Field>
              <Field label="Ação Parceiro">
                <input value={form.AcaoParceiro} onChange={e => setForm(f => ({ ...f, AcaoParceiro: e.target.value }))}
                  className="input" />
              </Field>
              <Field label="Status">
                <select value={form.Status} onChange={e => setForm(f => ({ ...f, Status: e.target.value }))}
                  className="input">
                  <option>Disponível</option>
                  <option>Atribuído</option>
                  <option>Enviado</option>
                </select>
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

      <style>{`.input { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; font-size: 14px; outline: none; box-sizing: border-box; }`}</style>
    </div>
  )
}

function Section({ title, count, color, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2">
        <span className={`font-semibold text-sm ${color}`}>{title}</span>
        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{count}</span>
      </div>
      {children}
    </div>
  )
}

function DistribTable({ rows, cols, onEdit, onDelete, renderActions }) {
  if (!rows.length) {
    return <div className="text-center py-6 text-slate-400 text-sm">Sem bilhetes</div>
  }
  const colLabels = { Dia: 'Dia', NrBilhete: 'Nº Bilhete', Tipo: 'Tipo', AcaoParceiro: 'Ação Parceiro', Nome: 'Nome', Email: 'Email' }
  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            {cols.map(c => <th key={c} className="px-4 py-2 text-left">{colLabels[c]}</th>)}
            <th className="px-4 py-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(row => (
            <tr key={row.id} className="hover:bg-slate-50">
              {cols.map(c => (
                <td key={c} className="px-4 py-2 text-slate-700">{row[c] || '–'}</td>
              ))}
              <td className="px-4 py-2 flex gap-2 items-center">
                {renderActions?.(row)}
                <button onClick={() => onEdit(row)} className="text-slate-400 hover:text-slate-600 text-sm">✏️</button>
                <button onClick={() => onDelete(row.id)} className="text-slate-400 hover:text-red-600 text-sm">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
