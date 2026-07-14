import { addDays, subDays, setHours, setMinutes, format } from 'date-fns'

export interface OperationalOrder {
  pedido: string
  cliente: string
  envioLiberacao: Date
  prevEntr: Date
  tpEntrega: string
  cidade: string
  uf: string
  prazoTransportadora: number // Em dias
  status:
    | 'Aguardando Separação'
    | 'Em Separação'
    | 'Conferência'
    | 'Faturado'
    | 'Transmitido NFe'
    | 'Finalizado'
  situacao: 'Normal' | 'Atrasado' | 'Gargalo'
}

const today = new Date()

// Gera dados mockados consistentes com a especificação (mas SEM as linhas reais dos arquivos)
export const mockOrders: OperationalOrder[] = [
  {
    pedido: 'PED-1001',
    cliente: 'Logística Alfa Ltda',
    envioLiberacao: setMinutes(setHours(today, 9), 30),
    prevEntr: addDays(today, 5),
    tpEntrega: 'Padrão',
    cidade: 'SÃO PAULO',
    uf: 'SP',
    prazoTransportadora: 2,
    status: 'Aguardando Separação',
    situacao: 'Normal',
  },
  {
    pedido: 'PED-1002',
    cliente: 'Comercial Beta S.A.',
    envioLiberacao: setMinutes(setHours(subDays(today, 1), 14), 15),
    prevEntr: addDays(today, 2),
    tpEntrega: 'Expressa',
    cidade: 'CAMPINAS',
    uf: 'SP',
    prazoTransportadora: 1,
    status: 'Conferência',
    situacao: 'Normal',
  },
  {
    pedido: 'PED-1003',
    cliente: 'Distribuidora Gama',
    envioLiberacao: setMinutes(setHours(subDays(today, 2), 10), 0),
    prevEntr: today,
    tpEntrega: 'Padrão',
    cidade: 'BELO HORIZONTE',
    uf: 'MG',
    prazoTransportadora: 4,
    status: 'Transmitido NFe',
    situacao: 'Atrasado',
  },
  {
    pedido: 'PED-1004',
    cliente: 'Varejo Delta',
    envioLiberacao: setMinutes(setHours(today, 11), 45), // Pós-corte
    prevEntr: addDays(today, 6),
    tpEntrega: 'Econômica',
    cidade: 'CURITIBA',
    uf: 'PR',
    prazoTransportadora: 3,
    status: 'Aguardando Separação',
    situacao: 'Normal',
  },
  {
    pedido: 'PED-1005',
    cliente: 'E-commerce Ômega',
    envioLiberacao: setMinutes(setHours(today, 8), 10),
    prevEntr: addDays(today, 8),
    tpEntrega: 'Padrão',
    cidade: 'SALVADOR',
    uf: 'BA',
    prazoTransportadora: 6,
    status: 'Em Separação',
    situacao: 'Gargalo',
  },
  {
    pedido: 'PED-1006',
    cliente: 'Lojas Zeta',
    envioLiberacao: setMinutes(setHours(subDays(today, 1), 16), 20),
    prevEntr: addDays(today, 3),
    tpEntrega: 'Expressa',
    cidade: 'RIO DE JANEIRO',
    uf: 'RJ',
    prazoTransportadora: 2,
    status: 'Faturado',
    situacao: 'Normal',
  },
  {
    pedido: 'PED-1007',
    cliente: 'Atacado Sigma',
    envioLiberacao: setMinutes(setHours(subDays(today, 3), 9), 0),
    prevEntr: subDays(today, 1),
    tpEntrega: 'Padrão',
    cidade: 'PORTO ALEGRE',
    uf: 'RS',
    prazoTransportadora: 4,
    status: 'Em Separação',
    situacao: 'Atrasado',
  },
  {
    pedido: 'PED-1008',
    cliente: 'Tech Vendas',
    envioLiberacao: setMinutes(setHours(today, 10), 15),
    prevEntr: addDays(today, 7),
    tpEntrega: 'Padrão',
    cidade: 'GOIANIA',
    uf: 'GO',
    prazoTransportadora: 4,
    status: 'Aguardando Separação',
    situacao: 'Normal',
  },
]

// Helper to calculate Data para Separação
export function calcularDataSeparacao(prevEntr: Date, prazoTransportadora: number): Date {
  return subDays(prevEntr, prazoTransportadora)
}

// Helper to calculate Data Segura
export function calcularDataSegura(dataSeparacao: Date): Date {
  return subDays(dataSeparacao, 1)
}

export function formatDateTime(date: Date) {
  return format(date, 'dd/MM/yyyy HH:mm')
}

export function formatDate(date: Date) {
  return format(date, 'dd/MM/yyyy')
}

