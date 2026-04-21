export const FESTIVALS = {
  RIR: 'RiR',
  NOSALIVE: 'NosAlive',
}

export const FESTIVAL_LABELS = {
  RiR: 'Rock in Rio',
  NosAlive: 'NOS Alive',
}

export const RIR_DAYS = ['20jun', '21jun', '27jun', '28jun']
export const NOSALIVE_DAYS = ['9jul', '10jul', '11jul']

export const RIR_TIPOS = ['Relvado', 'Rooftop', 'VIP', 'Slide']
export const NOSALIVE_TIPOS = ['Relvado', 'Rooftop']

// Hardcoded stock negociado
export const STOCK_RIR = {
  Relvado: { '20jun': 98, '21jun': 98, '27jun': 125, '28jun': 144 },
  Rooftop: { '20jun': 200, '21jun': 200, '27jun': 200, '28jun': 200 },
  VIP:     { '20jun': 25,  '21jun': 25,  '27jun': 34,  '28jun': 40  },
  Slide:   { '20jun': 0,   '21jun': 0,   '27jun': 0,   '28jun': 0   },
}

export const STOCK_NOSALIVE = {
  Relvado: { '9jul': 100, '10jul': 100, '11jul': 100 },
  Rooftop: { '9jul': 40,  '10jul': 40,  '11jul': 45  },
}

export const ENTIDADES = [
  'Admin/Dire.', 'BYD Portugal', 'Rede BYD', 'Cliente BYD',
  'Proteção', 'Jornalistas', 'Parceiros', 'Embaixadores',
  'Influencers', 'Fornecedores', 'Frotas', 'Internos GSC', 'Outros',
]

// Tipos que incluem bilhete Relvado e também consomem stock de Relvado
export const INCLUI_RELVADO = {
  RiR: ['Slide'],
  NosAlive: ['Rooftop'],
}
export const STATUS_DISTRIB = ['Disponível', 'Atribuído', 'Enviado']

export const STATUS_NEXT = {
  'Por Enviar': 'Enviado',
  'Enviado': 'Verificar',
  'Verificar': 'Por Enviar',
}

export const STATUS_COLORS = {
  'Por Enviar': 'bg-yellow-100 text-yellow-800',
  'Enviado':    'bg-green-100 text-green-800',
  'Verificar':  'bg-red-100 text-red-800',
}
