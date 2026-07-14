import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface TransportadoraRecord extends RecordModel {
  destino: string
  uf: string
  transportadora: string
  padrao_do_exceda: string
  prazo_de_entrega: number
  prazo_transportadora: string
  created: string
  updated: string
}

export async function getAllTransportadoras(): Promise<TransportadoraRecord[]> {
  return pb.collection('transportadoras').getFullList<TransportadoraRecord>({ sort: 'destino' })
}
