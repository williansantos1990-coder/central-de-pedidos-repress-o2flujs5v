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
