import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getAllPedve012, type Pedve012Record } from '@/services/pedve012'
import { getAllPedve005, type Pedve005Record } from '@/services/pedve005'
import { getAllTransportadoras, type TransportadoraRecord } from '@/services/transportadoras'
import { useRealtime } from '@/hooks/use-realtime'
import { ReportList, type ReportDefinition } from '@/components/reports/report-list'
import { ReportDetail } from '@/components/reports/report-detail'

const REPORTS: ReportDefinition[] = [
  {
    id: 'separacao',
    name: 'Separação e Data Segura',
    summary: 'Acompanhamento detalhado de prazos operacionais cruzados com SLA de transportadoras.',
  },
  {
    id: 'pedidos',
    name: 'Pedidos Geral',
    summary: 'Visão geral de todos os pedidos com status, valores e informações de entrega.',
  },
  {
    id: 'transportadoras',
    name: 'Transportadoras e Prazos',
    summary: 'Cadastro de transportadoras com prazos de entrega por destino e padrões.',
  },
]

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [pedve012, setPedve012] = useState<Pedve012Record[]>([])
  const [pedve005, setPedve005] = useState<Pedve005Record[]>([])
  const [transportadoras, setTransportadoras] = useState<TransportadoraRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [p012, p005, transp] = await Promise.all([
        getAllPedve012(),
        getAllPedve005(),
        getAllTransportadoras(),
      ])
      setPedve012(p012)
      setPedve005(p005)
      setTransportadoras(transp)
    } catch (err) {
      console.error('Failed to load report data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('pedve012', () => {
    loadData()
  })
  useRealtime('pedve005', () => {
    loadData()
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Carregando relatórios...
      </div>
    )
  }

  if (!selectedReport) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Gestão de Relatórios</h2>
          <p className="text-slate-500 text-sm mt-1">
            Selecione um relatório para visualizar os detalhes e aplicar filtros.
          </p>
        </div>
        <ReportList reports={REPORTS} onSelect={setSelectedReport} />
      </div>
    )
  }

  const report = REPORTS.find((r) => r.id === selectedReport)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedReport(null)}
          className="text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{report?.name}</h2>
          <p className="text-slate-500 text-sm mt-1">{report?.summary}</p>
        </div>
      </div>
      <ReportDetail
        reportId={selectedReport}
        pedve012={pedve012}
        pedve005={pedve005}
        transportadoras={transportadoras}
      />
    </div>
  )
}
