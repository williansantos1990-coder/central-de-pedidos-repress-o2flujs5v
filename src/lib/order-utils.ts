import { subDays, format, differenceInCalendarDays } from 'date-fns'
import type { TransportadoraRecord } from '@/services/transportadoras'

export function parsePBDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

export function extractDateKey(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const d = parsePBDate(dateStr)
  if (!d) return null
  return format(d, 'yyyy-MM-dd')
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return '-'
  return format(date, 'dd/MM/yyyy')
}

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return '-'
  return format(date, 'dd/MM/yyyy HH:mm')
}

export function calcularDataSeparacao(prevEntr: Date, prazoDias: number): Date {
  return subDays(prevEntr, prazoDias)
}

export function calcularDataSegura(dataSeparacao: Date): Date {
  return subDays(dataSeparacao, 1)
}

export function calcularDiasAtrasos(
  dataSeparacao: Date | null,
  envioLiberacao: Date | null,
): number | null {
  if (!dataSeparacao || !envioLiberacao) return null
  return differenceInCalendarDays(dataSeparacao, envioLiberacao)
}

export function findPrazoByCity(
  cidade: string,
  transportadoras: TransportadoraRecord[],
): number | null {
  if (!cidade) return null
  const normalized = cidade.toUpperCase().trim()
  const match = transportadoras.find((t) => t.destino?.toUpperCase().trim() === normalized)
  return match?.prazo_de_entrega ?? null
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '0'
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function getStatusBadgeClass(status: string): string {
  const s = (status || '').toLowerCase()
  if (s.includes('finalizado') || s.includes('transmitido')) return 'badge-success'
  if (s.includes('gargalo') || s.includes('atrasado')) return 'badge-error'
  if (s.includes('aguardando') || s.includes('separação') || s.includes('separacao'))
    return 'badge-warning'
  return 'badge-info'
}
