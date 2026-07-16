import { generateXlsx, downloadXlsx } from '@/lib/xlsx-generator'
import { formatDate, formatDateTime, parsePBDate } from '@/lib/order-utils'
import type { Pedve012Record } from '@/services/pedve012'
import type { Pedve005Record } from '@/services/pedve005'
import type { TransportadoraRecord } from '@/services/transportadoras'

interface DashboardExportParams {
  pedve012: Pedve012Record[]
  pedve005: Pedve005Record[]
  transportadoras: TransportadoraRecord[]
}

const DASHBOARD_COLUMNS: { key: string; label: string }[] = [
  { key: 'pedido', label: 'pedido' },
  { key: 'status', label: 'status' },
  { key: 'situacao', label: 'situacao' },
  { key: 'nota_fiscal', label: 'nota_fiscal' },
  { key: 'qtd_itens', label: 'qtd_itens' },
  { key: 'cliente', label: 'cliente' },
  { key: 'cidade', label: 'cidade' },
  { key: 'bairro', label: 'bairro' },
  { key: 'tipo_entrega', label: 'tipo_entrega' },
  { key: 'emissao', label: 'emissao' },
  { key: 'envio_liberacao', label: 'envio_liberacao' },
  { key: 'prev_entr', label: 'prev_entr' },
  { key: 'transmitir_nfe', label: 'transmitir_nfe' },
  { key: 'transportadora', label: 'transportadora' },
  { key: 'prazo_transportadora', label: 'prazo_transportadora' },
  { key: 'prazo_de_entrega', label: 'prazo_de_entrega' },
]

const DATE_FIELDS = new Set(['emissao', 'envio_liberacao', 'prev_entr', 'transmitir_nfe'])
const NUMBER_FIELDS = new Set(['qtd_itens', 'prazo_de_entrega'])

function formatFieldValue(key: string, value: unknown): string | number {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'number') return value
  const str = String(value)
  if (DATE_FIELDS.has(key)) {
    const parsed = parsePBDate(str)
    if (parsed) {
      return str.includes('T') || str.includes(':') ? formatDateTime(parsed) : formatDate(parsed)
    }
    return str
  }
  if (NUMBER_FIELDS.has(key)) {
    const num = parseFloat(str.replace(',', '.'))
    if (!isNaN(num)) return num
  }
  return str
}

export function exportDashboardToXlsx({
  pedve012,
  pedve005,
  transportadoras,
}: DashboardExportParams) {
  const p005Map = new Map<string, Pedve005Record>()
  pedve005.forEach((r) => {
    if (r.pedido) p005Map.set(r.pedido, r)
  })

  const transpByDestino = new Map<string, TransportadoraRecord>()
  transportadoras.forEach((t) => {
    if (t.destino) {
      transpByDestino.set(t.destino.toUpperCase().trim(), t)
    }
  })

  const rows: (string | number)[][] = []

  const headerRow = DASHBOARD_COLUMNS.map((c) => c.label)
  rows.push(headerRow)

  for (const p012 of pedve012) {
    const p005 = p005Map.get(p012.pedido)
    const cidadeKey = (p005?.cidade || '').toUpperCase().trim()
    const transp = transpByDestino.get(cidadeKey)

    const sourceMap: Record<string, Record<string, unknown> | undefined> = {
      p012: p012 as unknown as Record<string, unknown>,
      p005: p005 as unknown as Record<string, unknown> | undefined,
      transp: transp as unknown as Record<string, unknown> | undefined,
    }

    const fieldSource: Record<string, 'p012' | 'p005' | 'transp'> = {
      pedido: 'p012',
      status: 'p005',
      situacao: 'p012',
      nota_fiscal: 'p012',
      qtd_itens: 'p005',
      cliente: 'p012',
      cidade: 'p005',
      bairro: 'p012',
      tipo_entrega: 'p012',
      emissao: 'p012',
      envio_liberacao: 'p012',
      prev_entr: 'p012',
      transmitir_nfe: 'p012',
      transportadora: 'transp',
      prazo_transportadora: 'transp',
      prazo_de_entrega: 'transp',
    }

    const row: (string | number)[] = DASHBOARD_COLUMNS.map((col) => {
      const srcKey = fieldSource[col.key]
      const source = sourceMap[srcKey]
      const rawValue = source ? source[col.key] : undefined
      return formatFieldValue(col.key, rawValue)
    })
    rows.push(row)
  }

  const xlsxData = generateXlsx([{ name: 'Dashboard Export', rows }])
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  downloadXlsx(xlsxData, `dashboard_export_${dateStr}.xlsx`)
}
