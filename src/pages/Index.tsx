import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { mockOrders, heatmapMonths, heatmapDataByDay } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Clock, AlertTriangle, Info, Calendar as CalendarIcon } from 'lucide-react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Label,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { format, isSameDay, getHours } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function getHeatmapColor(percent: number | null | undefined) {
  if (percent === null || percent === undefined) return ''
  if (percent >= 90) return 'bg-[#ffe599] text-[#786011]' // Yellow
  if (percent >= 60) return 'bg-[#f8cbad] text-[#8a4b24]' // Light Orange
  return 'bg-[#ea9999] text-[#7a2020]' // Red
}

// Donut Chart Colors
const PIE_COLORS = ['hsl(var(--success))', 'hsl(var(--destructive))']

export default function Index() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const filteredOrders = useMemo(() => {
    if (!selectedDate) return mockOrders
    return mockOrders.filter((o) => isSameDay(o.envioLiberacao, selectedDate))
  }, [selectedDate])

  const metrics = useMemo(() => {
    const baseData = filteredOrders

    const liberadosHoje = baseData.length
    const aguardandoSep = baseData.filter((o) => o.status === 'Aguardando Separação').length

    const emFluxoGargalo = baseData.filter((o) =>
      ['Em Separação', 'Conferência', 'Faturado'].includes(o.status),
    ).length
    const pctGargalo = baseData.length ? Math.round((emFluxoGargalo / baseData.length) * 100) : 0

    const posCorte = baseData.filter((o) => getHours(o.envioLiberacao) >= 11).length

    return { liberadosHoje, aguardandoSep, pctGargalo, posCorte }
  }, [filteredOrders])

  const statusData = useMemo(() => {
    const statusCount = filteredOrders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    return Object.entries(statusCount).map(([name, value]) => ({ name, value }))
  }, [filteredOrders])

  const slaData = useMemo(() => {
    let noPrazo = 0
    let atrasado = 0
    filteredOrders.forEach((o) => {
      if (o.situacao === 'Atrasado') atrasado++
      else noPrazo++
    })
    return [
      { name: 'No Prazo', value: noPrazo },
      { name: 'Atrasado', value: atrasado },
    ]
  }, [filteredOrders])

  // SLA inner label calculation
  const totalSla = slaData.reduce((acc, curr) => acc + curr.value, 0)
  const slaCompliancePercent = totalSla > 0 ? Math.round((slaData[0].value / totalSla) * 100) : 0

  return (
    <div className="space-y-6 pb-8">
      {/* Top Bar / Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
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
        </div>
        <div className="text-sm text-slate-500 font-medium">
          Pedidos no período: {filteredOrders.length}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-subtle hover:shadow-md transition-shadow border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">Total Liberado</CardTitle>
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Package className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{metrics.liberadosHoje}</div>
            <p className="text-xs text-slate-500 mt-1">Pedidos no período selecionado</p>
          </CardContent>
        </Card>

        <Card className="shadow-subtle hover:shadow-md transition-shadow border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Aguardando Separação
            </CardTitle>
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{metrics.aguardandoSep}</div>
            <p className="text-xs text-slate-500 mt-1">Pedidos aguardando picking</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'shadow-subtle hover:shadow-md transition-all border-slate-200/60 relative overflow-hidden',
            metrics.pctGargalo > 30 && 'border-warning/50 bg-warning/5',
          )}
        >
          {metrics.pctGargalo > 30 && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-warning/10 rounded-bl-full -z-0"></div>
          )}
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Gargalo Operacional
            </CardTitle>
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                metrics.pctGargalo > 30
                  ? 'bg-warning/20 text-warning animate-pulse-ring'
                  : 'bg-warning/10 text-warning',
              )}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-slate-800">{metrics.pctGargalo}%</div>
            <p className="text-xs text-slate-500 mt-1">Em trânsito int. (Separação - NFe)</p>
          </CardContent>
        </Card>

        <Card className="shadow-subtle hover:shadow-md transition-shadow border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Fora do Horário (Pós 11h)
            </CardTitle>
            <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center text-destructive">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">{metrics.posCorte}</div>
            <p className="text-xs text-slate-500 mt-1">Pedidos liberados pós-corte</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-subtle border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">
              Estágio Operacional (Pedidos Liberados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ChartContainer
                config={{
                  value: { color: 'hsl(var(--primary))' },
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        value.length > 12 ? value.substring(0, 12) + '...' : value
                      }
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="value"
                      name="Pedidos"
                      fill="var(--color-value)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] w-full flex items-center justify-center text-slate-400">
                Nenhum dado para o período
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-subtle border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center justify-between">
              Cumprimento de SLA (Operação Global)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalSla > 0 ? (
              <ChartContainer config={{}} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={slaData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {slaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-slate-800 text-3xl font-bold"
                                >
                                  {slaCompliancePercent}%
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 20}
                                  className="fill-slate-500 text-xs"
                                >
                                  No Prazo
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] w-full flex items-center justify-center text-slate-400">
                Nenhum dado para o período
              </div>
            )}
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-3 h-3 rounded-full bg-success"></div>
                No Prazo: <span className="font-semibold">{slaData[0].value}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-3 h-3 rounded-full bg-destructive"></div>
                Atrasado: <span className="font-semibold">{slaData[1].value}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Grid Section */}
      <Card className="shadow-subtle border-slate-200/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Volume Operacional (Pedidos x Faturado)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="overflow-x-auto relative">
            <table className="w-full border-collapse text-[11px] sm:text-xs min-w-[700px]">
              <thead>
                <tr>
                  <th className="border border-slate-300 p-1.5 bg-slate-100 text-slate-700 font-bold w-10 text-center sticky left-0 z-10">
                    Dia
                  </th>
                  {heatmapMonths.map((m) => (
                    <th
                      key={m}
                      colSpan={3}
                      className="border border-slate-300 p-1.5 bg-slate-100 text-slate-700 font-bold capitalize text-center"
                    >
                      {m}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="border border-slate-300 p-1.5 bg-slate-50 sticky left-0 z-10"></th>
                  {heatmapMonths.map((m) => (
                    <React.Fragment key={m + '-sub'}>
                      <th className="border border-slate-300 p-1.5 bg-slate-50 font-semibold text-slate-600 text-center w-16">
                        Pedidos
                      </th>
                      <th className="border border-slate-300 p-1.5 bg-slate-50 font-semibold text-slate-600 text-center w-16">
                        Faturado
                      </th>
                      <th className="border border-slate-300 p-1.5 bg-slate-50 font-semibold text-slate-600 text-center w-16">
                        %
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <tr key={day} className="hover:bg-slate-50/50">
                    <td className="border border-slate-300 p-1.5 text-center font-bold bg-slate-50 text-slate-700 sticky left-0 z-10">
                      {day}
                    </td>
                    {heatmapMonths.map((m) => {
                      const d = heatmapDataByDay[day]?.[m]
                      return (
                        <React.Fragment key={`${day}-${m}`}>
                          <td className="border border-slate-300 p-1.5 text-center text-slate-700">
                            {d?.p ?? ''}
                          </td>
                          <td className="border border-slate-300 p-1.5 text-center text-slate-700">
                            {d?.f ?? ''}
                          </td>
                          <td
                            className={cn(
                              'border border-slate-300 p-1.5 text-center',
                              getHeatmapColor(d?.pct),
                            )}
                          >
                            {d?.pct !== null && d?.pct !== undefined
                              ? `${d.pct.toFixed(2).replace('.', ',')}%`
                              : ''}
                          </td>
                        </React.Fragment>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights Section */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 relative overflow-hidden mt-6">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
        <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-3">
          <Info className="w-4 h-4" /> Insights Automáticos
        </h3>
        <ul className="space-y-2">
          <li className="text-sm text-slate-700 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0"></span>
            Acompanhe o volume diário de liberação vs faturamento para identificar desvios de
            capacidade no <strong>Volume Operacional</strong>.
          </li>
          <li className="text-sm text-slate-700 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0"></span>
            Existem <strong>{metrics.posCorte} pedidos</strong> no período liberados após as 11:00h
            que impactarão a Data Segura da operação do dia seguinte.
          </li>
          <li className="text-sm text-slate-700 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0"></span>
            A taxa global de SLA monitora o cumprimento do prazo acordado com as transportadoras
            para toda a operação.
          </li>
        </ul>
      </div>
    </div>
  )
}
