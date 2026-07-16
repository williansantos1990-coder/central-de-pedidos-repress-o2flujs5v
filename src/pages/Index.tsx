import { useState, useMemo, useEffect, useCallback } from 'react'
import { getAllPedve012, type Pedve012Record } from '@/services/pedve012'
import { getAllPedve005, type Pedve005Record } from '@/services/pedve005'
import { getAllTransportadoras, type TransportadoraRecord } from '@/services/transportadoras'
import { InsightsSection } from '@/components/dashboard/insights-section'
import { parsePBDate, extractDateKey } from '@/lib/order-utils'
import { calculateSLAAdherence } from '@/lib/sla-utils'
import { MetricCard } from '@/components/dashboard/metric-card'
import { ChartsSection } from '@/components/dashboard/charts-section'
import { CascadingFilter } from '@/components/dashboard/cascading-filter'
import { GeographySection } from '@/components/dashboard/geography-section'
import { useCascadingFilters } from '@/hooks/use-cascading-filters'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { format } from 'date-fns'
import {
  Calendar as CalendarIcon,
  Loader2,
  Clock,
  ClipboardCheck,
  FileWarning,
  CheckCircle2,
  Flame,
  Download,
  X,
} from 'lucide-react'
import { exportDashboardToXlsx } from '@/lib/dashboard-export'
import { useToast } from '@/hooks/use-toast'

function formatDateLabel(dateKey: string): string {
  const d = parsePBDate(dateKey)
  return d ? format(d, 'dd/MM/yyyy') : dateKey
}

