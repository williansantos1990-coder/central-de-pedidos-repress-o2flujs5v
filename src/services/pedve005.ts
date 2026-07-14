import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface Pedve005Record extends RecordModel {
  pedido: string
  emissao: string
  cliente: string
  status: string
  tp_estoque: string
  bairro: string
  cidade: string
  doc_remessa: string
  prev_entr: string
  rota: string
  tp_entrega: string
  receb_destino: string
  vl_ped_rs: number
  vl_ord_rem_rs: number
  cubagem_local_estoque: number
  volume_local_estoque: number
  qtd_itens: number
  observacao: string
  created: string
  updated: string
}

export async function getAllPedve005(): Promise<Pedve005Record[]> {
  return pb.collection('pedve005').getFullList<Pedve005Record>({ sort: '-created' })
}

export async function getPedve005Paginated(page: number, perPage: number, filter?: string) {
  return pb.collection('pedve005').getList<Pedve005Record>(page, perPage, {
    sort: '-created',
    filter: filter || '',
  })
}

export function buildPedve005Filter(opts: {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}): string {
  const parts: string[] = []
  const s = opts.search?.trim().replace(/"/g, '') || ''
  if (s) parts.push(`(pedido ~ "${s}" || cliente ~ "${s}" || cidade ~ "${s}")`)
  if (opts.status && opts.status !== 'all') parts.push(`status = "${opts.status}"`)
  if (opts.dateFrom) parts.push(`emissao >= "${opts.dateFrom}"`)
  if (opts.dateTo) parts.push(`emissao <= "${opts.dateTo}"`)
  return parts.join(' && ')
}
