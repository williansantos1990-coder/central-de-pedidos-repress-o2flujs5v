import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface Pedve012Record extends RecordModel {
  pedido: string
  situacao: string
  nota_fiscal: string
  cod_cliente: string
  cliente: string
  uf: string
  cidade: string
  bairro: string
  grupo: string
  tipo_entrega: string
  qtd_total: number
  nr_itens: number
  nr_ends: number
  cubagem_local_estoque: string
  volume_local_estoque: number
  emissao: string
  prev_entr: string
  envio_liberacao: string
  transmitir_nfe: string
  liberacao: string
  inicio_sep: string
  termino_sep: string
  transito: string
  entrega: string
  nfe_transmitida: string
  colocado_transito: string
  marcado_entrega: string
  created: string
  updated: string
}

export async function getAllPedve012(): Promise<Pedve012Record[]> {
  return pb.collection('pedve012').getFullList<Pedve012Record>({ sort: '-created' })
}

export async function getPedve012Paginated(page: number, perPage: number, filter?: string) {
  return pb.collection('pedve012').getList<Pedve012Record>(page, perPage, {
    sort: '-created',
    filter: filter || '',
  })
}

export function buildPedve012Filter(opts: {
  search?: string
  uf?: string
  situacao?: string
  dateFrom?: string
  dateTo?: string
}): string {
  const parts: string[] = []
  const s = opts.search?.trim().replace(/"/g, '') || ''
  if (s) parts.push(`(pedido ~ "${s}" || cliente ~ "${s}" || cidade ~ "${s}")`)
  if (opts.uf && opts.uf !== 'all') parts.push(`uf = "${opts.uf}"`)
  if (opts.situacao && opts.situacao !== 'all') parts.push(`situacao = "${opts.situacao}"`)
  if (opts.dateFrom) parts.push(`emissao >= "${opts.dateFrom}"`)
  if (opts.dateTo) parts.push(`emissao <= "${opts.dateTo}"`)
  return parts.join(' && ')
}
