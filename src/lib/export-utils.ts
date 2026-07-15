import type { Pedve012Record } from '@/services/pedve012'
import type { Pedve005Record } from '@/services/pedve005'
import type { TransportadoraRecord } from '@/services/transportadoras'
import {
  formatDateTime,
  formatDate,
  parsePBDate,
  calcularDataSeparacao,
  calcularDataSegura,
} from './order-utils'

interface ExportOptions {
  pedve012: Pedve012Record[]
  pedve005: Pedve005Record[]
  transportadoras: TransportadoraRecord[]
}

type CollectionSource = 'p012' | 'p005' | 'transp' | 'calculated'

const EXPORT_COLUMNS: { key: string; label: string; from: CollectionSource }[] = [
  { key: 'pedido', label: 'Pedido', from: 'p012' },
  { key: 'situacao', label: 'Situação', from: 'p012' },
  { key: 'cliente', label: 'Cliente', from: 'p012' },
  { key: 'cidade', label: 'Cidade', from: 'p005' },
  { key: 'tipo_entrega', label: 'Tipo de Entrega', from: 'p012' },
  { key: 'transportadora', label: 'Transportadora', from: 'transp' },
  { key: 'prazo_de_entrega', label: 'Prazo de Entrega', from: 'transp' },
  { key: 'emissao', label: 'Emissão', from: 'p012' },
  { key: 'envio_liberacao', label: 'Envio/Liberação', from: 'p012' },
  { key: 'prev_entr', label: 'Prev. Entr.', from: 'p012' },
  { key: 'qtd_itens', label: 'Qtd Itens', from: 'p005' },
  { key: 'data_sep', label: 'Data Sep.', from: 'calculated' },
  { key: 'data_segura', label: 'Data Segura', from: 'calculated' },
]

const DATE_FIELDS = new Set(['emissao', 'envio_liberacao', 'prev_entr', 'transmitir_nfe'])

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatFieldValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'number') return String(value)
  const str = String(value)
  if (DATE_FIELDS.has(key)) {
    if (str.includes('T') || str.includes(':')) {
      return formatDateTime(new Date(str))
    }
    return formatDate(new Date(str))
  }
  return str
}

function triggerDownload(csvContent: string, filename: string) {
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportOrdersToCSV({ pedve012, pedve005, transportadoras }: ExportOptions) {
  const p005Map = new Map<string, Pedve005Record>()
  pedve005.forEach((r) => {
    if (r.pedido) p005Map.set(r.pedido, r)
  })

  const transpByDestino = new Map<string, TransportadoraRecord>()
  const transpByPadrao = new Map<string, TransportadoraRecord>()
  transportadoras.forEach((t) => {
    if (t.destino) {
      transpByDestino.set(t.destino.toUpperCase().trim(), t)
    }
    if (t.padrao_do_exceda) {
      transpByPadrao.set(t.padrao_do_exceda.toUpperCase().trim(), t)
    }
  })

  const header = EXPORT_COLUMNS.map((c) => escapeCsvCell(c.label)).join(';')
  const rows: string[] = [header]

  for (const p012 of pedve012) {
    const p005 = p005Map.get(p012.pedido)
    const cidadeKey = (p005?.cidade || '').toUpperCase().trim()
    const transp = transpByDestino.get(cidadeKey) || transpByPadrao.get(cidadeKey)

    const sourceMap: Record<CollectionSource, Record<string, unknown> | undefined> = {
      p012: p012 as unknown as Record<string, unknown>,
      p005: p005 as unknown as Record<string, unknown> | undefined,
      transp: transp as unknown as Record<string, unknown> | undefined,
    }

    const cells = EXPORT_COLUMNS.map((col) => {
      if (col.from === 'calculated') {
        const prevEntrParsed = parsePBDate(p012.prev_entr)
        const prazo = transp?.prazo_de_entrega
        if (col.key === 'data_sep' && prevEntrParsed && prazo) {
          return escapeCsvCell(formatDate(calcularDataSeparacao(prevEntrParsed, prazo)))
        }
        if (col.key === 'data_segura' && prevEntrParsed && prazo) {
          const dataSep = calcularDataSeparacao(prevEntrParsed, prazo)
          return escapeCsvCell(formatDate(calcularDataSegura(dataSep)))
        }
        return ''
      }
      const source = sourceMap[col.from]
      const rawValue = source ? source[col.key] : undefined
      return escapeCsvCell(formatFieldValue(col.key, rawValue))
    })
    rows.push(cells.join(';'))
  }

  const csv = rows.join('\r\n')
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  triggerDownload(csv, `pedidos_repress_${dateStr}.csv`)
}

const PEDVE005_EXPORT_COLUMNS: { key: string; label: string }[] = [
  { key: 'pedido', label: 'Pedido' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'status', label: 'Status' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'bairro', label: 'Bairro' },
  { key: 'tp_entrega', label: 'Tipo de Entrega' },
  { key: 'emissao', label: 'Emissão' },
  { key: 'prev_entr', label: 'Previsão de Entrega' },
  { key: 'vl_ped_rs', label: 'Valor (R$)' },
  { key: 'qtd_itens', label: 'Qtd. Itens' },
]

export function exportPedve005ToCSV(records: Pedve005Record[]) {
  const header = PEDVE005_EXPORT_COLUMNS.map((c) => escapeCsvCell(c.label)).join(';')
  const rows = records.map((r) => {
    const source = r as unknown as Record<string, unknown>
    return PEDVE005_EXPORT_COLUMNS.map((c) =>
      escapeCsvCell(formatFieldValue(c.key, source[c.key])),
    ).join(';')
  })
  const csv = [header, ...rows].join('\r\n')
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  triggerDownload(csv, `pedidos_sinteticos_${dateStr}.csv`)
}

const TRANSPORTADORAS_EXPORT_COLUMNS: { key: string; label: string }[] = [
  { key: 'destino', label: 'Destino' },
  { key: 'uf', label: 'UF' },
  { key: 'transportadora', label: 'Transportadora' },
  { key: 'padrao_do_exceda', label: 'Padrão do Exceda' },
  { key: 'prazo_de_entrega', label: 'Prazo de Entrega (dias)' },
  { key: 'prazo_transportadora', label: 'Prazo Transportadora' },
]

export function exportTransportadorasToCSV(records: TransportadoraRecord[]) {
  const header = TRANSPORTADORAS_EXPORT_COLUMNS.map((c) => escapeCsvCell(c.label)).join(';')
  const rows = records.map((r) => {
    const source = r as unknown as Record<string, unknown>
    return TRANSPORTADORAS_EXPORT_COLUMNS.map((c) =>
      escapeCsvCell(formatFieldValue(c.key, source[c.key])),
    ).join(';')
  })
  const csv = [header, ...rows].join('\r\n')
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  triggerDownload(csv, `transportadoras_${dateStr}.csv`)
}
