import { useState, useMemo, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { getAllPedve012, type Pedve012Record } from '@/services/pedve012'
import { getAllPedve005, type Pedve005Record } from '@/services/pedve005'
import { getAllTransportadoras, type TransportadoraRecord } from '@/services/transportadoras'
import { parsePBDate, formatCurrency, formatNumber } from '@/lib/order-utils'
import { MetricCard } from '@/components/dashboard/metric-card'
import { ChartsSection } from '@/components/dashboard/charts-section'
import { GeographySection } from '@/components/dashboard/geography-section'
import { LogisticsSection } from '@/components/dashboard/logistics-section'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { format, isSameDay } from 'date-fns'
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

export default function Index() {
  const [pedve012, setPedve012] = useState<Pedve012Record[]>([])
  const [pedve005, setPedve005] = useState<Pedve005Record[]>([])
  const [transportadoras, setTransportadoras] = useState<TransportadoraRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedSituacao, setSelectedSituacao] = useState('all')

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

  const filtered012 = useMemo(() => {
    let r = pedve012
    if (selectedDate)
      r = r.filter((o) => {
        const d = parsePBDate(o.emissao)
        return d && isSameDay(d, selectedDate)
      })
    if (selectedSituacao !== 'all') r = r.filter((o) => o.situacao === selectedSituacao)
    return r
  }, [pedve012, selectedDate, selectedSituacao])

  const filtered005 = useMemo(() => {
    if (!selectedDate) return pedve005
    return pedve005.filter((o) => {
      const d = parsePBDate(o.emissao)
      return d && isSameDay(d, selectedDate)
    })
  }, [pedve005, selectedDate])

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
    filtered005.forEach((r) => {
      const d = parsePBDate(r.emissao)
      if (d) {
        const k = format(d, 'MM/yyyy')
        c[k] = (c[k] || 0) + 1
      }
    })
    return Object.entries(c)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [filtered005])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center gap-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[240px] justify-start text-left font-normal',
                !selectedDate && 'text-slate-500',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : <span>Período Completo</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {selectedDate && (
          <Button
            variant="ghost"
            onClick={() => setSelectedDate(undefined)}
            className="h-9 px-3 text-xs"
          >
            Limpar
          </Button>
        )}
        <Select value={selectedSituacao} onValueChange={setSelectedSituacao}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Situações</SelectItem>
            <SelectItem value="Normal">Normal</SelectItem>
            <SelectItem value="Atrasado">Atrasado</SelectItem>
            <SelectItem value="Gargalo">Gargalo</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-slate-500 font-medium ml-auto">
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
        </ul>
      </div>
    </div>
  )
}
