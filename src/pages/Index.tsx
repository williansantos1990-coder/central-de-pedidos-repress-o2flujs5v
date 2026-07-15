import { useState, useMemo, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { getAllPedve012, type Pedve012Record } from '@/services/pedve012'
import { getAllPedve005, type Pedve005Record } from '@/services/pedve005'
import { InsightsSection } from '@/components/dashboard/insights-section'
import { parsePBDate } from '@/lib/order-utils'
import { MetricCard } from '@/components/dashboard/metric-card'
import { ChartsSection } from '@/components/dashboard/charts-section'
import { TipoEntregaFilter } from '@/components/dashboard/tipo-entrega-filter'
import { GeographySection } from '@/components/dashboard/geography-section'
import { generateInsights } from '@/services/insights'
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
  Package,
  DollarSign,
  Boxes,
  Ruler,
  Calendar as CalendarIcon,
  Loader2,
  Clock,
  ClipboardCheck,
  FileWarning,
  CheckCircle2,
  Flame,
} from 'lucide-react'

function extractDateKey(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const d = parsePBDate(dateStr)
  if (!d) return null
  return format(d, 'yyyy-MM-dd')
}

function formatDateLabel(dateKey: string): string {
  const d = parsePBDate(dateKey)
  if (!d) return dateKey
  return format(d, 'dd/MM/yyyy')
}

export default function Index() {
  const [pedve012, setPedve012] = useState<Pedve012Record[]>([])
  const [pedve005, setPedve005] = useState<Pedve005Record[]>([])

  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [selectedTipos, setSelectedTipos] = useState<string[]>([])

  const loadData = useCallback(async () => {
    try {
      const [p012, p005] = await Promise.all([getAllPedve012(), getAllPedve005()])
      setPedve012(p012)
      setPedve005(p005)
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

  const availableDates = useMemo(() => {
    const dateSet = new Set<string>()
    pedve012.forEach((r) => {
      const key = extractDateKey(r.envio_liberacao)
      if (key) dateSet.add(key)
    })
    return Array.from(dateSet).sort((a, b) => a.localeCompare(b))
  }, [pedve012])

  const availableTiposEntrega = useMemo(() => {
    const set = new Set<string>()
    pedve012.forEach((r) => {
      if (r.tipo_entrega) set.add(r.tipo_entrega)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [pedve012])

  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      setSelectedDate(availableDates[availableDates.length - 1])
    }
    if (selectedDate && availableDates.length > 0 && !availableDates.includes(selectedDate)) {
      setSelectedDate(availableDates[availableDates.length - 1])
    }
  }, [availableDates, selectedDate])

  const filtered012 = useMemo(() => {
    let r = pedve012
    if (selectedDate) {
      r = r.filter((o) => extractDateKey(o.envio_liberacao) === selectedDate)
    }
    if (selectedTipos.length > 0) {
      r = r.filter((o) => selectedTipos.includes(o.tipo_entrega || ''))
    }
    return r
  }, [pedve012, selectedDate, selectedTipos])

  const filteredPedidos = useMemo(() => {
    return new Set(filtered012.map((p) => p.pedido))
  }, [filtered012])

  const filtered005 = useMemo(() => {
    return pedve005.filter((o) => filteredPedidos.has(o.pedido))
  }, [pedve005, filteredPedidos])

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
        if (!d) return false
        return d.getUTCHours() >= 11
      }).length,
      urgentes: filtered012.filter((r) => {
        const envioKey = extractDateKey(r.envio_liberacao)
        const prevKey = extractDateKey(r.prev_entr)
        if (!envioKey || !prevKey) return false
        return envioKey === prevKey
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

  const situacaoData = useMemo(() => {
    const c: Record<string, number> = {}
    filtered012.forEach((r) => {
      if (r.situacao) c[r.situacao] = (c[r.situacao] || 0) + 1
    })
    return Object.entries(c).map(([name, value]) => ({ name, value }))
  }, [filtered012])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-end gap-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            Data da Liberação
          </span>
          <Select
            value={selectedDate || 'all'}
            onValueChange={(v) => setSelectedDate(v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="w-[240px] h-9">
              <SelectValue placeholder="Data da Liberação" />
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
        {selectedDate && (
          <Button
            variant="ghost"
            onClick={() => setSelectedDate(undefined)}
            className="h-9 px-3 text-xs mb-0.5"
          >
            Limpar
          </Button>
        )}
        <TipoEntregaFilter
          options={availableTiposEntrega}
          selected={selectedTipos}
          onChange={setSelectedTipos}
        />
        <div className="text-sm text-slate-500 font-medium ml-auto self-end mb-1">
          Pedidos no período: {filtered012.length}
        </div>
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

      <ChartsSection statusData={statusData} situacaoData={situacaoData} />
      <GeographySection records={filtered012} />

      <InsightsSection
        metrics={{
          pedidosLiberados: metrics.pedidosLiberados,
          finalizados: metrics.finalizados,
          naoFinalizou: metrics.naoFinalizou,
          pedidosUrgentes: metrics.urgentes,
          liberadosApos11h: metrics.liberadosApos11h,
          slaData: situacaoData,
        }}
      />
    </div>
  )
}