export default function Index() {
  const [pedve012, setPedve012] = useState<Pedve012Record[]>([])
  const [pedve005, setPedve005] = useState<Pedve005Record[]>([])
  const [transportadoras, setTransportadoras] = useState<TransportadoraRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

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
    } catch {
      /* intentionally ignored */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('pedve012', () => loadData())
  useRealtime('pedve005', () => loadData())
  useRealtime('transportadoras', () => loadData())

  const {
    selectedDate,
    selectedTipos,
    selectedSituacoes,
    selectedCidades,
    availableDates,
    availableTipos,
    availableSituacoes,
    availableCidades,
    setSelectedDate,
    setSelectedTipos,
    setSelectedSituacoes,
    setSelectedCidades,
    clearAll,
    filteredRecords: filtered012,
    hasActiveFilters,
  } = useCascadingFilters(pedve012)

  const filteredPedidos = useMemo(() => new Set(filtered012.map((p) => p.pedido)), [filtered012])

  const filtered005 = useMemo(
    () => pedve005.filter((o) => filteredPedidos.has(o.pedido)),
    [pedve005, filteredPedidos],
  )

  const metrics = useMemo(
    () => ({
      receita: filtered005.reduce((s, r) => s + (r.vl_ped_rs || 0), 0),
      pedidos: filtered012.length,
      finalizados: filtered012.filter((r) => r.transmitir_nfe).length,
      naoFinalizou: filtered012.filter((r) => r.envio_liberacao && !r.transmitir_nfe).length,
      pedidosLiberados: filtered012.filter((r) => r.envio_liberacao).length,
      itens: filtered012.reduce((s, r) => s + (r.nr_itens || 0), 0),
      volume: filtered012.reduce((s, r) => s + (r.volume_local_estoque || 0), 0),
      liberadosApos11h: filtered012.filter((r) => {
        const d = parsePBDate(r.envio_liberacao)
        return d ? d.getUTCHours() >= 11 : false
      }).length,
      urgentes: filtered012.filter((r) => {
        const envioKey = extractDateKey(r.envio_liberacao)
        const prevKey = extractDateKey(r.prev_entr)
        return envioKey && prevKey ? envioKey === prevKey : false
      }).length,
    }),
    [filtered005, filtered012],
  )

  const statusData = useMemo(() => {
    const c: Record<string, number> = {}
    filtered005.forEach((r) => {
      if (r.status) c[r.status] = (c[r.status] || 0) + 1
    })
    return Object.entries(c).map(([name, value]) => ({ name, value }))
  }, [filtered005])

  const slaResult = useMemo(
    () => calculateSLAAdherence(filtered012, filtered005, transportadoras),
    [filtered012, filtered005, transportadoras],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-end gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            Data da Liberação
            {availableDates.length === 0 && (
              <span className="text-[10px] text-orange-500 font-normal">(vazio)</span>
            )}
          </span>
          <Select
            value={selectedDate || 'all'}
            onValueChange={(v) => setSelectedDate(v === 'all' ? undefined : v)}
            disabled={availableDates.length === 0}
          >
            <SelectTrigger className="w-[240px] h-9">
              <SelectValue
                placeholder={availableDates.length === 0 ? 'Sem datas' : 'Data da Liberação'}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Datas</SelectItem>
              {availableDates.map((dateKey) => (
                <SelectItem key={dateKey} value={dateKey}>
                  {formatDateLabel(dateKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CascadingFilter
          label="Tipo de Entrega"
          placeholder="Todos os Tipos"
          options={availableTipos}
          selected={selectedTipos}
          onChange={setSelectedTipos}
          selectAllLabel="Todos os Tipos"
        />
        <CascadingFilter
          label="Cidade"
          placeholder="Todas as Cidades"
          options={availableCidades}
          selected={selectedCidades}
          onChange={setSelectedCidades}
          width="w-[200px]"
        />

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearAll} className="h-9 px-3 text-xs mb-0.5 gap-1">
            <X className="h-3.5 w-3.5" />
            Limpar Filtros
          </Button>
        )}

        <div className="text-sm text-slate-500 font-medium ml-auto self-end mb-1">
          Pedidos no período: {filtered012.length}
        </div>
        <Button
          onClick={() => {
            if (filtered012.length === 0) {
              toast({
                title: 'Nenhum pedido para exportar',
                description: 'Ajuste os filtros para incluir registros.',
              })
              return
            }
            setExporting(true)
            try {
              exportDashboardToXlsx({
                pedve012: filtered012,
                pedve005: filtered005,
                transportadoras,
              })
              toast({
                title: 'Exportação concluída',
                description: `${filtered012.length} pedido(s) exportado(s).`,
              })
            } catch {
              toast({
                title: 'Erro na exportação',
                description: 'Não foi possível gerar o arquivo.',
              })
            } finally {
              setExporting(false)
            }
          }}
          disabled={exporting || filtered012.length === 0}
          className="h-9 mb-0.5 gap-2"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exportar Dados
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard
          title="Pedidos Liberados"
          value={metrics.pedidosLiberados}
          icon={ClipboardCheck}
          iconColor="text-success"
          iconBg="bg-success/10"
        />
        <MetricCard
          title="Finalizados"
          value={metrics.finalizados}
          subtitle="Com transmissão NFe"
          icon={CheckCircle2}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <MetricCard
          title="Não Finalizou"
          value={metrics.naoFinalizou}
          subtitle="Liberados sem transmissão NFe"
          icon={FileWarning}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
        <MetricCard
          title="Pedidos Urgentes"
          value={metrics.urgentes}
          subtitle="Liberação na data da entrega"
          icon={Flame}
          iconColor="text-red-600"
          iconBg="bg-red-100"
        />
        <MetricCard
          title="Liberados após 11h"
          value={metrics.liberadosApos11h}
          subtitle="Liberação a partir das 11:00"
          icon={Clock}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
      </div>

      <ChartsSection statusData={statusData} slaData={slaResult.slaData} />
      <GeographySection records={filtered012} />

      <InsightsSection
        metrics={{
          pedidosLiberados: metrics.pedidosLiberados,
          finalizados: metrics.finalizados,
          naoFinalizou: metrics.naoFinalizou,
          pedidosUrgentes: metrics.urgentes,
          liberadosApos11h: metrics.liberadosApos11h,
          slaAderente: slaResult.aderente,
          slaForaDoSLA: slaResult.foraDoSLA,
          slaData: slaResult.slaData,
        }}
      />
    </div>
  )
}
