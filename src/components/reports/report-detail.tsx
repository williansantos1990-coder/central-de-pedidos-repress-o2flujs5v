import { SeparacaoReport } from '@/components/reports/separacao-report'
import { PerformanceMatrixReport } from '@/components/reports/performance-matrix-report'
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
    case 'performance':
      return <PerformanceMatrixReport pedve012={pedve012} />
    case 'separacao':
      return (
        <SeparacaoReport
          pedve012={pedve012}
          pedve005={pedve005}
          transportadoras={transportadoras}
        />
      )
    default:
      return null
  }
}
