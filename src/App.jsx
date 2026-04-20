import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { FESTIVALS, FESTIVAL_LABELS } from './lib/constants'
import Login from './components/Login'
import StockView from './components/StockView'
import PedidosView from './components/PedidosView'
import DistribView from './components/DistribView'

const TABS = [
  { id: 'stock', label: 'Stock' },
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'distribuicao', label: 'Distribuição' },
]

export default function App() {
  const [session, setSession] = useState(undefined)
  const [festival, setFestival] = useState(FESTIVALS.RIR)
  const [tab, setTab] = useState('stock')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">A carregar...</div>
  }

  if (!session) return <Login />

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="font-bold text-slate-800 text-lg">BYD Festivais 2026</div>

          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {Object.values(FESTIVALS).map(f => (
              <button key={f}
                onClick={() => setFestival(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  festival === f ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {FESTIVAL_LABELS[f]}
              </button>
            ))}
          </div>

          <nav className="flex gap-1">
            {TABS.map(t => (
              <button key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}>
                {t.label}
              </button>
            ))}
          </nav>

          <button onClick={signOut}
            className="text-xs text-slate-400 hover:text-slate-600 transition">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'stock' && <StockView festival={festival} />}
        {tab === 'pedidos' && <PedidosView festival={festival} />}
        {tab === 'distribuicao' && <DistribView festival={festival} />}
      </main>
    </div>
  )
}