export const heatmapMonths = ['janeiro', 'fevereiro', 'março', 'abril']
export const heatmapDataByDay: Record<
  number,
  Record<string, { p: number | null; f: number | null; pct: number | null }>
> = {}
for (let i = 1; i <= 31; i++) {
  heatmapDataByDay[i] = {
    janeiro: { p: null, f: null, pct: null },
    fevereiro: { p: null, f: null, pct: null },
    março: { p: null, f: null, pct: null },
    abril: { p: null, f: null, pct: null },
  }
}

const mockHeatmapEntries = [
  { m: 'janeiro', d: 5, p: 224, f: 124, pct: 55.36 },
  { m: 'janeiro', d: 6, p: 198, f: 214, pct: 108.08 },
  { m: 'janeiro', d: 7, p: 173, f: 205, pct: 118.5 },
  { m: 'janeiro', d: 8, p: 172, f: 181, pct: 105.23 },
  { m: 'janeiro', d: 9, p: 139, f: 168, pct: 120.86 },
  { m: 'janeiro', d: 10, p: null, f: 18, pct: null },
  { m: 'janeiro', d: 12, p: 179, f: 152, pct: 84.92 },
  { m: 'janeiro', d: 13, p: 146, f: 146, pct: 100.0 },
  { m: 'janeiro', d: 14, p: 190, f: 174, pct: 91.58 },
  { m: 'janeiro', d: 15, p: 176, f: 170, pct: 96.59 },
  { m: 'janeiro', d: 16, p: 126, f: 185, pct: 146.83 },

  { m: 'fevereiro', d: 2, p: 262, f: 147, pct: 56.11 },
  { m: 'fevereiro', d: 3, p: 233, f: 215, pct: 92.27 },
  { m: 'fevereiro', d: 4, p: 245, f: 207, pct: 84.49 },
  { m: 'fevereiro', d: 5, p: 202, f: 233, pct: 115.35 },
  { m: 'fevereiro', d: 6, p: 146, f: 236, pct: 161.64 },
  { m: 'fevereiro', d: 7, p: null, f: 67, pct: null },
  { m: 'fevereiro', d: 9, p: 161, f: 78, pct: 48.45 },
  { m: 'fevereiro', d: 10, p: 220, f: 186, pct: 84.55 },
  { m: 'fevereiro', d: 11, p: 219, f: 178, pct: 81.28 },
  { m: 'fevereiro', d: 12, p: 248, f: 178, pct: 71.77 },
  { m: 'fevereiro', d: 13, p: 149, f: 187, pct: 125.5 },
  { m: 'fevereiro', d: 14, p: null, f: 125, pct: null },
  { m: 'fevereiro', d: 16, p: 16, f: null, pct: null },

  { m: 'março', d: 2, p: 235, f: 85, pct: 36.17 },
  { m: 'março', d: 3, p: 262, f: 172, pct: 65.65 },
  { m: 'março', d: 4, p: 260, f: 192, pct: 73.85 },
  { m: 'março', d: 5, p: 183, f: 224, pct: 122.4 },
  { m: 'março', d: 6, p: 148, f: 195, pct: 131.76 },
  { m: 'março', d: 7, p: null, f: 104, pct: null },
  { m: 'março', d: 8, p: null, f: 134, pct: null },
  { m: 'março', d: 9, p: 154, f: 65, pct: 42.21 },
  { m: 'março', d: 10, p: 224, f: 179, pct: 79.91 },
  { m: 'março', d: 11, p: 180, f: 179, pct: 99.44 },
  { m: 'março', d: 12, p: 207, f: 212, pct: 102.42 },
  { m: 'março', d: 13, p: 269, f: 208, pct: 77.32 },
  { m: 'março', d: 14, p: null, f: 79, pct: null },
  { m: 'março', d: 16, p: 157, f: 150, pct: 95.54 },

  { m: 'abril', d: 1, p: null, f: 206, pct: null },
  { m: 'abril', d: 2, p: null, f: 229, pct: null },
  { m: 'abril', d: 5, p: 17, f: null, pct: null },
  { m: 'abril', d: 6, p: 207, f: null, pct: null },
  { m: 'abril', d: 7, p: 225, f: null, pct: null },
  { m: 'abril', d: 8, p: 238, f: null, pct: null },
  { m: 'abril', d: 9, p: 204, f: null, pct: null },
  { m: 'abril', d: 10, p: 260, f: null, pct: null },
  { m: 'abril', d: 13, p: 158, f: null, pct: null },
  { m: 'abril', d: 14, p: 220, f: null, pct: null },
  { m: 'abril', d: 15, p: 228, f: null, pct: null },
  { m: 'abril', d: 16, p: 294, f: null, pct: null },
]

mockHeatmapEntries.forEach((entry) => {
  heatmapDataByDay[entry.d][entry.m] = { p: entry.p, f: entry.f, pct: entry.pct }
})
