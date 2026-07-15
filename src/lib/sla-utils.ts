import { differenceInCalendarDays } from 'date-fns'
import type { Pedve012Record } from '@/services/pedve012'
import type { Pedve005Record } from '@/services/pedve005'
import type { TransportadoraRecord } from '@/services/transportadoras'
import { parsePBDate } from '@/lib/order-utils'

export interface SLAResult {
  aderente: number
  foraDoSLA: number
  semTransportadora: number
  total: number
  slaData: { name: string; value: number }[]
}

export function calculateSLAAdherence(
  pedve012: Pedve012Record[],
  pedve005: Pedve005Record[],
  transportadoras: TransportadoraRecord[],
): SLAResult {
  const pedidoCidadeMap = new Map<string, string>()
  pedve005.forEach((p) => {
    if (p.pedido && p.cidade) {
      pedidoCidadeMap.set(p.pedido, p.cidade.toUpperCase().trim())
    }
  })

  const cidadePrazoMap = new Map<string, number>()
  transportadoras.forEach((t) => {
    if (t.padrao_do_exceda && t.prazo_de_entrega != null) {
      cidadePrazoMap.set(t.padrao_do_exceda.toUpperCase().trim(), t.prazo_de_entrega)
    }
  })

  let aderente = 0
  let foraDoSLA = 0
  let semTransportadora = 0

  pedve012.forEach((p) => {
    const envio = parsePBDate(p.envio_liberacao)
    const prevEntr = parsePBDate(p.prev_entr)
    if (!envio || !prevEntr) return

    const cidade = pedidoCidadeMap.get(p.pedido)
    if (!cidade) {
      semTransportadora++
      return
    }

    const prazo = cidadePrazoMap.get(cidade)
    if (prazo == null) {
      semTransportadora++
      return
    }

    const diffDays = differenceInCalendarDays(prevEntr, envio)

    if (diffDays <= prazo) {
      aderente++
    } else {
      foraDoSLA++
    }
  })

  const total = aderente + foraDoSLA
  const slaData = [
    { name: 'Aderente', value: aderente },
    { name: 'Fora do SLA', value: foraDoSLA },
  ]

  return { aderente, foraDoSLA, semTransportadora, total, slaData }
}
