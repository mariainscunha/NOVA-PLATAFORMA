import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  document.body.innerHTML = '<div style="font-family:sans-serif;padding:40px;color:red"><h2>Configuração em falta</h2><p>As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão definidas.<br>Adiciona os secrets no GitHub e volta a correr o workflow.</p></div>'
  throw new Error('Missing Supabase env vars')
}

export const supabase = createClient(url, key)
