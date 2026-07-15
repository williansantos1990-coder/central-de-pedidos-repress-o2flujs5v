import { useState, useMemo, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { getAllPedve012, type Pedve012Record } from '@/services/pedve012'
import { getAllPedve005, type Pedve005Record } from '@/services/pedve005'
import { getAllTransportadoras, type TransportadoraRecord } from '@/services/transportadoras'
import { parsePBDate, formatCurrency, formatNumber } from '@/lib/order-utils'
import { MetricCard } from '@/components/dashboard/metric-card'
import { ChartsSection } from '@/components/dashboard/charts-section'
import { TipoEntregaFilter } from '@/components/dashboard/tipo-entrega-filter'
import { GeographySection } from '@/components/dashboard/geography-section'
import { LogisticsSection } from '@/components/dashboard/logistics-section'
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
  Info,
  Calendar as CalendarIcon,
  Loader2,
  Cuboid,
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
  const [transportadoras, setTransportadoras] = useState<TransportadoraRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [selectedTipos, setSelectedTipos] = useState<string[]>([])

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
      itens: filtered012.reduce((s, r) => s + (r.nr_itens || 0), 0),
      volume: filtered012.reduce((s, r) => s + (r.volume_local_estoque || 0), 0),
      cubagem: filtered012.reduce((s, r) => s + (r.cubagem_local_estoque || 0), 0),
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

  const timeData = useMemo(() => {
    const c: Record<string, number> = {}
    pedve012.forEach((r) => {
      const key = extractDateKey(r.envio_liberacao)
      if (key) {
        const monthKey = key.substring(0, 7)
        c[monthKey] = (c[monthKey] || 0) + 1
      }
    })
    return Object.entries(c)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [pedve012])

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
          title="Receita Total"
          value={formatCurrency(metrics.receita)}
          subtitle="Soma de vl_ped_rs (PEDVE005)"
          icon={DollarSign}
          iconColor="text-success"
          iconBg="bg-success/10"
        />
        <MetricCard
          title="Total de Pedidos"
          value={metrics.pedidos}
          subtitle="Registros em PEDVE012"
          icon={Package}
        />
        <MetricCard
          title="Itens Processados"
          value={formatNumber(metrics.itens)}
          subtitle="Soma de nr_itens (PEDVE012)"
          icon={Boxes}
          iconColor="text-amber-600"
          iconBg="bg-amber-100"
        />
        <MetricCard
          title="Volume Total"
          value={formatNumber(metrics.volume)}
          subtitle="Soma de volume_local_estoque"
          icon={Ruler}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <MetricCard
          title="Cubagem Total"
          value={formatNumber(metrics.cubagem)}
          subtitle="Soma de cubagem_local_estoque"
          icon={Cuboid}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
      </div>

      <ChartsSection statusData={statusData} situacaoData={situacaoData} timeData={timeData} />
      <GeographySection records={filtered012} />
      <LogisticsSection transportadoras={transportadoras} pedve012={filtered012} />

      <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-3">
          <Info className="w-4 h-4" /> Insights Automáticos
        </h3>
        <ul className="space-y-2">
          <li className="text-sm text-slate-700 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
            <strong>{metrics.pedidos} pedidos</strong> rastreados com{' '}
            <strong>{formatNumber(metrics.itens)} itens</strong> processados no período.
          </li>
          <li className="text-sm text-slate-700 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
            Receita total de <strong>{formatCurrency(metrics.receita)}</strong> no período
            selecionado.
          </li>
          {situacaoData.find((s) => s.name === 'Atrasado') && (
            <li className="text-sm text-slate-700 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
              <strong>
                {situacaoData.find((s) => s.name === 'Atrasado')?.value} pedidos atrasados
              </strong>{' '}
              que exigem atenção imediata.
            </li>
          )}
          {situacaoData.find((s) => s.name === 'Gargalo') && (
            <li className="text-sm text-slate-700 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <strong>
                {situacaoData.find((s) => s.name === 'Gargalo')?.value} pedidos em gargalo
              </strong>{' '}
              operacional identificados.
            </li>
          )}
          {selectedDate && (
            <li className="text-sm text-slate-700 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              Filtrando por data de liberação: <strong>{formatDateLabel(selectedDate)}</strong>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
