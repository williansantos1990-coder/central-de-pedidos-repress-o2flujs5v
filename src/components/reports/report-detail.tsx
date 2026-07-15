import { SeparacaoReport } from '@/components/reports/separacao-report'
import { PedidosReport } from '@/components/reports/pedidos-report'
import { TransportadorasReport } from '@/components/reports/transportadoras-report'
import type { Pedve012Record } from '@/services/pedve012'
import type { Pedve005Record } from '@/services/pedve005'
import type { TransportadoraRecord } from '@/services/transportadoras'

interface ReportDetailProps {
  reportId: string
  pedve012: Pedve012Record[]
  pedve005: Pedve005Record[]
  transportadoras: TransportadoraRecord[]
}

export function ReportDetail({ reportId, pedve012, pedve005, transportadoras }: ReportDetailProps) {
  switch (reportId) {
    case 'separacao':
      return (
        <SeparacaoReport
          pedve012={pedve012}
          pedve005={pedve005}
          transportadoras={transportadoras}
        />
      )
    case 'pedidos':
      return (
        <PedidosReport pedve005={pedve005} pedve012={pedve012} transportadoras={transportadoras} />
      )
    case 'transportadoras':
      return <TransportadorasReport transportadoras={transportadoras} />
    default:
      return null
  }
}
