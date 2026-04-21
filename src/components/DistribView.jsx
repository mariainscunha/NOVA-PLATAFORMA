import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { exportExcel } from '../lib/excel'
import { FESTIVALS, RIR_DAYS, NOSALIVE_DAYS, RIR_TIPOS, NOSALIVE_TIPOS } from '../lib/constants'

const EMPTY_FORM = {
  NrBilhete: '', Tipo: 'Relvado', Dia: '', Status: 'Disponível',
  Nome: '', Email: '', Telefone: '', AcaoParceiro: '',
}

function NomeAutocomplete({ value, onChange, suggestions }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const ref = useRef(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handleClick(e) {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = query
    ? suggestions.filter(s => s.Nome.toLowerCase().includes(query.toLowerCase()))
    : suggestions

  function select(nome) {
    setQuery(nome)
    setOpen(false)
    onChange(nome)
  }

  function handleInput(e) {
    const v = e.target.value
    setQuery(v)
    setOpen(true)
    onChange(v)
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        className="input"
        placeholder="Escreve para filtrar..."
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
          {filtered.map(s => (
            <li
              key={s.Nome}
              onMouseDown={() => select(s.Nome)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex justify-between items-center"
            >
              <span className="font-medium text-slate-800">{s.Nome}</span>
              {s.Entidade && <span className="text-xs text-slate-400 ml-2">{s.Entidade}</span>}
            </li>
          ))}
        </ul>
      )}
      {open && filtered.length === 0 && query && (
        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 px-3 py-2 text-sm text-slate-400">
          Sem resultados
        </div>
      )}
    </div>
  )
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
  const [filterDia, setFilterDia] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from(table).select('*').order('Dia').order('NrBilhete')
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [festival])

  useEffect(() => {
    if (!showForm) return
    async function fetchNomes() {
      const { data } = await supabase
        .from(bdTable)
        .select('Nome,Entidade')
        .neq('STATUS', 'Verificar')
      const unique = []
      const seen = new Set()
      for (const r of (data || [])) {
        if (r.Nome && !seen.has(r.Nome)) {
          seen.add(r.Nome)
          unique.push(r)
        }
      }
      setNomeSuggestions(unique)
    }
    fetchNomes()
  }, [showForm, bdTable])

  function handleNomeChange(nome) {
    const match = nomeSuggestions.find(s => s.Nome === nome)
    setForm(f => ({
      ...f,
      Nome: nome,
      AcaoParceiro: match ? (match.Entidade || '') : f.AcaoParceiro,
      Status: nome ? (f.Status === 'Disponível' ? 'Atribuído' : f.Status) : 'Disponível',
    }))
  }

  async function marcarEnviado(row) {
    await supabase.from(table).update({ Status: 'Enviado' }).eq('id', row.id)
    if (row.Nome) {
      const diaCol = `Dia_${row.Dia}`
      const { data: bd } = await supabase
        .from(bdTable).select('id')
        .eq('Nome', row.Nome).eq('Tipo', row.Tipo)
        .eq(diaCol, 'Sim').neq('STATUS', 'Verificar').limit(1)
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
    if (!payload.Nome) {
      payload.Status = 'Disponível'
    } else if (payload.Status === 'Disponível') {
      payload.Status = 'Atribuído'
    }
    if (editId) {
      await supabase.from(table).update(payload).eq('id', editId)
      if (payload.Status === 'Enviado' && payload.Nome) {
        const diaCol = `Dia_${payload.Dia}`
        const { data: bd } = await supabase
          .from(bdTable).select('id')
          .eq('Nome', payload.Nome).eq('Tipo', payload.Tipo)
          .eq(diaCol, 'Sim').neq('STATUS', 'Verificar').limit(1)
        if (bd?.length) await supabase.from(bdTable).update({ STATUS: 'Enviado' }).eq('id', bd[0].id)
      }
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

  const disponíveis = rows.filter(r => r.Status === 'Disponível').filter(r => !filterDia || r.Dia === filterDia)
  const atribuídos  = rows.filter(r => r.Status === 'Atribuído').filter(r => !filterDia || r.Dia === filterDia)
  const enviados    = rows.filter(r => r.Status === 'Enviado').filter(r => !filterDia || r.Dia === filterDia)

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
            <DistribTable rows={disponíveis}
              cols={['Dia', 'NrBilhete', 'Tipo', 'AcaoParceiro']}
              onEdit={openEdit} onDelete={deleteRow}
              renderActions={row => (
                <button onClick={() => openEdit(row)} className="text-blue-600 hover:underline text-xs">Alocar</button>
              )} />
          </Section>

          <Section title="Alocados — Por Enviar" count={atribuídos.length} color="text-amber-600">
            <DistribTable rows={atribuídos}
              cols={['Dia', 'NrBilhete', 'Tipo', 'Nome', 'AcaoParceiro', 'Email']}
              onEdit={openEdit} onDelete={deleteRow}
              renderActions={row => (
                <button onClick={() => marcarEnviado(row)}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded-lg transition">
                  ✓ Enviado
                </button>
              )} />
          </Section>

          <Section title="Enviados" count={enviados.length} color="text-green-600">
            <DistribTable rows={enviados}
              cols={['Dia', 'NrBilhete', 'Tipo', 'Nome', 'AcaoParceiro', 'Email']}
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
                <input required value={form.NrBilhete}
                  onChange={e => setForm(f => ({ ...f, NrBilhete: e.target.value }))}
                  className="input" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <Field label="Nome">
                <NomeAutocomplete
                  value={form.Nome}
                  onChange={handleNomeChange}
                  suggestions={nomeSuggestions}
                />
                <div className="text-xs mt-1">
                  {form.Nome
                    ? <span className="text-amber-600">→ Atribuído</span>
                    : <span className="text-slate-400">→ Deixar vazio = Disponível</span>}
                </div>
              </Field>

              <Field label="Entidade (Ação Parceiro)">
                <input value={form.AcaoParceiro}
                  onChange={e => setForm(f => ({ ...f, AcaoParceiro: e.target.value }))}
                  className="input"
                  placeholder="Preenchido automaticamente" />
              </Field>

              <Field label="Email">
                <input type="email" value={form.Email}
                  onChange={e => setForm(f => ({ ...f, Email: e.target.value }))}
                  className="input" />
              </Field>
              <Field label="Telefone">
                <input value={form.Telefone}
                  onChange={e => setForm(f => ({ ...f, Telefone: e.target.value }))}
                  className="input" />
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
  const colLabels = {
    Dia: 'Dia', NrBilhete: 'Nº Bilhete', Tipo: 'Tipo',
    AcaoParceiro: 'Entidade', Nome: 'Nome', Email: 'Email',
  }
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
